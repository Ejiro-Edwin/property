import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MessagesService } from './messages.service';

class CreateMessageDto { @IsString() tenantId: string; @IsString() body: string; @IsOptional() @IsString() recipientId?: string; }
class ReadMessageDto { @IsString() tenantId: string; @IsOptional() @IsBoolean() read?: boolean; }

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}
  @Get() list(@Query('tenantId') tenantId: string, @Query('unread') unread: string | undefined, @Request() req: any) { return this.service.list(tenantId, req.user, unread === 'true'); }
  @Post() create(@Body() dto: CreateMessageDto, @Request() req: any) { return this.service.create(dto, req.user); }
  @Patch(':id/read') markRead(@Param('id') id: string, @Body() dto: ReadMessageDto, @Request() req: any) { return this.service.markRead(dto.tenantId, id, req.user, dto.read ?? true); }
}
