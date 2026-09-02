import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DocumentsService } from './documents.service';

class CreateDocumentDto {
  @IsString() tenantId: string;
  @IsString() name: string;
  @IsString() category: string;
  @IsUrl() url: string;
  @IsOptional() @IsString() mimeType?: string;
  @IsOptional() @IsInt() @Min(0) sizeBytes?: number;
  @IsOptional() @IsString() propertyId?: string;
  @IsOptional() @IsString() tenancyId?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsIn(['PRIVATE', 'WORKSPACE']) visibility?: string;
}
class ShareDocumentDto { @IsString() tenantId: string; @IsString() userId: string; @IsOptional() @IsBoolean() canEdit?: boolean; }
class VisibilityDto { @IsString() tenantId: string; @IsIn(['PRIVATE', 'WORKSPACE']) visibility: string; }

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Get()
  list(@Query('tenantId') tenantId: string, @Query('propertyId') propertyId: string | undefined, @Query('tenancyId') tenancyId: string | undefined, @Request() req: any) {
    return this.service.list({ tenantId, propertyId, tenancyId, actor: req.user });
  }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post()
  create(@Body() dto: CreateDocumentDto, @Request() req: any) { return this.service.create(dto, req.user); }

  @Roles('LANDLORD', 'LETTING_AGENT', 'ADMIN')
  @Post(':id/share')
  share(@Param('id') id: string, @Body() dto: ShareDocumentDto) { return this.service.share(dto.tenantId, id, dto); }

  @Patch(':id/visibility')
  changeVisibility(@Param('id') id: string, @Body() dto: VisibilityDto, @Request() req: any) { return this.service.changeVisibility(dto.tenantId, id, dto.visibility, req.user); }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('tenantId') tenantId: string, @Request() req: any) { return this.service.remove(tenantId, id, req.user); }
}
