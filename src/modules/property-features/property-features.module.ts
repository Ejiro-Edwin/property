import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma.module';
import { PropertyFeaturesController } from './property-features.controller';
import { PropertyFeaturesService } from './property-features.service';

@Module({ imports: [PrismaModule], controllers: [PropertyFeaturesController], providers: [PropertyFeaturesService] })
export class PropertyFeaturesModule {}
