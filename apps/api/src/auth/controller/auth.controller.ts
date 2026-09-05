import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { authSessionSchema } from '@codelife/contracts/auth';
import { AUTH_PROVIDER_KEYS } from '../constants';
import { CurrentUser, Public } from '../decorators';
import { LogoutInputDto } from '../dto';
import { ExperimentalLoginThrottleGuard } from '../guards/experimental-login-throttle.guard';
import type { AuthUser } from '../repository/auth.repository.interface';
import type { IAuthService } from '../service/auth.service.interface';
import { ExperimentalLoginEndpoint, GetCurrentSessionEndpoint, LogoutEndpoint } from './decorators/auth-endpoint.decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_PROVIDER_KEYS.AUTH_SERVICE)
    private readonly auth: IAuthService,
  ) {}

  @Get('me')
  @GetCurrentSessionEndpoint()
  me(@CurrentUser() user: AuthUser) {
    const { key, username, displayName } = user;
    return authSessionSchema.parse({ user: { id: key, username, displayName } });
  }

  @Public()
  @UseGuards(ExperimentalLoginThrottleGuard)
  @Post('experimental-login')
  @ExperimentalLoginEndpoint()
  experimentalLogin() {
    return this.auth.startExperimentalSession();
  }

  @Public()
  @Post('logout')
  @LogoutEndpoint()
  logout(@Body() _input: LogoutInputDto) {
    return { ok: true };
  }
}
