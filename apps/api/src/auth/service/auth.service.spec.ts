import { ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import {
  AuthRepositoryUniqueConstraintError,
  type IAuthRepository,
} from '../repository/auth.repository.interface';
import { AuthService, EXPERIMENTAL_USER_KEY } from './auth.service';

describe('AuthService', () => {
  const user = { id: 'db-user-1', key: EXPERIMENTAL_USER_KEY, username: 'aluna.demo', displayName: 'Aluna Demo' };
  let repository: jest.Mocked<IAuthRepository>;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let values: Record<string, unknown>;
  let service: AuthService;

  beforeEach(() => {
    repository = {
      findUserById: jest.fn(),
      findUserByKey: jest.fn(),
      findUserByExternalIdentity: jest.fn(),
      createUserWithExternalIdentity: jest.fn(),
    };
    jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    values = { nodeEnv: 'test', experimentalLoginEnabled: true, jwtIssuer: 'codelife-api', jwtAudience: 'codelife-web' };
    const config = { getOrThrow: (key: string) => values[key] } as unknown as ConfigService;
    service = new AuthService(repository, jwt as unknown as JwtService, config);
  });

  it('issues a session only for the fixed seed user', async () => {
    repository.findUserByKey.mockResolvedValue(user);
    jwt.signAsync.mockResolvedValue('signed-token');
    await expect(service.startExperimentalSession()).resolves.toEqual({ token: 'signed-token', user });
    expect(repository.findUserByKey).toHaveBeenCalledWith(EXPERIMENTAL_USER_KEY);
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
    repository.findUserByKey.mockResolvedValue(null);
    await expect(service.startExperimentalSession()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('resolves an existing Google identity without creating another user', async () => {
    repository.findUserByExternalIdentity.mockResolvedValue(user);

    await expect(service.resolveGoogleIdentity({
      subject: 'google-subject',
      displayName: 'Pedro Augusto Ronzani',
      email: 'pedro@example.com',
    })).resolves.toBe(user);

    expect(repository.createUserWithExternalIdentity).not.toHaveBeenCalled();
  });

  it('creates a Google user with a stable-independent key and normalized username', async () => {
    const createdUser = {
      id: 'db-user-2',
      key: 'generated-key',
      username: 'pedro-augusto-ronzani',
      displayName: 'Pedro Augusto Ronzani',
    };
    repository.findUserByExternalIdentity.mockResolvedValue(null);
    repository.createUserWithExternalIdentity.mockResolvedValue(createdUser);

    await expect(service.resolveGoogleIdentity({
      subject: 'google-subject',
      displayName: 'Pedro Augusto Ronzani',
      email: 'pedro@example.com',
      emailVerified: true,
    })).resolves.toBe(createdUser);

    expect(repository.createUserWithExternalIdentity).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'GOOGLE',
      subject: 'google-subject',
      username: 'pedro-augusto-ronzani',
      displayName: 'Pedro Augusto Ronzani',
      email: 'pedro@example.com',
      emailVerified: true,
      key: expect.any(String),
    }));
    const input = repository.createUserWithExternalIdentity.mock.calls[0][0];
    expect(input.key).not.toBe(input.username);
    expect(input.key).not.toContain(input.subject);
    expect(input.key).not.toContain(input.email ?? '');
  });

  it('uses email and then a generic base when display name is unavailable', async () => {
    repository.findUserByExternalIdentity.mockResolvedValue(null);
    repository.createUserWithExternalIdentity
      .mockResolvedValueOnce({ ...user, username: 'person-example-com' })
      .mockResolvedValueOnce({ ...user, username: 'user' });

    await service.resolveGoogleIdentity({ subject: 'google-a', email: 'person@example.com' });
    await service.resolveGoogleIdentity({ subject: 'google-b' });

    expect(repository.createUserWithExternalIdentity.mock.calls[0][0].username).toBe('person-example-com');
    expect(repository.createUserWithExternalIdentity.mock.calls[1][0].username).toBe('user');
  });

  it('adds a suffix after a username collision', async () => {
    const firstUser = { ...user, id: 'db-user-3', username: 'pedro-augusto-ronzani' };
    repository.findUserByExternalIdentity
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(firstUser);
    repository.createUserWithExternalIdentity
      .mockRejectedValueOnce(new AuthRepositoryUniqueConstraintError())
      .mockResolvedValueOnce(firstUser);

    await expect(service.resolveGoogleIdentity({
      subject: 'google-subject',
      displayName: 'Pedro Augusto Ronzani',
    })).resolves.toBe(firstUser);

    expect(repository.createUserWithExternalIdentity.mock.calls[0][0].username).toBe('pedro-augusto-ronzani');
    expect(repository.createUserWithExternalIdentity.mock.calls[1][0].username).toBe('pedro-augusto-ronzani-2');
  });

  it('resolves a valid JWT session and keeps database errors observable', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: user.id });
    repository.findUserById.mockResolvedValue(user);
    await expect(service.resolveSession('token')).resolves.toEqual(user);
    expect(jwt.verifyAsync).toHaveBeenCalledWith('token', expect.objectContaining({ algorithms: ['HS256'] }));

    repository.findUserById.mockRejectedValue(new Error('database offline'));
    await expect(service.resolveSession('token')).rejects.toThrow('database offline');
  });

  it('rejects invalid tokens, subjects and missing users', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('bad signature'));
    await expect(service.resolveSession('token')).rejects.toBeInstanceOf(UnauthorizedException);

    jwt.verifyAsync.mockResolvedValue({ sub: '' });
    await expect(service.resolveSession('token')).rejects.toBeInstanceOf(UnauthorizedException);

    jwt.verifyAsync.mockResolvedValue({ sub: user.id });
    repository.findUserById.mockResolvedValue(null);
    await expect(service.resolveSession('token')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
