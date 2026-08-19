import { Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { authSessionSchema } from '@codelife/contracts/auth';
import { AuthService } from './auth.service';
import { clearSessionCookieOptions, sessionCookieOptions } from './cookies/auth-cookie';
import { Public } from './decorators/public.decorator';
import { ExperimentalLoginThrottleGuard } from './guards/experimental-login-throttle.guard';
import { AuthenticatedRequest } from './types/authenticated-request';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Get('me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Retorna a pessoa da sessão experimental atual' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida' })
  me(@Req() request: AuthenticatedRequest) {
    const { key, username, displayName } = request.user;
    return authSessionSchema.parse({ user: { id: key, username, displayName } });
  }

  @Public()
  @UseGuards(ExperimentalLoginThrottleGuard)
  @Post('experimental-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia a sessão fixa aluna.demo somente em desenvolvimento/teste' })
  async experimentalLogin(@Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.auth.startExperimentalSession();
    response.cookie(this.config.getOrThrow<string>('cookieName'), token, sessionCookieOptions(this.config));
    return authSessionSchema.parse({ user: { id: user.key, username: user.username, displayName: user.displayName } });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(this.config.getOrThrow<string>('cookieName'), clearSessionCookieOptions(this.config));
    return { ok: true };
  }
}
