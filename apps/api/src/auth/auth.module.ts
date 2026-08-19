import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AUTH_REPOSITORY } from './auth.repository.port';
import { AuthService } from './auth.service';
import { CsrfOriginGuard } from './guards/csrf-origin.guard';
import { ExperimentalLoginThrottleGuard } from './guards/experimental-login-throttle.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaAuthRepository } from './prisma-auth.repository';

@Module({
  imports: [
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
    { provide: AUTH_REPOSITORY, useClass: PrismaAuthRepository },
    AuthService,
    ExperimentalLoginThrottleGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfOriginGuard },
  ],
})
export class AuthModule {}
