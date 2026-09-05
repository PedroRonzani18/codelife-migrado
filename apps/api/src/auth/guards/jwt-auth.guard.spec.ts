import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';
import type { AuthService } from '../service/auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextFor(cookies: Record<string, string> = {}) {
  const request: { cookies: Record<string, string>; user?: unknown } = { cookies };
  const context = {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const config = { getOrThrow: () => 'session' } as unknown as ConfigService;
  const auth = { resolveSession: jest.fn() };
  const guard = new JwtAuthGuard(reflector as unknown as Reflector, config, auth as unknown as AuthService);

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
    auth.resolveSession.mockReset();
  });

  it('allows explicitly public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(contextFor().context)).resolves.toBe(true);
    expect(auth.resolveSession).not.toHaveBeenCalled();
  });

  it('rejects absent cookies and attaches a resolved user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    await expect(guard.canActivate(contextFor().context)).rejects.toBeInstanceOf(UnauthorizedException);

    const { context, request } = contextFor({ session: 'jwt' });
    auth.resolveSession.mockResolvedValue({ id: 'user-1' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1' });
  });
});
