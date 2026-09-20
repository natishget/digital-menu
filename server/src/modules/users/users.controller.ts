import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post()
  createUser(
    @Body()
    body: {
      username: string;
      password?: string;
      name: string;
      role: Role;
      pin?: string;
    },
  ) {
    return this.usersService.createUser(body);
  }

  @Put(':id')
  updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      role?: Role;
      isActive?: boolean;
      password?: string;
      pin?: string;
    },
  ) {
    return this.usersService.updateUser(id, body);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.deleteUser(id, req.user.id);
  }
}
