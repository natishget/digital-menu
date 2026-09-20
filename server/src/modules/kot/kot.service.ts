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
    };

    for (const item of order.items) {
      stationMap[item.fulfillmentStation].push(item);
    }

    const createdTickets: any[] = [];

    for (const station of [FulfillmentStation.BARISTA, FulfillmentStation.KITCHEN]) {
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
      }
    }

    return createdTickets;
  }

  async getStationTickets(station: FulfillmentStation) {
    const tickets = await this.prisma.kotTicket.findMany({
      where: {
        station,
        status: { in: [KotStatus.PENDING, KotStatus.PREPARING] },
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
    return updatedTicket;
  }
}
