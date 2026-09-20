import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TablesService } from '../tables/tables.service';
import { KotService } from '../kot/kot.service';
import { EventsGateway } from '../realtime/events.gateway';
import { OrderStatus, ServiceModel, PaymentMethod, PaymentStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private tablesService: TablesService,
    private kotService: KotService,
    private eventsGateway: EventsGateway,
  ) {}

  async createOrder(dto: CreateOrderDto, isWaiterPunch = false) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const validResult = await this.tablesService.validateQrToken(dto.tableId, dto.qrToken || '');
    if (!validResult.valid || !validResult.table) {
      throw new BadRequestException(validResult.message || 'Invalid table or QR token session');
    }

    const tableRecord = validResult.table;
    const effectiveServiceModel = validResult.effectiveServiceModel;

    // Fetch DB Menu Items & Modifier Options to calculate authoritative totals
    let calculatedSubtotal = 0;
    const itemRecordsToCreate: any[] = [];

    for (const cartItem of dto.items) {
      if (cartItem.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than zero');
      }

      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: cartItem.menuItemId },
        include: {
          modifierGroups: {
            include: { modifierOptions: true },
          },
        },
      });

      if (!menuItem || !menuItem.isAvailable) {
        throw new BadRequestException(`Item ${cartItem.menuItemId} is not available`);
      }

      const basePrice = Number(menuItem.price);
      let itemModifiersTotal = 0;
      const modifierRecordsToCreate: any[] = [];

      if (cartItem.selectedModifierOptionIds && cartItem.selectedModifierOptionIds.length > 0) {
        for (const optId of cartItem.selectedModifierOptionIds) {
          const opt = await this.prisma.modifierOption.findUnique({
            where: { id: optId },
          });

          if (opt && opt.isAvailable) {
            const adjPrice = Number(opt.priceAdjustment);
            itemModifiersTotal += adjPrice;
            modifierRecordsToCreate.push({
              modifierOptionId: opt.id,
              historicalModifierNameEn: opt.nameEn,
              historicalModifierNameAm: opt.nameAm,
              historicalPrice: adjPrice,
            });
          }
        }
      }

      const singleUnitTotal = basePrice + itemModifiersTotal;
      const lineItemSubtotal = singleUnitTotal * cartItem.quantity;
      calculatedSubtotal += lineItemSubtotal;

      itemRecordsToCreate.push({
        menuItemId: menuItem.id,
        historicalItemNameEn: menuItem.nameEn,
        historicalItemNameAm: menuItem.nameAm,
        historicalPrice: basePrice,
        quantity: cartItem.quantity,
        subtotal: lineItemSubtotal,
        fulfillmentStation: menuItem.fulfillmentStation,
        itemModifiers: {
          create: modifierRecordsToCreate,
        },
      });
    }

    const totalAmount = calculatedSubtotal;
    const initialStatus =
      effectiveServiceModel === ServiceModel.WAITER_ASSISTED || isWaiterPunch
        ? OrderStatus.CONFIRMED
        : dto.paymentMethod === PaymentMethod.CASH
          ? OrderStatus.PENDING_CASH_CONFIRMATION
          : OrderStatus.PENDING;

    // Execute Prisma transaction for atomic order creation
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tableId: tableRecord.id,
          serviceModel: effectiveServiceModel,
          status: initialStatus,
          subtotal: calculatedSubtotal,
          totalAmount,
          customerName: dto.customerName || null,
          customerPhone: dto.customerPhone || null,
          notes: dto.notes || null,
          items: {
            create: itemRecordsToCreate,
          },
        },
        include: {
          table: true,
          items: {
            include: {
              itemModifiers: true,
            },
          },
        },
      });

      return newOrder;
    });

    // If order is CONFIRMED immediately (e.g. Waiter mode), split & route KOT tickets
    if (order.status === OrderStatus.CONFIRMED) {
      await this.kotService.splitAndRouteKotTickets(order.id);
    }

    this.eventsGateway.emitOrderCreated(order);
    return order;
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        items: {
          include: {
            itemModifiers: true,
          },
        },
        payments: true,
        kotTickets: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getActiveOrdersForTable(tableId: string) {
    return this.prisma.order.findMany({
      where: {
        tableId,
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      },
      include: {
        items: {
          include: {
            itemModifiers: true,
          },
        },
        payments: true,
        kotTickets: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCashierOrdersQueue() {
    return this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PENDING_CASH_CONFIRMATION, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY] },
      },
      include: {
        table: true,
        items: {
          include: { itemModifiers: true },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(id: string, newStatus: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: { table: true, items: true, payments: true },
    });

    // If order transitions to CONFIRMED, route KOT tickets
    if (newStatus === OrderStatus.CONFIRMED) {
      await this.kotService.splitAndRouteKotTickets(order.id);
    }

    this.eventsGateway.emitOrderStatusChanged(id, newStatus, updated);
    return updated;
  }

  async settleTableBill(tableId: string) {
    const activeOrders = await this.getActiveOrdersForTable(tableId);
    if (activeOrders.length === 0) {
      return { success: true, message: 'No active orders for this table' };
    }

    // Mark all table orders as COMPLETED and ensure cash payments exist
    await this.prisma.$transaction(async (tx) => {
      for (const order of activeOrders) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.COMPLETED },
        });

        // Ensure cash payment record is recorded if missing
        const existingPayment = await tx.payment.findFirst({
          where: { orderId: order.id, status: PaymentStatus.COMPLETED },
        });

        if (!existingPayment) {
          await tx.payment.create({
            data: {
              orderId: order.id,
              paymentMethod: PaymentMethod.CASH,
              status: PaymentStatus.COMPLETED,
              amount: order.totalAmount,
              provider: 'CashPaymentProvider',
              verifiedAt: new Date(),
            },
          });
        }
      }

      // Rotate QR token to revoke active customer session
      await this.tablesService.rotateQrToken(tableId);
    });

    for (const order of activeOrders) {
      this.eventsGateway.emitOrderStatusChanged(order.id, OrderStatus.COMPLETED);
    }

    return { success: true, settledCount: activeOrders.length };
  }
}
