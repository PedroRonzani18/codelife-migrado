import { ForbiddenException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { IAuthRepository } from '../repository/auth.repository.interface';
import { AuthService, EXPERIMENTAL_USER_KEY } from './auth.service';

describe('AuthService', () => {
  const user = { id: 'db-user-1', key: EXPERIMENTAL_USER_KEY, username: 'aluna.demo', displayName: 'Aluna Demo' };
  let repository: jest.Mocked<IAuthRepository>;
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let values: Record<string, unknown>;
  let service: AuthService;

  beforeEach(() => {
    repository = { findUserById: jest.fn(), findUserByKey: jest.fn() };
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
