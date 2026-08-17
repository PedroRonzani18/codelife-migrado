import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './authenticated-request';
import { Public } from './public.decorator';

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
    return { user: { id: key, username, displayName } };
  }

  @Public()
  @Post('experimental-login')
  @ApiOperation({ summary: 'Inicia a sessão fixa aluna.demo somente em desenvolvimento/teste' })
  async experimentalLogin(@Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.auth.startExperimentalSession();
    response.cookie(this.config.getOrThrow<string>('cookieName'), token, {
      httpOnly: true,
      secure: this.config.getOrThrow<boolean>('cookieSecure'),
      sameSite: this.config.getOrThrow<'lax' | 'strict' | 'none'>('cookieSameSite'),
      path: '/',
      maxAge: this.config.getOrThrow<number>('cookieMaxAgeSeconds') * 1000,
    });
    return { user: { id: user.key, username: user.username, displayName: user.displayName } };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(this.config.getOrThrow<string>('cookieName'), { path: '/' });
    return { ok: true };
  }
}
