import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role, FulfillmentStation } from '@prisma/client';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get()
  getMenu(
    @Query('fasting_only') fastingOnly?: string,
    @Query('lang') lang?: string,
  ) {
    return this.menuService.getMenu({ fastingOnly, lang });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('admin')
  getAllCategoriesAdmin() {
    return this.menuService.getAllCategoriesAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('categories')
  createCategory(@Body() body: { nameEn: string; nameAm?: string; sortOrder?: number }) {
    return this.menuService.createCategory(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('items')
  createMenuItem(
    @Body()
    body: {
      categoryId: string;
      nameEn: string;
      nameAm?: string;
      descriptionEn?: string;
      descriptionAm?: string;
      price: number;
      isFastingFriendly?: boolean;
      fulfillmentStation?: FulfillmentStation;
      imageUrl?: string;
    },
  ) {
    return this.menuService.createMenuItem(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('modifier-groups')
  createModifierGroup(
    @Body()
    body: {
      menuItemId: string;
      nameEn: string;
      nameAm?: string;
      minSelection?: number;
      maxSelection?: number;
      isRequired?: boolean;
      options?: Array<{ nameEn: string; nameAm?: string; priceAdjustment?: number }>;
    },
  ) {
    return this.menuService.createModifierGroup(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete('items/:id')
  deleteMenuItem(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }
}
