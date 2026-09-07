import { ForbiddenException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AUTH_PROVIDER_KEYS } from '../constants';
import { GoogleAuthService } from '../google-auth/google-auth.service';
import { USERS_PROVIDER_KEYS } from '../../users/constants';
import type { IUsersRepository } from '../../users/repository/users.repository.interface';
import type { UserRecord } from '../../users/internal/user-record';
import type {
  ExternalIdentityRecord,
  IExternalIdentitiesRepository,
} from '../identity/external-identities.repository.interface';
import type { IIdentityTransaction } from '../identity/identity-transaction.interface';
import { UniqueConstraintViolationError } from '@/prisma/errors/unique-constraint-violation.error';
import type { GoogleIdentity } from '../google-auth/google-auth.types';

export interface AuthSession {
  token: string;
  user: UserRecord;
}

export interface GoogleAuthorization {
  authorizationUrl: string;
  transactionToken: string;
}

export interface GoogleAuthenticationInput {
  callbackUrl: string;
  transactionToken?: string;
}

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
export class AuthService {
  constructor(
    @Inject(USERS_PROVIDER_KEYS.USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    @Inject(AUTH_PROVIDER_KEYS.EXTERNAL_IDENTITIES_REPOSITORY)
    private readonly externalIdentitiesRepository: IExternalIdentitiesRepository,
    @Inject(AUTH_PROVIDER_KEYS.IDENTITY_TRANSACTION)
    private readonly identityTransaction: IIdentityTransaction,
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
    const user = await this.usersRepository.findByKey(EXPERIMENTAL_USER_KEY);
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

  async resolveGoogleIdentity(identity: GoogleIdentity): Promise<UserRecord> {
    const subject = identity.subject.trim();
    if (!subject) throw new UnauthorizedException('Identidade Google inválida');

    const existingIdentity = await this.externalIdentitiesRepository.findByProviderAndSubject(
      GOOGLE_PROVIDER,
      subject,
    );
    if (existingIdentity) return this.userFromExternalIdentity(existingIdentity);

    const usernameBase = this.usernameBase(identity);
    const displayName = this.displayNameFor(identity, usernameBase);
    const email = identity.email?.trim() || undefined;

    for (let attempt = 0; attempt < MAX_USER_CREATION_ATTEMPTS; attempt += 1) {
      const username = attempt === 0 ? usernameBase : `${usernameBase}-${attempt + 1}`;
      try {
        return await this.identityTransaction.run(async ({ users, externalIdentities }) => {
          const user = await users.create({
            key: randomUUID(),
            username,
            displayName,
          });
          await externalIdentities.create({
            provider: GOOGLE_PROVIDER,
            subject,
            email,
            emailVerified: identity.emailVerified,
            userId: user.id,
          });
          return user;
        });
      } catch (error) {
        if (!(error instanceof UniqueConstraintViolationError)) throw error;

        const concurrentlyCreatedIdentity = await this.externalIdentitiesRepository.findByProviderAndSubject(
          GOOGLE_PROVIDER,
          subject,
        );
        if (concurrentlyCreatedIdentity) return this.userFromExternalIdentity(concurrentlyCreatedIdentity);
      }
    }

    throw new ServiceUnavailableException('Não foi possível resolver a identidade Google');
  }

  async resolveSession(token: string): Promise<UserRecord> {
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

    const user = await this.usersRepository.findById(subject);
    if (!user) throw new UnauthorizedException('Sessão inválida');
    return user;
  }

  private async userFromExternalIdentity(identity: ExternalIdentityRecord): Promise<UserRecord> {
    const user = await this.usersRepository.findById(identity.userId);
    if (!user) throw new Error('Inconsistent authentication data: external identity user is absent');
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
