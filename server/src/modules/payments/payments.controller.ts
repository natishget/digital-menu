import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('process')
  processPayment(@Body() body: ProcessPaymentDto) {
    return this.paymentsService.processPayment(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CASHIER, Role.ADMIN, Role.MANAGER)
  @Post('confirm-cashier/:orderId')
  confirmCashierPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.confirmCashierPayment(orderId);
  }
}
