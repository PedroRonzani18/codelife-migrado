import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { UserRole } from '@codelife/contracts/users';
import type { UserRecord } from '../../users/internal/user-record';
import { RolesGuard } from './roles.guard';

function user(role: UserRole): UserRecord {
  return { id: 'user-id', key: 'user-key', username: 'user', displayName: 'User', role };
}

function contextFor(currentUser?: UserRecord) {
  const request: { user?: UserRecord } = { user: currentUser };
  const context = {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new RolesGuard(reflector as unknown as Reflector);

  beforeEach(() => {
    reflector.getAllAndOverride.mockReset();
  });

  it.each<UserRole>(['USER', 'ADMIN'])('allows %s without role metadata', (role) => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextFor(user(role)).context)).toBe(true);
  });

  it('rejects a USER when ADMIN is required', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(contextFor(user('USER')).context)).toThrow(ForbiddenException);
  });

  it('allows an ADMIN when ADMIN is required', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(guard.canActivate(contextFor(user('ADMIN')).context)).toBe(true);
  });

  it('keeps an absent session as unauthorized when a role rule is present', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    expect(() => guard.canActivate(contextFor().context)).toThrow(UnauthorizedException);
  });
});
