import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role, ServiceModel } from '@prisma/client';

@Controller('tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Get('validate')
  validateToken(
    @Query('table_id') tableId: string,
    @Query('token') token: string,
  ) {
    return this.tablesService.validateQrToken(tableId, token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER, Role.WAITER, Role.CASHIER)
  @Get()
  getAllTables() {
    return this.tablesService.getAllTables();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getTableById(@Param('id') id: string) {
    return this.tablesService.getTableById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  createTable(@Body() body: { number: number; name: string; serviceModelOverride?: ServiceModel }) {
    return this.tablesService.createTable(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Put(':id')
  updateTable(
    @Param('id') id: string,
    @Body() body: { name?: string; serviceModelOverride?: ServiceModel | null; isActive?: boolean },
  ) {
    return this.tablesService.updateTable(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post(':id/rotate-token')
  rotateQrToken(@Param('id') id: string) {
    return this.tablesService.rotateQrToken(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  deleteTable(@Param('id') id: string) {
    return this.tablesService.deleteTable(id);
  }
}
