import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: { username: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokenPair(user.id, user.username, user.role);
  }

  async waiterPinLogin(dto: { tableId?: string; pin: string }) {
    // Find all active waiters
    const waiters = await this.prisma.user.findMany({
      where: { role: Role.WAITER, isActive: true },
    });

    let matchedWaiter: any = null;
    for (const waiter of waiters) {
      if (waiter.pinHash) {
        const isPinValid = await bcrypt.compare(dto.pin, waiter.pinHash);
        if (isPinValid) {
          matchedWaiter = waiter;
          break;
        }
      }
    }

    if (!matchedWaiter) {
      throw new UnauthorizedException('Invalid Waiter 4-digit PIN');
    }

    return this.generateTokenPair(
      matchedWaiter.id,
      matchedWaiter.username,
      matchedWaiter.role,
      dto.tableId,
    );
  }

  async refreshToken(refreshTokenStr: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old refresh token (token rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.generateTokenPair(
      storedToken.user.id,
      storedToken.user.username,
      storedToken.user.role,
    );
  }

  async logout(refreshTokenStr: string) {
    if (!refreshTokenStr) return { success: true };
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr },
      data: { isRevoked: true },
    });
    return { success: true };
  }

  private async generateTokenPair(
    userId: string,
    username: string,
    role: Role,
    tableId?: string,
  ) {
    const payload = { sub: userId, username, role, tableId };
    
    const jwtExpiresIn = this.configService.getOrThrow<string>('JWT_EXPIRES_IN');
    const jwtRefreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const jwtRefreshExpiresIn = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtExpiresIn as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtRefreshSecret,
      expiresIn: jwtRefreshExpiresIn as any,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, name: true, role: true },
    });

    return {
      user,
      accessToken,
      refreshToken,
      tableId,
    };
  }
}
