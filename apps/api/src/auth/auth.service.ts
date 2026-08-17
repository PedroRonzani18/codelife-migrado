import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export const EXPERIMENTAL_USER_KEY = 'aluna-demo';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async startExperimentalSession() {
    const nodeEnv = this.config.getOrThrow<string>('nodeEnv');
    if (nodeEnv === 'production' || !this.config.getOrThrow<boolean>('experimentalLoginEnabled')) {
      throw new ForbiddenException('Login experimental indisponível neste ambiente');
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { key: EXPERIMENTAL_USER_KEY } });
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user };
  }
}
