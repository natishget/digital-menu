import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../realtime/events.gateway';
import { FulfillmentStation, KotStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class KotService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async splitAndRouteKotTickets(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            itemModifiers: true,
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found for KOT routing');

    // Group items by station
    const stationMap: Record<FulfillmentStation, typeof order.items> = {
      [FulfillmentStation.BARISTA]: [],
      [FulfillmentStation.KITCHEN]: [],
      [FulfillmentStation.CHICKEN]: [],
    };

    for (const item of order.items) {
      if (stationMap[item.fulfillmentStation]) {
        stationMap[item.fulfillmentStation].push(item);
      }
    }

    const createdTickets: any[] = [];
    let chickenTicketCreated = false;

    for (const station of [
      FulfillmentStation.BARISTA,
      FulfillmentStation.KITCHEN,
      FulfillmentStation.CHICKEN,
    ]) {
      const stationItems = stationMap[station];
      if (stationItems.length > 0) {
        const ticketNumber = `KOT-#${order.orderNumber}-${station.substring(0, 3)}`;

        // Check if ticket already exists for idempotency
        let ticket = await this.prisma.kotTicket.findFirst({
          where: { orderId: order.id, station },
        });

        if (!ticket) {
          ticket = await this.prisma.kotTicket.create({
            data: {
              orderId: order.id,
              ticketNumber,
              station,
              status: KotStatus.PENDING,
            },
          });
        }

        createdTickets.push({ ...ticket, items: stationItems });
        this.eventsGateway.emitKotTicketUpdated({ ...ticket, items: stationItems, tableNumber: order.tableId });
        if (station === FulfillmentStation.CHICKEN) {
          chickenTicketCreated = true;
        }
      }
    }

    if (chickenTicketCreated) {
      this.eventsGateway.emitChickenQueueUpdated();
    }

    return createdTickets;
  }

  async getStationTickets(station: FulfillmentStation) {
    const tickets = await this.prisma.kotTicket.findMany({
      where: {
        station,
        status: { in: [KotStatus.PENDING, KotStatus.PREPARING, KotStatus.READY] },
        order: {
          status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        order: {
          include: {
            table: true,
            items: {
              include: {
                itemModifiers: true,
              },
            },
          },
        },
      },
    });

    return tickets.map((t) => ({
      ...t,
      items: t.order.items.filter((i) => i.fulfillmentStation === station),
    }));
  }

  async updateTicketStatus(ticketId: string, status: KotStatus) {
    const ticket = await this.prisma.kotTicket.findUnique({
      where: { id: ticketId },
      include: { order: true },
    });

    if (!ticket) throw new NotFoundException('KOT Ticket not found');

    const updateData: any = { status };
    if (status === KotStatus.PREPARING && !ticket.prepStartedAt) {
      updateData.prepStartedAt = new Date();
    } else if (status === KotStatus.READY) {
      updateData.readyAt = new Date();
    }

    const updatedTicket = await this.prisma.kotTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Also update order status if master order is currently CONFIRMED or PREPARING
    if (status === KotStatus.PREPARING && ticket.order.status === OrderStatus.CONFIRMED) {
      await this.prisma.order.update({
        where: { id: ticket.orderId },
        data: { status: OrderStatus.PREPARING },
      });
      this.eventsGateway.emitOrderStatusChanged(ticket.orderId, OrderStatus.PREPARING);
    }

    // Check if ALL KOT tickets for this order are READY
    const allOrderTickets = await this.prisma.kotTicket.findMany({
      where: { orderId: ticket.orderId },
    });

    const allReady = allOrderTickets.every((t) => t.status === KotStatus.READY);
    if (allReady) {
      await this.prisma.order.update({
        where: { id: ticket.orderId },
        data: { status: OrderStatus.READY },
      });
      this.eventsGateway.emitOrderStatusChanged(ticket.orderId, OrderStatus.READY);
    }

    this.eventsGateway.emitKotTicketUpdated(updatedTicket);
    if (updatedTicket.station === FulfillmentStation.CHICKEN) {
      this.eventsGateway.emitChickenQueueUpdated(updatedTicket);
    }
    return updatedTicket;
  }

  async completeOrderFromKot(ticketId: string) {
    const ticket = await this.prisma.kotTicket.findUnique({
      where: { id: ticketId },
      include: { order: true },
    });

    if (!ticket) throw new NotFoundException('KOT Ticket not found');

    // Update master order status to COMPLETED
    const updatedOrder = await this.prisma.order.update({
      where: { id: ticket.orderId },
      data: { status: OrderStatus.COMPLETED },
      include: { table: true, items: true, payments: true },
    });

    // Update all tickets for this order to READY
    await this.prisma.kotTicket.updateMany({
      where: { orderId: ticket.orderId },
      data: { status: KotStatus.READY, readyAt: new Date() },
    });

    this.eventsGateway.emitOrderStatusChanged(ticket.orderId, OrderStatus.COMPLETED, updatedOrder);
    this.eventsGateway.emitChickenQueueUpdated();
    return updatedOrder;
  }

  async getChickenQueue(currentOrderId?: string) {
    const tickets = await this.prisma.kotTicket.findMany({
      where: {
        station: FulfillmentStation.CHICKEN,
        status: { in: [KotStatus.PENDING, KotStatus.PREPARING, KotStatus.READY] },
        order: {
          status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        order: {
          include: {
            table: true,
            items: {
              include: {
                itemModifiers: true,
              },
            },
          },
        },
      },
    });

    const cookingTickets: any[] = [];
    const waitingTickets: any[] = [];
    const readyTickets: any[] = [];

    for (const t of tickets) {
      if (t.status === KotStatus.PREPARING) {
        cookingTickets.push(t);
      } else if (t.status === KotStatus.PENDING) {
        waitingTickets.push(t);
      } else if (t.status === KotStatus.READY) {
        readyTickets.push(t);
      }
    }

    // Public sanitize helper: food items and status only, NO customer name, NO customer phone, NO price
    const formatTicket = (t: any, positionInLine: number | null) => {
      const chickenItems = t.order.items
        .filter((item: any) => item.fulfillmentStation === FulfillmentStation.CHICKEN)
        .map((item: any) => ({
          itemNameEn: item.historicalItemNameEn,
          itemNameAm: item.historicalItemNameAm,
          quantity: item.quantity,
          modifiers: item.itemModifiers.map((m: any) => ({
            nameEn: m.historicalModifierNameEn,
            nameAm: m.historicalModifierNameAm,
          })),
        }));

      const isCurrentCustomer = currentOrderId ? t.orderId === currentOrderId : false;

      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        orderId: t.orderId,
        orderNumber: t.order.orderNumber,
        status: t.status,
        positionInLine,
        prepStartedAt: t.prepStartedAt,
        readyAt: t.readyAt,
        createdAt: t.createdAt,
        items: chickenItems,
        isCurrentCustomer,
      };
    };

    const formattedCooking = cookingTickets.map((t) => formatTicket(t, null));
    const formattedWaiting = waitingTickets.map((t, idx) => formatTicket(t, idx + 1));
    const formattedReady = readyTickets.map((t) => formatTicket(t, null));

    let currentCustomerStatus: any = null;
    if (currentOrderId) {
      const all = [...formattedCooking, ...formattedWaiting, ...formattedReady];
      const match = all.find((t) => t.isCurrentCustomer);
      if (match) {
        currentCustomerStatus = {
          found: true,
          ticketNumber: match.ticketNumber,
          orderNumber: match.orderNumber,
          status: match.status,
          positionInLine: match.positionInLine,
          ordersAhead: match.positionInLine ? match.positionInLine - 1 : 0,
          items: match.items,
        };
      } else {
        currentCustomerStatus = { found: false };
      }
    }

    return {
      totalActive: tickets.length,
      cookingCount: cookingTickets.length,
      waitingCount: waitingTickets.length,
      readyCount: readyTickets.length,
      currentCustomerStatus,
      cooking: formattedCooking,
      waiting: formattedWaiting,
      ready: formattedReady,
      all: [...formattedCooking, ...formattedWaiting, ...formattedReady],
    };
  }
}
