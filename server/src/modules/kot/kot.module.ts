import { Module } from '@nestjs/common';
import { KotService } from './kot.service';
import { KotController } from './kot.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [KotController],
  providers: [KotService],
  exports: [KotService],
})
export class KotModule {}
