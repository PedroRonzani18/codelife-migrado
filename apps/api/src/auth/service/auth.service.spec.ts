import { ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { GoogleAuthService } from '../google-auth/google-auth.service';
import type { IUsersRepository } from '../../users/persistence/users.repository.interface';
import type { UserRecord } from '../../users/internal/user-record';
import type { ExternalIdentityRecord, IExternalIdentitiesRepository } from '../identity/external-identities.repository.interface';
import type { IdentityTransactionRepositories, IIdentityTransaction } from '../identity/identity-transaction.interface';
import { UniqueConstraintViolationError } from '@/prisma/errors/unique-constraint-violation.error';
import { AuthService, EXPERIMENTAL_USER_KEY } from './auth.service';

describe('AuthService', () => {
  const user: UserRecord = {
    id: 'db-user-1',
    key: EXPERIMENTAL_USER_KEY,
    username: 'aluna.demo',
    displayName: 'Aluna Demo',
    role: 'USER',
  };
  let usersRepository: jest.Mocked<IUsersRepository>;
  let externalIdentitiesRepository: jest.Mocked<IExternalIdentitiesRepository>;
  let identityTransaction: jest.Mocked<IIdentityTransaction>;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let googleAuth: { createAuthorizationUrl: jest.Mock; handleCallback: jest.Mock };
  let values: Record<string, unknown>;
  let service: AuthService;

  function externalIdentity(userId: string, subject = 'google-subject'): ExternalIdentityRecord {
    return {
      id: 'external-identity-1',
      provider: 'GOOGLE',
      subject,
      userId,
      email: null,
      emailVerified: null,
    };
  }

  beforeEach(() => {
    usersRepository = {
      findById: jest.fn(),
      findByKey: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      updateRoleByKey: jest.fn(),
    };
    externalIdentitiesRepository = {
      findByProviderAndSubject: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    identityTransaction = { run: jest.fn() } as unknown as jest.Mocked<IIdentityTransaction>;
    identityTransaction.run.mockImplementation(async (operation) => operation({
      users: usersRepository,
      externalIdentities: externalIdentitiesRepository,
    } satisfies IdentityTransactionRepositories));
    jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    googleAuth = { createAuthorizationUrl: jest.fn(), handleCallback: jest.fn() };
    values = { nodeEnv: 'test', experimentalLoginEnabled: true, jwtIssuer: 'codelife-api', jwtAudience: 'codelife-web' };
    const config = { getOrThrow: (key: string) => values[key] } as unknown as ConfigService;
    service = new AuthService(
      usersRepository,
      externalIdentitiesRepository,
      identityTransaction,
      jwt as unknown as JwtService,
      config,
      googleAuth as unknown as GoogleAuthService,
    );
  });

  it('issues a session only for the fixed seed user', async () => {
    usersRepository.findByKey.mockResolvedValue(user);
    jwt.signAsync.mockResolvedValue('signed-token');
    await expect(service.startExperimentalSession()).resolves.toEqual({ token: 'signed-token', user });
    expect(usersRepository.findByKey).toHaveBeenCalledWith(EXPERIMENTAL_USER_KEY);
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: user.id });
  });

  it('rejects experimental login when disabled or in production', async () => {
    values.experimentalLoginEnabled = false;
    await expect(service.startExperimentalSession()).rejects.toBeInstanceOf(ForbiddenException);
    values.experimentalLoginEnabled = true;
    values.nodeEnv = 'production';
    await expect(service.startExperimentalSession()).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('fails safely when the fixture identity is absent', async () => {
    usersRepository.findByKey.mockResolvedValue(null);
    await expect(service.startExperimentalSession()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('signs the OIDC transaction before starting Google authorization', async () => {
    googleAuth.createAuthorizationUrl.mockResolvedValue({
      authorizationUrl: 'https://accounts.google.com/auth',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    });
    jwt.signAsync.mockResolvedValue('transaction-token');

    await expect(service.startGoogleAuthorization()).resolves.toEqual({
      authorizationUrl: 'https://accounts.google.com/auth',
      transactionToken: 'transaction-token',
    });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      purpose: 'google-auth-transaction',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    }, { expiresIn: '10m' });
  });

  it('converts a provider failure while starting Google authorization to service unavailable', async () => {
    googleAuth.createAuthorizationUrl.mockRejectedValue(new Error('provider unavailable'));

    await expect(service.startGoogleAuthorization()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('validates the signed transaction, resolves the identity and issues the internal session', async () => {
    jwt.verifyAsync.mockResolvedValue({
      purpose: 'google-auth-transaction',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    });
    googleAuth.handleCallback.mockResolvedValue({ subject: 'google-subject', displayName: 'Person Example' });
    externalIdentitiesRepository.findByProviderAndSubject.mockResolvedValue(externalIdentity(user.id));
    usersRepository.findById.mockResolvedValue(user);
    jwt.signAsync.mockResolvedValue('session-token');

    await expect(service.completeGoogleAuthentication({
      callbackUrl: 'http://localhost:3001/auth/google/callback?code=code&state=state',
      transactionToken: 'transaction-token',
    })).resolves.toEqual({ token: 'session-token', user });
    expect(jwt.verifyAsync).toHaveBeenCalledWith('transaction-token', {
      algorithms: ['HS256'],
      issuer: 'codelife-api',
      audience: 'codelife-web',
    });
    expect(googleAuth.handleCallback).toHaveBeenCalledWith({
      callbackUrl: 'http://localhost:3001/auth/google/callback?code=code&state=state',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    });
    expect(externalIdentitiesRepository.findByProviderAndSubject).toHaveBeenCalledWith('GOOGLE', 'google-subject');
    expect(usersRepository.findById).toHaveBeenCalledWith(user.id);
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: user.id });
  });

  it('rejects invalid transactions and provider callback failures without creating a session', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid transaction'));
    await expect(service.completeGoogleAuthentication({ callbackUrl: 'http://localhost:3001/auth/google/callback' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(googleAuth.handleCallback).not.toHaveBeenCalled();

    jwt.verifyAsync.mockResolvedValue({ purpose: 'google-auth-transaction', state: 'state', nonce: 'nonce', codeVerifier: 'verifier' });
    googleAuth.handleCallback.mockRejectedValue(new Error('provider rejected callback'));
    await expect(service.completeGoogleAuthentication({
      callbackUrl: 'http://localhost:3001/auth/google/callback',
      transactionToken: 'transaction-token',
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('looks up an existing external identity and then its User', async () => {
    externalIdentitiesRepository.findByProviderAndSubject.mockResolvedValue(externalIdentity(user.id));
    usersRepository.findById.mockResolvedValue(user);

    await expect(service.resolveGoogleIdentity({
      subject: 'google-subject',
      displayName: 'Pedro Augusto Ronzani',
      email: 'pedro@example.com',
    })).resolves.toBe(user);

    expect(externalIdentitiesRepository.findByProviderAndSubject).toHaveBeenCalledWith('GOOGLE', 'google-subject');
    expect(usersRepository.findById).toHaveBeenCalledWith(user.id);
    expect(usersRepository.create).not.toHaveBeenCalled();
    expect(identityTransaction.run).not.toHaveBeenCalled();
  });

  it('fails explicitly when an external identity points to an absent User', async () => {
    externalIdentitiesRepository.findByProviderAndSubject.mockResolvedValue(externalIdentity('missing-user'));
    usersRepository.findById.mockResolvedValue(null);

    await expect(service.resolveGoogleIdentity({ subject: 'google-subject', displayName: 'Person' }))
      .rejects.toThrow('external identity user is absent');
  });

  it('creates User and ExternalIdentity through one transaction', async () => {
    const createdUser: UserRecord = {
      id: 'db-user-2',
      key: 'generated-key',
      username: 'pedro-augusto-ronzani',
      displayName: 'Pedro Augusto Ronzani',
      role: 'USER',
    };
    usersRepository.create.mockResolvedValue(createdUser);
    externalIdentitiesRepository.create.mockResolvedValue(externalIdentity(createdUser.id));

    await expect(service.resolveGoogleIdentity({
      subject: 'google-subject',
      displayName: 'Pedro Augusto Ronzani',
      email: 'pedro@example.com',
      emailVerified: true,
    })).resolves.toBe(createdUser);

    expect(identityTransaction.run).toHaveBeenCalledTimes(1);
    expect(usersRepository.create).toHaveBeenCalledWith({
      key: expect.any(String),
      username: 'pedro-augusto-ronzani',
      displayName: 'Pedro Augusto Ronzani',
    });
    expect(externalIdentitiesRepository.create).toHaveBeenCalledWith({
      provider: 'GOOGLE',
      subject: 'google-subject',
      email: 'pedro@example.com',
      emailVerified: true,
      userId: createdUser.id,
    });
    expect(usersRepository.create.mock.invocationCallOrder[0]).toBeLessThan(
      externalIdentitiesRepository.create.mock.invocationCallOrder[0],
    );
  });

  it('uses email and then a generic base when display name is unavailable', async () => {
    usersRepository.create
      .mockResolvedValueOnce({ ...user, username: 'person-example-com' })
      .mockResolvedValueOnce({ ...user, username: 'user' });
    externalIdentitiesRepository.create.mockResolvedValue(externalIdentity(user.id));

    await service.resolveGoogleIdentity({ subject: 'google-a', email: 'person@example.com' });
    await service.resolveGoogleIdentity({ subject: 'google-b' });

    expect(usersRepository.create.mock.calls[0][0].username).toBe('person-example-com');
    expect(usersRepository.create.mock.calls[1][0].username).toBe('user');
  });

  it('retries with a suffix after a unique conflict and rechecks the external identity', async () => {
    const firstUser: UserRecord = { ...user, id: 'db-user-3', username: 'pedro-augusto-ronzani' };
    externalIdentitiesRepository.findByProviderAndSubject
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(externalIdentity(firstUser.id));
    usersRepository.create
      .mockRejectedValueOnce(new UniqueConstraintViolationError())
      .mockResolvedValueOnce(firstUser);
    externalIdentitiesRepository.create.mockResolvedValue(externalIdentity(firstUser.id));

    await expect(service.resolveGoogleIdentity({ subject: 'google-subject', displayName: 'Pedro Augusto Ronzani' }))
      .resolves.toBe(firstUser);

    expect(usersRepository.create.mock.calls[0][0].username).toBe('pedro-augusto-ronzani');
    expect(usersRepository.create.mock.calls[1][0].username).toBe('pedro-augusto-ronzani-2');
  });

  it('returns the concurrently provisioned User when the identity conflict is observed', async () => {
    const concurrentlyCreatedUser: UserRecord = { ...user, id: 'db-user-race' };
    externalIdentitiesRepository.findByProviderAndSubject
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(externalIdentity(concurrentlyCreatedUser.id));
    usersRepository.create.mockRejectedValue(new UniqueConstraintViolationError());
    usersRepository.findById.mockResolvedValue(concurrentlyCreatedUser);

    await expect(service.resolveGoogleIdentity({ subject: 'google-subject', displayName: 'Person' }))
      .resolves.toBe(concurrentlyCreatedUser);

    expect(usersRepository.create).toHaveBeenCalledTimes(1);
    expect(identityTransaction.run).toHaveBeenCalledTimes(1);
    expect(usersRepository.findById).toHaveBeenCalledWith(concurrentlyCreatedUser.id);
  });

  it('resolves a valid JWT session and keeps database errors observable', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: user.id });
    usersRepository.findById.mockResolvedValue(user);
    await expect(service.resolveSession('token')).resolves.toEqual(user);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('token', expect.objectContaining({ algorithms: ['HS256'] }));

    usersRepository.findById.mockRejectedValue(new Error('database offline'));
    await expect(service.resolveSession('token')).rejects.toThrow('database offline');
  });

  it('rejects invalid tokens, subjects and missing users', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad signature'));
    await expect(service.resolveSession('token')).rejects.toBeInstanceOf(UnauthorizedException);

    jwt.verifyAsync.mockResolvedValue({ sub: '' });
    await expect(service.resolveSession('token')).rejects.toBeInstanceOf(UnauthorizedException);

    jwt.verifyAsync.mockResolvedValue({ sub: user.id });
    usersRepository.findById.mockResolvedValue(null);
    await expect(service.resolveSession('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
