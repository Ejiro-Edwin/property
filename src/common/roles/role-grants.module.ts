import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { RoleGrantsService } from './role-grants.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [RoleGrantsService],
  exports: [RoleGrantsService],
})
export class RoleGrantsModule {}
