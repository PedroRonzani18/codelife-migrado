import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import type { UserRecord } from '../../users/internal/user-record';
import { ClearSessionCookieInterceptor, SetSessionCookieInterceptor } from './session-cookie.interceptor';

describe('session cookie interceptors', () => {
  const user: UserRecord = {
    id: 'database-id',
    key: 'user-key',
    username: 'user',
    displayName: 'User',
    role: 'USER',
  };
  const values: Record<string, unknown> = {
    cookieName: 'codelife_session',
    cookieSecure: true,
    cookieSameSite: 'strict',
    cookieMaxAgeSeconds: 3600,
  };
  const config = { getOrThrow: (key: string) => values[key] } as unknown as ConfigService;

  function contextFor(response: { cookie?: jest.Mock; clearCookie?: jest.Mock }): ExecutionContext {
    return {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ExecutionContext;
  }

  it('sets the session cookie and returns the public session contract', async () => {
    const response = { cookie: jest.fn() };
    const interceptor = new SetSessionCookieInterceptor(config);
    const result = await firstValueFrom(interceptor.intercept(contextFor(response), {
      handle: () => of({ token: 'session-token', user }),
    }));

    expect(result).toEqual({ user: { id: 'user-key', username: 'user', displayName: 'User', role: 'USER' } });
    expect(response.cookie).toHaveBeenCalledWith('codelife_session', 'session-token', expect.objectContaining({ httpOnly: true, secure: true }));
  });

  it('clears the session cookie while preserving the response body', async () => {
    const response = { clearCookie: jest.fn() };
    const interceptor = new ClearSessionCookieInterceptor(config);
    const result = await firstValueFrom(interceptor.intercept(contextFor(response), {
      handle: () => of({ ok: true as const }),
    }));

    expect(result).toEqual({ ok: true });
    expect(response.clearCookie).toHaveBeenCalledWith('codelife_session', expect.objectContaining({ httpOnly: true, secure: true }));
  });
});
