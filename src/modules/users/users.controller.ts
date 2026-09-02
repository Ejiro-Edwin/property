import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from '../../common/tenantsea-dtos';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination.dto';
import { isPrivilegedRole, isTenantRole } from '../../common/utils/role.util';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN', 'LANDLORD', 'LETTING_AGENT')
  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get()
  listUsers(@Query('tenantId') tenantId: string, @Query() pagination: PaginationDto, @Request() req: any) {
    if (isTenantRole(req?.user?.role)) {
      throw new ForbiddenException('Insufficient permissions to list workspace members');
    }
    return this.usersService.listUsers(tenantId, pagination);
  }

  @Get(':id')
  getUser(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.usersService.getUser(tenantId, id);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req: any) {
    const isSelf = req?.user?.id === id;
    const privileged = isPrivilegedRole(req?.user?.role);
    if (!isSelf && !privileged) {
      throw new ForbiddenException('Insufficient permissions to update this user');
    }
    if (isSelf && !privileged) {
      return this.usersService.updateUser(id, {
        ...dto,
        email: undefined,
        role: undefined,
      });
    }
    if (dto.role && req?.user?.role !== 'ADMIN' && dto.role.toLowerCase() === 'admin') {
      throw new ForbiddenException('Only administrators can assign the admin role');
    }
    return this.usersService.updateUser(id, dto);
  }

  @Roles('ADMIN', 'LANDLORD')
  @Delete(':id')
  deleteUser(@Param('id') id: string, @Query('tenantId') tenantId: string, @Request() req: any) {
    return this.usersService.deleteUser(tenantId, id, req.user?.id);
  }
}
