import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { TenanciesModule } from './modules/tenancies/tenancies.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrustModule } from './modules/trust/trust.module';
import { AuditModule } from './modules/audit/audit.module';
import { CacheModule } from './common/cache.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { RealtimeModule } from './common/gateway/realtime.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InvitesModule } from './modules/invites/invites.module';
import { envValidationSchema } from './config/env.validation';
import { EmailModule } from './common/email/email.module';
import { PrismaModule } from './common/prisma.module';
import { RoleGrantsModule } from './common/roles/role-grants.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { PropertyFeaturesModule } from './modules/property-features/property-features.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    PrismaModule,
    RoleGrantsModule,
    DocumentsModule,
    MessagesModule,
    PaymentMethodsModule,
    PropertyFeaturesModule,
    SettingsModule,
    MaintenanceModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    TenanciesModule,
    PaymentsModule,
    TrustModule,
    AuditModule,
    CacheModule,
    RealtimeModule,
    NotificationsModule,
    InvitesModule,
    EmailModule,
    ThrottlerModule.forRoot({ throttlers: [{ limit: 100, ttl: 60 }] }),
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
  ],
})
export class AppModule {}
