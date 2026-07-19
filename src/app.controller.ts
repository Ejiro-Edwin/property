import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './common/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/health')
  async getHealth(): Promise<{ status: string; db: 'up' | 'down' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'degraded', db: 'down' });
    }
  }
}
