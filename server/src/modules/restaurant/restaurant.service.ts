import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceModel } from '@prisma/client';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.restaurantSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.restaurantSettings.create({
        data: {
          id: 'default',
          name: 'Abyssinia Coffee & Bistro',
          serviceModel: ServiceModel.SELF_SERVED,
          fastingAutoSchedule: true,
          themeConfig: {
            primaryColor: '#d97706',
            secondaryColor: '#78350f',
            accentColor: '#f59e0b',
            backgroundColor: '#1c1917',
            surfaceColor: '#292524',
            textColor: '#fafaf9',
          },
        },
      });
    }

    return settings;
  }

  async updateSettings(dto: {
    name?: string;
    serviceModel?: ServiceModel;
    themeConfig?: any;
    fastingAutoSchedule?: boolean;
    defaultLanguage?: string;
    currency?: string;
  }) {
    await this.getSettings(); // Ensure default exists

    return this.prisma.restaurantSettings.update({
      where: { id: 'default' },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.serviceModel && { serviceModel: dto.serviceModel }),
        ...(dto.themeConfig && { themeConfig: dto.themeConfig }),
        ...(dto.fastingAutoSchedule !== undefined && { fastingAutoSchedule: dto.fastingAutoSchedule }),
        ...(dto.defaultLanguage && { defaultLanguage: dto.defaultLanguage }),
        ...(dto.currency && { currency: dto.currency }),
      },
    });
  }
}
