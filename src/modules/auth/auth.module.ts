import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../common/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        const isProd = process.env.NODE_ENV === 'production';
        if (!secret && isProd) {
          throw new Error('JWT_SECRET is required in production');
        }
        return secret ?? 'dev_insecure_jwt_secret_change_me';
      })(),
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '3600s') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
