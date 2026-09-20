import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        pinHash: true,
        createdAt: true,
      },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      hasPin: !!u.pinHash,
      createdAt: u.createdAt,
    }));
  }

  async createUser(dto: {
    username: string;
    password?: string;
    name: string;
    role: Role;
    pin?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new BadRequestException(`Username '${dto.username}' already exists`);
    }

    const passwordToHash = dto.password || 'password123';
    const passwordHash = await bcrypt.hash(passwordToHash, 10);
    const pinHash = dto.pin && dto.pin.trim().length === 4 ? await bcrypt.hash(dto.pin.trim(), 10) : null;

    return this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        pinHash,
        name: dto.name,
        role: dto.role,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateUser(
    id: string,
    dto: {
      name?: string;
      role?: Role;
      isActive?: boolean;
      password?: string;
      pin?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.role) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password && dto.password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }
    if (dto.pin && dto.pin.trim().length === 4) {
      updateData.pinHash = await bcrypt.hash(dto.pin.trim(), 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.username === 'natishget' || user.id === currentUserId) {
      throw new BadRequestException('Master Admin account cannot be deleted');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
