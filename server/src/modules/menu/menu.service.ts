import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { FulfillmentStation } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private restaurantService: RestaurantService,
  ) {}

  async getMenu(query: { fastingOnly?: string; lang?: string }) {
    const settings = await this.restaurantService.getSettings();
    
    // Check if auto-fasting schedule triggers today (Wednesday=3 or Friday=5)
    const todayDay = new Date().getDay();
    const isScheduledFastingDay =
      settings.fastingAutoSchedule && (todayDay === 3 || todayDay === 5);

    const isFastingFilterActive =
      query.fastingOnly === 'true' || isScheduledFastingDay;

    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: {
            isAvailable: true,
            ...(isFastingFilterActive ? { isFastingFriendly: true } : {}),
          },
          include: {
            modifierGroups: {
              include: {
                modifierOptions: {
                  where: { isAvailable: true },
                },
              },
            },
          },
        },
      },
    });

    // Apply language fallback (Amharic -> English) if requested language is 'am'
    const lang = query.lang || 'en';

    return {
      isFastingScheduled: isScheduledFastingDay,
      isFastingFilterActive,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: lang === 'am' && cat.nameAm ? cat.nameAm : cat.nameEn,
        nameEn: cat.nameEn,
        nameAm: cat.nameAm,
        sortOrder: cat.sortOrder,
        items: cat.items.map((item) => ({
          id: item.id,
          name: lang === 'am' && item.nameAm ? item.nameAm : item.nameEn,
          nameEn: item.nameEn,
          nameAm: item.nameAm,
          description: lang === 'am' && item.descriptionAm ? item.descriptionAm : item.descriptionEn,
          descriptionEn: item.descriptionEn,
          descriptionAm: item.descriptionAm,
          price: Number(item.price),
          isFastingFriendly: item.isFastingFriendly,
          fulfillmentStation: item.fulfillmentStation,
          imageUrl: item.imageUrl,
          modifierGroups: item.modifierGroups.map((group) => ({
            id: group.id,
            name: lang === 'am' && group.nameAm ? group.nameAm : group.nameEn,
            nameEn: group.nameEn,
            nameAm: group.nameAm,
            minSelection: group.minSelection,
            maxSelection: group.maxSelection,
            isRequired: group.isRequired,
            options: group.modifierOptions.map((opt) => ({
              id: opt.id,
              name: lang === 'am' && opt.nameAm ? opt.nameAm : opt.nameEn,
              nameEn: opt.nameEn,
              nameAm: opt.nameAm,
              priceAdjustment: Number(opt.priceAdjustment),
            })),
          })),
        })),
      })),
    };
  }

  async getAllCategoriesAdmin() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          include: {
            modifierGroups: {
              include: {
                modifierOptions: true,
              },
            },
          },
        },
      },
    });
  }

  async createCategory(dto: { nameEn: string; nameAm?: string; sortOrder?: number }) {
    return this.prisma.category.create({
      data: {
        nameEn: dto.nameEn,
        nameAm: dto.nameAm || dto.nameEn,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async createMenuItem(dto: {
    categoryId: string;
    nameEn: string;
    nameAm?: string;
    descriptionEn?: string;
    descriptionAm?: string;
    price: number;
    isFastingFriendly?: boolean;
    fulfillmentStation?: FulfillmentStation;
    imageUrl?: string;
  }) {
    return this.prisma.menuItem.create({
      data: {
        categoryId: dto.categoryId,
        nameEn: dto.nameEn,
        nameAm: dto.nameAm || dto.nameEn,
        descriptionEn: dto.descriptionEn || null,
        descriptionAm: dto.descriptionAm || dto.descriptionEn || null,
        price: dto.price,
        isFastingFriendly: dto.isFastingFriendly || false,
        fulfillmentStation: dto.fulfillmentStation || FulfillmentStation.KITCHEN,
        imageUrl: dto.imageUrl || null,
      },
    });
  }

  async createModifierGroup(dto: {
    menuItemId: string;
    nameEn: string;
    nameAm?: string;
    minSelection?: number;
    maxSelection?: number;
    isRequired?: boolean;
    options?: Array<{ nameEn: string; nameAm?: string; priceAdjustment?: number }>;
  }) {
    return this.prisma.modifierGroup.create({
      data: {
        menuItemId: dto.menuItemId,
        nameEn: dto.nameEn,
        nameAm: dto.nameAm || dto.nameEn,
        minSelection: dto.minSelection || 0,
        maxSelection: dto.maxSelection || 1,
        isRequired: dto.isRequired || false,
        modifierOptions: {
          create: (dto.options || []).map((opt) => ({
            nameEn: opt.nameEn,
            nameAm: opt.nameAm || opt.nameEn,
            priceAdjustment: opt.priceAdjustment || 0,
          })),
        },
      },
      include: { modifierOptions: true },
    });
  }

  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  async deleteMenuItem(id: string) {
    await this.prisma.menuItem.delete({ where: { id } });
    return { success: true };
  }
}
