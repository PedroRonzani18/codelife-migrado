import { ForbiddenException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AUTH_REPOSITORY, type AuthRepositoryPort } from './auth.repository.port';

export const EXPERIMENTAL_USER_KEY = 'aluna-demo';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repository: AuthRepositoryPort,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async startExperimentalSession() {
    const nodeEnv = this.config.getOrThrow<string>('nodeEnv');
    if (nodeEnv === 'production' || !this.config.getOrThrow<boolean>('experimentalLoginEnabled')) {
      throw new ForbiddenException({
        code: 'EXPERIMENTAL_LOGIN_DISABLED',
        message: 'Login experimental indisponível neste ambiente',
      });
    }
    const user = await this.repository.findUserByKey(EXPERIMENTAL_USER_KEY);
    if (!user) throw new ServiceUnavailableException('Identidade experimental indisponível');
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user };
  }

  async resolveSession(token: string) {
    let subject: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(token, {
        algorithms: ['HS256'],
        issuer: this.config.getOrThrow<string>('jwtIssuer'),
        audience: this.config.getOrThrow<string>('jwtAudience'),
      });
      if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('Invalid JWT subject');
      subject = payload.sub;
    } catch {
      throw new UnauthorizedException('Sessão inválida');
    }

    const user = await this.repository.findUserById(subject);
    if (!user) throw new UnauthorizedException('Sessão inválida');
    return user;
  }
}
