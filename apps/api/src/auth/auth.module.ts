import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import type { StringValue } from 'ms';
import { AuthController } from './controller/auth.controller';
import { AUTH_PROVIDER_KEYS } from './constants';
import { AuthService } from './service/auth.service';
import { CsrfOriginGuard } from './guards/csrf-origin.guard';
import { ExperimentalLoginThrottleGuard } from './guards/experimental-login-throttle.guard';
import { GoogleAuthModule } from './google-auth/google-auth.module';
import { UsersModule } from '../users/users.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ClearSessionCookieInterceptor, SetSessionCookieInterceptor } from './interceptors/session-cookie.interceptor';
import { PrismaExternalIdentitiesRepository } from './identity/prisma-external-identities.repository';
import { PrismaIdentityTransaction } from './identity/prisma-identity-transaction';

@Module({
  imports: [
    GoogleAuthModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwtSecret'),
        signOptions: {
          algorithm: 'HS256',
          audience: config.getOrThrow<string>('jwtAudience'),
          expiresIn: config.getOrThrow<string>('jwtExpiresIn') as StringValue,
          issuer: config.getOrThrow<string>('jwtIssuer'),
        },
        verifyOptions: {
          algorithms: ['HS256'],
          audience: config.getOrThrow<string>('jwtAudience'),
          issuer: config.getOrThrow<string>('jwtIssuer'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_PROVIDER_KEYS.EXTERNAL_IDENTITIES_REPOSITORY,
      useClass: PrismaExternalIdentitiesRepository,
    },
    { provide: AUTH_PROVIDER_KEYS.IDENTITY_TRANSACTION, useClass: PrismaIdentityTransaction },
    AuthService,
    ExperimentalLoginThrottleGuard,
    SetSessionCookieInterceptor,
    ClearSessionCookieInterceptor,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CsrfOriginGuard },
  ],
})
export class AuthModule {}
