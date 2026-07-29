import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Nest prepends the "v" prefix itself, so '1' yields /api/v1/...
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Security headers
  app.use(helmet());

  // CORS: support comma-separated origins in CORS_ORIGINS
  const raw = process.env.CORS_ORIGINS || '';
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const isProd = process.env.NODE_ENV === 'production';
  app.useGlobalFilters(new AllExceptionsFilter(isProd));

  const config = new DocumentBuilder()
    .setTitle('TenantSea API')
    .setDescription('Rental trust, payment and tenancy management API')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

bootstrap();
