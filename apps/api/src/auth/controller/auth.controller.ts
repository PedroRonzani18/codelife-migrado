import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { authSessionSchema } from '@codelife/contracts/auth';
import {
  clearGoogleAuthTransactionCookieOptions,
  GOOGLE_AUTH_TRANSACTION_COOKIE,
  googleAuthTransactionCookieOptions,
  sessionCookieOptions,
} from '../cookies/auth-cookie';
import { CurrentUser, Public } from '../decorators';
import { LogoutInputDto } from '../dto';
import { ExperimentalLoginThrottleGuard } from '../guards/experimental-login-throttle.guard';
import { AuthService } from '../service/auth.service';
import type { UserRecord } from '../../users/internal/user-record';
import {
  ExperimentalLoginEndpoint,
  GetCurrentSessionEndpoint,
  GoogleAuthorizationEndpoint,
  GoogleCallbackEndpoint,
  LogoutEndpoint,
} from './decorators/auth-endpoint.decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('me')
  @GetCurrentSessionEndpoint()
  me(@CurrentUser() user: UserRecord) {
    const { key, username, displayName, role } = user;
    return authSessionSchema.parse({ user: { id: key, username, displayName, role } });
  }

  @Public()
  @UseGuards(ExperimentalLoginThrottleGuard)
  @Post('experimental-login')
  @ExperimentalLoginEndpoint()
  experimentalLogin() {
    return this.auth.startExperimentalSession();
  }

  @Public()
  @Get('google')
  @GoogleAuthorizationEndpoint()
  async google(@Res() response: Response) {
    const authorization = await this.auth.startGoogleAuthorization();
    response.cookie(
      GOOGLE_AUTH_TRANSACTION_COOKIE,
      authorization.transactionToken,
      googleAuthTransactionCookieOptions(this.config),
    );
    response.redirect(authorization.authorizationUrl);
  }

  @Public()
  @Get('google/callback')
  @GoogleCallbackEndpoint()
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    response.clearCookie(
      GOOGLE_AUTH_TRANSACTION_COOKIE,
      clearGoogleAuthTransactionCookieOptions(this.config),
    );

    const providerError = this.queryString(request.query.error);
    if (providerError) {
      throw new UnauthorizedException('Autenticação Google cancelada');
    }

    const callbackBaseUrl = this.config.get<string>('googleRedirectUri')
      ?? `${request.protocol}://${request.get('host')}`;
    const callbackUrl = new URL(request.originalUrl, callbackBaseUrl).toString();
    const session = await this.auth.completeGoogleAuthentication({
      callbackUrl,
      transactionToken: request.cookies?.[GOOGLE_AUTH_TRANSACTION_COOKIE],
    });

    response.cookie(
      this.config.getOrThrow<string>('cookieName'),
      session.token,
      sessionCookieOptions(this.config),
    );
    response.redirect(this.config.getOrThrow<string>('webOrigin'));
  }

  @Public()
  @Post('logout')
  @LogoutEndpoint()
  logout(@Body() _input: LogoutInputDto) {
    return { ok: true };
  }

  private queryString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
