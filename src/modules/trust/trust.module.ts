import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { TrustController } from './trust.controller';
import { TrustService } from './trust.service';

@Module({
  imports: [PrismaModule],
  controllers: [TrustController],
  providers: [TrustService],
})
export class TrustModule {}
