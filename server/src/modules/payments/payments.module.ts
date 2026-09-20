import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';
import { KotModule } from '../kot/kot.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [OrdersModule, KotModule, RealtimeModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
