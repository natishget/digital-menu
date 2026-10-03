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

    let tableRecord: any = null;
    let effectiveServiceModel: ServiceModel = ServiceModel.SELF_SERVED;

    if (dto.tableId && dto.tableId.trim().length > 0) {
      const validResult = await this.tablesService.validateQrToken(dto.tableId, dto.qrToken || '');
      if (!validResult.valid || !validResult.table) {
        throw new BadRequestException(validResult.message || 'Invalid table or QR token session');
      }
      tableRecord = validResult.table;
      effectiveServiceModel = validResult.effectiveServiceModel;
    } else {
      const settings = await this.prisma.restaurantSettings.findUnique({ where: { id: 'default' } });
      effectiveServiceModel = settings?.serviceModel || ServiceModel.SELF_SERVED;
    }

    if (effectiveServiceModel === ServiceModel.WAITER_ASSISTED && !tableRecord && !isWaiterPunch) {
      throw new BadRequestException('Waiter-Assisted mode requires a valid table selection or QR token session.');
    }

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
          tableId: tableRecord ? tableRecord.id : null,
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

  async completeCustomerOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException(
        'Order can only be marked as completed after it is marked READY by the kitchen or barista',
      );
    }

    return this.updateOrderStatus(id, OrderStatus.COMPLETED);
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

  async getActiveOrdersByPhone(phone: string) {
    const cleanPhone = phone ? phone.trim() : '';
    if (!cleanPhone) return [];

    return this.prisma.order.findMany({
      where: {
        customerPhone: { equals: cleanPhone, mode: 'insensitive' },
        status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED] },
      },
      include: {
        table: true,
        items: {
          include: {
            itemModifiers: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveTableOrderPublic(tableId: string, token: string) {
    const validResult = await this.tablesService.validateQrToken(tableId, token);
    if (!validResult.valid || !validResult.table) {
      throw new BadRequestException(validResult.message || 'Invalid table or QR session');
    }

    return this.getActiveOrdersForTable(validResult.table.id);
  }

  async getManagerOrders(query: {
    search?: string;
    status?: string;
    serviceModel?: string;
    paymentMethod?: string;
    dateRange?: string;
  }) {
    const whereClause: any = {};

    if (query.status && query.status !== 'ALL') {
      whereClause.status = query.status as OrderStatus;
    }

    if (query.serviceModel && query.serviceModel !== 'ALL') {
      whereClause.serviceModel = query.serviceModel as ServiceModel;
    }

    if (query.paymentMethod && query.paymentMethod !== 'ALL') {
      whereClause.payments = {
        some: {
          paymentMethod: query.paymentMethod as PaymentMethod,
        },
      };
    }

    if (query.dateRange === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: startOfDay };
    } else if (query.dateRange === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      whereClause.createdAt = { gte: sevenDaysAgo };
    } else if (query.dateRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      whereClause.createdAt = { gte: thirtyDaysAgo };
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      const isNum = !isNaN(Number(searchTerm));

      whereClause.OR = [
        ...(isNum ? [{ orderNumber: Number(searchTerm) }] : []),
        { customerName: { contains: searchTerm, mode: 'insensitive' } },
        { customerPhone: { contains: searchTerm, mode: 'insensitive' } },
        { table: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { items: { some: { historicalItemNameEn: { contains: searchTerm, mode: 'insensitive' } } } },
        { items: { some: { historicalItemNameAm: { contains: searchTerm, mode: 'insensitive' } } } },
      ];
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      take: 200,
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
      orderBy: { createdAt: 'desc' },
    });

    const totalOrdersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const completedCount = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const activeStatuses: string[] = [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY];
    const activeCount = orders.filter((o) => activeStatuses.includes(o.status)).length;
    const cancelledCount = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;
    const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

    return {
      metrics: {
        totalOrdersCount,
        totalRevenue,
        completedCount,
        activeCount,
        cancelledCount,
        averageOrderValue,
      },
      orders: orders.map((o) => ({
        ...o,
        subtotal: Number(o.subtotal),
        totalAmount: Number(o.totalAmount),
        items: o.items.map((i) => ({
          ...i,
          historicalPrice: Number(i.historicalPrice),
          subtotal: Number(i.subtotal),
          itemModifiers: i.itemModifiers.map((m) => ({
            ...m,
            historicalPrice: Number(m.historicalPrice),
          })),
        })),
        payments: o.payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
      })),
    };
  }
}
