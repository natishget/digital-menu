import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role, ServiceModel } from '@prisma/client';

@Controller('restaurant')
export class RestaurantController {
  constructor(private restaurantService: RestaurantService) {}

  @Get('settings')
  getSettings() {
    return this.restaurantService.getSettings();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Put('settings')
  updateSettings(
    @Body()
    body: {
      name?: string;
      serviceModel?: ServiceModel;
      themeConfig?: any;
      fastingAutoSchedule?: boolean;
      defaultLanguage?: string;
      currency?: string;
    },
  ) {
    return this.restaurantService.updateSettings(body);
  }
}
