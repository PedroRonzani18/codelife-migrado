import { ForbiddenException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AUTH_PROVIDER_KEYS } from '../constants';
import { GoogleAuthService } from '../google-auth/google-auth.service';
import type { IAuthRepository } from '../repository/auth.repository.interface';
import { UniqueConstraintViolationError } from '../repository/unique-constraint-violation.error';
import type { GoogleIdentity } from '../google-auth/google-auth.types';
import type {
  AuthSession,
  GoogleAuthenticationInput,
  GoogleAuthorization,
  IAuthService,
} from './auth.service.interface';

export const EXPERIMENTAL_USER_KEY = 'aluna-demo';
const GOOGLE_PROVIDER = 'GOOGLE' as const;
const MAX_USER_CREATION_ATTEMPTS = 32;
const GOOGLE_AUTH_TRANSACTION_PURPOSE = 'google-auth-transaction';

interface GoogleAuthTransaction {
  purpose?: unknown;
  state?: unknown;
  nonce?: unknown;
  codeVerifier?: unknown;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(AUTH_PROVIDER_KEYS.AUTH_REPOSITORY) private readonly repository: IAuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  async startExperimentalSession(): Promise<AuthSession> {
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

  async startGoogleAuthorization(): Promise<GoogleAuthorization> {
    let authorizationRequest;
    try {
      authorizationRequest = await this.googleAuth.createAuthorizationUrl();
    } catch {
      throw new ServiceUnavailableException('Login Google indisponível');
    }

    const transactionToken = await this.jwt.signAsync({
      purpose: GOOGLE_AUTH_TRANSACTION_PURPOSE,
      state: authorizationRequest.state,
      nonce: authorizationRequest.nonce,
      codeVerifier: authorizationRequest.codeVerifier,
    }, { expiresIn: '10m' });

    return {
      authorizationUrl: authorizationRequest.authorizationUrl,
      transactionToken,
    };
  }

  async completeGoogleAuthentication(input: GoogleAuthenticationInput): Promise<AuthSession> {
    const transaction = await this.verifyGoogleTransaction(input.transactionToken);
    let identity: GoogleIdentity;
    try {
      identity = await this.googleAuth.handleCallback({
        callbackUrl: input.callbackUrl,
        state: transaction.state,
        nonce: transaction.nonce,
        codeVerifier: transaction.codeVerifier,
      });
    } catch {
      throw new UnauthorizedException('Falha ao validar a autenticação Google');
    }

    const user = await this.resolveGoogleIdentity(identity);
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user };
  }

  async resolveGoogleIdentity(identity: GoogleIdentity) {
    const subject = identity.subject.trim();
    if (!subject) throw new UnauthorizedException('Identidade Google inválida');

    const existingUser = await this.repository.findUserByExternalIdentity(GOOGLE_PROVIDER, subject);
    if (existingUser) return existingUser;

    const usernameBase = this.usernameBase(identity);
    const displayName = this.displayNameFor(identity, usernameBase);
    const email = identity.email?.trim() || undefined;

    for (let attempt = 0; attempt < MAX_USER_CREATION_ATTEMPTS; attempt += 1) {
      const username = attempt === 0 ? usernameBase : `${usernameBase}-${attempt + 1}`;
      try {
        return await this.repository.createUserWithExternalIdentity({
          provider: GOOGLE_PROVIDER,
          subject,
          email,
          emailVerified: identity.emailVerified,
          key: randomUUID(),
          username,
          displayName,
        });
      } catch (error) {
        if (!(error instanceof UniqueConstraintViolationError)) throw error;

        const concurrentlyCreatedUser = await this.repository.findUserByExternalIdentity(
          GOOGLE_PROVIDER,
          subject,
        );
        if (concurrentlyCreatedUser) return concurrentlyCreatedUser;
      }
    }

    throw new ServiceUnavailableException('Não foi possível resolver a identidade Google');
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

  private usernameBase(identity: GoogleIdentity): string {
    return this.sanitizeUsername(identity.displayName)
      ?? this.sanitizeUsername(identity.email)
      ?? 'user';
  }

  private displayNameFor(identity: GoogleIdentity, username: string): string {
    if (identity.displayName?.trim()) return identity.displayName;
    return identity.email?.trim() || username;
  }

  private sanitizeUsername(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const sanitized = value
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return sanitized || undefined;
  }

  private async verifyGoogleTransaction(transactionToken: string | undefined): Promise<{
    state: string;
    nonce: string;
    codeVerifier: string;
  }> {
    if (!transactionToken) throw new UnauthorizedException('Transação de autenticação Google ausente');

    let payload: GoogleAuthTransaction;
    try {
      payload = await this.jwt.verifyAsync<GoogleAuthTransaction>(transactionToken, {
        algorithms: ['HS256'],
        issuer: this.config.getOrThrow<string>('jwtIssuer'),
        audience: this.config.getOrThrow<string>('jwtAudience'),
      });
    } catch {
      throw new UnauthorizedException('Transação de autenticação Google inválida');
    }

    if (
      payload.purpose !== GOOGLE_AUTH_TRANSACTION_PURPOSE
      || typeof payload.state !== 'string'
      || !payload.state
      || typeof payload.nonce !== 'string'
      || !payload.nonce
      || typeof payload.codeVerifier !== 'string'
      || !payload.codeVerifier
    ) {
      throw new UnauthorizedException('Transação de autenticação Google inválida');
    }

    return {
      state: payload.state,
      nonce: payload.nonce,
      codeVerifier: payload.codeVerifier,
    };
  }
}
