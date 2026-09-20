import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { ServiceModel } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private restaurantService: RestaurantService,
  ) {}

  async getAllTables() {
    const tables = await this.prisma.table.findMany({
      orderBy: { number: 'asc' },
    });
    const settings = await this.restaurantService.getSettings();

    return tables.map((tbl) => ({
      ...tbl,
      effectiveServiceModel: tbl.serviceModelOverride || settings.serviceModel,
    }));
  }

  async getTableById(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    const settings = await this.restaurantService.getSettings();
    return {
      ...table,
      effectiveServiceModel: table.serviceModelOverride || settings.serviceModel,
    };
  }

  async validateQrToken(tableId: string, token: string) {
    if (!token && !tableId) {
      throw new BadRequestException('QR token or Table identifier is required');
    }

    let table: any = null;

    // 1. Try finding by ID if UUID
    if (tableId) {
      table = await this.prisma.table.findFirst({
        where: {
          OR: [
            { id: tableId },
            { qrToken: token },
            ...(isNaN(Number(tableId)) ? [] : [{ number: Number(tableId) }]),
          ],
        },
      });
    }

    // 2. Fallback to lookup by token directly
    if (!table && token) {
      table = await this.prisma.table.findUnique({
        where: { qrToken: token },
      });
    }

    if (!table || !table.isActive || (token && table.qrToken !== token)) {
      return { valid: false, message: 'Invalid or expired QR session code' };
    }

    const settings = await this.restaurantService.getSettings();
    const effectiveServiceModel = table.serviceModelOverride || settings.serviceModel;

    return {
      valid: true,
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        qrToken: table.qrToken,
      },
      effectiveServiceModel,
    };
  }

  async createTable(dto: { number: number; name: string; serviceModelOverride?: ServiceModel }) {
    const existing = await this.prisma.table.findUnique({
      where: { number: dto.number },
    });
    if (existing) {
      throw new BadRequestException(`Table number ${dto.number} already exists`);
    }

    const qrToken = `tbl${dto.number}-tok-${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.table.create({
      data: {
        number: dto.number,
        name: dto.name,
        serviceModelOverride: dto.serviceModelOverride || null,
        qrToken,
      },
    });
  }

  async updateTable(id: string, dto: { name?: string; serviceModelOverride?: ServiceModel | null; isActive?: boolean }) {
    await this.getTableById(id);
    return this.prisma.table.update({
      where: { id },
      data: dto,
    });
  }

  async rotateQrToken(id: string) {
    const table = await this.getTableById(id);
    const newToken = `tbl${table.number}-tok-${crypto.randomBytes(8).toString('hex')}`;

    return this.prisma.table.update({
      where: { id },
      data: { qrToken: newToken },
    });
  }

  async deleteTable(id: string) {
    await this.prisma.table.delete({ where: { id } });
    return { success: true };
  }
}
