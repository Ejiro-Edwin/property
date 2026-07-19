import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class MarkNotificationReadDto {
  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  read?: boolean = true;
}

