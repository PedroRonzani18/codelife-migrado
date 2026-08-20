import type { ConfigService } from '@nestjs/config';
import { clearSessionCookieOptions, sessionCookieOptions } from './auth-cookie';

describe('session cookie options', () => {
  const values: Record<string, unknown> = {
    cookieSecure: true,
    cookieSameSite: 'strict',
    cookieMaxAgeSeconds: 3600,
  };
  const config = { getOrThrow: (key: string) => values[key] } as unknown as ConfigService;

  it('builds matching secure options for setting and clearing cookies', () => {
    expect(sessionCookieOptions(config)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 3_600_000,
    });
    expect(clearSessionCookieOptions(config)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
  });
});
