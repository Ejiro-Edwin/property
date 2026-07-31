import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto } from '../../common/tenantsea-dtos';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationDto } from '../../common/pagination.dto';

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
  listUsers(@Query('tenantId') tenantId: string, @Query() pagination: PaginationDto) {
    return this.usersService.listUsers(tenantId, pagination);
  }

  @Get(':id')
  getUser(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.usersService.getUser(tenantId, id);
  }

  @Roles('ADMIN', 'LANDLORD', 'LETTING_AGENT')
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Roles('ADMIN', 'LANDLORD')
  @Delete(':id')
  deleteUser(@Param('id') id: string, @Query('tenantId') tenantId: string, @Request() req: any) {
    return this.usersService.deleteUser(tenantId, id, req.user?.id);
  }
}
