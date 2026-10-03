import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role, OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createCustomerOrder(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body, false);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.WAITER, Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Post('waiter')
  createWaiterOrder(@Body() body: CreateOrderDto) {
    return this.ordersService.createOrder(body, true);
  }

  @Get('cashier-queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.ADMIN, Role.MANAGER)
  getCashierQueue() {
    return this.ordersService.getCashierOrdersQueue();
  }

  @Get('public/phone-active')
  getActiveOrdersByPhone(@Query('phone') phone: string) {
    return this.ordersService.getActiveOrdersByPhone(phone);
  }

  @Put('public/:id/complete')
  completeCustomerOrder(@Param('id') id: string) {
    return this.ordersService.completeCustomerOrder(id);
  }

  @Get('public/table-active')
  getActiveTableOrderPublic(
    @Query('table_id') tableId: string,
    @Query('token') token: string,
  ) {
    return this.ordersService.getActiveTableOrderPublic(tableId, token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('table/:tableId')
  getActiveOrdersForTable(@Param('tableId') tableId: string) {
    return this.ordersService.getActiveOrdersForTable(tableId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.CASHIER)
  @Get('manager/all')
  getManagerOrders(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('serviceModel') serviceModel?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('dateRange') dateRange?: string,
  ) {
    return this.ordersService.getManagerOrders({
      search,
      status,
      serviceModel,
      paymentMethod,
      dateRange,
    });
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.ADMIN, Role.MANAGER, Role.WAITER)
  @Put(':id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.ordersService.updateOrderStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.ADMIN, Role.MANAGER)
  @Post('settle-table/:tableId')
  settleTableBill(@Param('tableId') tableId: string) {
    return this.ordersService.settleTableBill(tableId);
  }
}
