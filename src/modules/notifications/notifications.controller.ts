import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { PaginationDto } from '../../common/pagination.dto';
import { MarkNotificationReadDto } from './dto/mark-notification-read.dto';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @Query('tenantId') tenantId: string,
    @Query('userId') userId: string | undefined,
    @Query('read') read: string | undefined,
    @Query() pagination: PaginationDto,
    @Request() req: any,
  ) {
    const privileged = ['LANDLORD', 'ADMIN', 'LETTING_AGENT'].includes(req?.user?.role);
    const resolvedUserId = privileged ? userId : req?.user?.id;
    const resolvedRead = read === undefined ? undefined : read === 'true';

    return this.notificationsService.listNotifications({
      tenantId,
      userId: resolvedUserId,
      read: resolvedRead,
      pagination,
    });
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @Body() dto: MarkNotificationReadDto) {
    return this.notificationsService.markRead(dto.tenantId, id, dto.read ?? true);
  }
}

