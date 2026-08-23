import { Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { authSessionSchema } from '@codelife/contracts/auth';
import { AuthService } from './auth.service';
import { clearSessionCookieOptions, sessionCookieOptions } from './cookies/auth-cookie';
import { Public } from './decorators/public.decorator';
import { ExperimentalLoginThrottleGuard } from './guards/experimental-login-throttle.guard';
import type { AuthenticatedRequest } from './types/authenticated-request';

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
  @ApiResponse({ status: 200, description: 'Sessão experimental criada e cookie HttpOnly emitido.' })
  @ApiResponse({ status: 403, description: 'Login experimental desabilitado fora do ambiente permitido.' })
  @ApiResponse({ status: 429, description: 'Limite de tentativas atingido.' })
  async experimentalLogin(@Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.auth.startExperimentalSession();
    response.cookie(this.config.getOrThrow<string>('cookieName'), token, sessionCookieOptions(this.config));
    return authSessionSchema.parse({ user: { id: user.key, username: user.username, displayName: user.displayName } });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerra a sessão e remove o cookie de autenticação' })
  @ApiBody({ schema: { type: 'object', additionalProperties: false, example: {} } })
  @ApiResponse({ status: 200, description: 'Cookie de sessão removido.' })
  @ApiForbiddenResponse({ description: 'Origin não confiável.' })
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(this.config.getOrThrow<string>('cookieName'), clearSessionCookieOptions(this.config));
    return { ok: true };
  }
}
