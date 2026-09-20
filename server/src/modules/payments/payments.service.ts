import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { KotService } from '../kot/kot.service';
import { EventsGateway } from '../realtime/events.gateway';
import { PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private kotService: KotService,
    private eventsGateway: EventsGateway,
    private configService: ConfigService,
  ) {}

  async processPayment(dto: ProcessPaymentDto) {
    const order = await this.ordersService.getOrderById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');

    const appEnv = this.configService.getOrThrow<string>('APP_ENV');

    if (dto.paymentMethod === PaymentMethod.CASH) {
      // Cash payment record created as PENDING or COMPLETED
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
          amount: order.totalAmount,
          provider: 'CashPaymentProvider',
        },
      });

      return {
        payment,
        orderStatus: order.status,
        message: 'Cash payment requested. Please settle at cashier.',
      };
    }

    // Telebirr or CBE Digital Payment
    if (appEnv === 'production') {
      // Production mode requires official API / webhook verification
      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: dto.paymentMethod,
          status: PaymentStatus.PENDING,
          amount: order.totalAmount,
          transactionRef: dto.transactionRef || null,
          provider: `${dto.paymentMethod}_Production_Provider`,
        },
      });

      return {
        payment,
        orderStatus: OrderStatus.PAYMENT_PENDING,
        message: 'Payment verification submitted to bank/gateway.',
      };
    } else {
      // Development / Staging: Bypasses external verification & auto-approves via MockProvider
      const txnRef = dto.transactionRef && dto.transactionRef.trim().length > 0
        ? dto.transactionRef
        : `MOCK-TXN-${Date.now()}`;

      const payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          paymentMethod: dto.paymentMethod,
          status: PaymentStatus.COMPLETED,
          amount: order.totalAmount,
          transactionRef: txnRef,
          provider: 'MockPaymentProvider',
          isMocked: true,
          verifiedAt: new Date(),
        },
      });

      // Atomically transition order status to CONFIRMED
      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CONFIRMED },
        include: { table: true, items: true },
      });

      // Split and route KOT tickets
      await this.kotService.splitAndRouteKotTickets(order.id);

      this.eventsGateway.emitOrderStatusChanged(order.id, OrderStatus.CONFIRMED, updatedOrder);

      return {
        payment,
        order: updatedOrder,
        mocked: true,
        message: 'Development mock payment auto-approved successfully!',
      };
    }
  }

  async confirmCashierPayment(orderId: string) {
    const order = await this.ordersService.getOrderById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        paymentMethod: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        amount: order.totalAmount,
        provider: 'CashPaymentProvider',
        verifiedAt: new Date(),
      },
    });

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CONFIRMED },
      include: { table: true, items: true },
    });

    await this.kotService.splitAndRouteKotTickets(order.id);
    this.eventsGateway.emitOrderStatusChanged(order.id, OrderStatus.CONFIRMED, updatedOrder);

    return { payment, order: updatedOrder };
  }
}
