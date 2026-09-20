import { Controller, Get, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { KotService } from './kot.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role, FulfillmentStation, KotStatus } from '@prisma/client';

@Controller('kot')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KotController {
  constructor(private kotService: KotService) {}

  @Get('station')
  @Roles(Role.KITCHEN_STAFF, Role.BARISTA, Role.ADMIN, Role.MANAGER)
  getStationTickets(@Query('station') station: FulfillmentStation) {
    return this.kotService.getStationTickets(station);
  }

  @Put('tickets/:id/status')
  @Roles(Role.KITCHEN_STAFF, Role.BARISTA, Role.ADMIN, Role.MANAGER)
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: KotStatus },
  ) {
    return this.kotService.updateTicketStatus(id, body.status);
  }
}
