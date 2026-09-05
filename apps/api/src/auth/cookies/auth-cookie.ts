import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export function sessionCookieOptions(config: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    secure: config.getOrThrow<boolean>('cookieSecure'),
    sameSite: config.getOrThrow<'lax' | 'strict' | 'none'>('cookieSameSite'),
    path: '/',
    maxAge: config.getOrThrow<number>('cookieMaxAgeSeconds') * 1000,
  };
}

export function clearSessionCookieOptions(config: ConfigService): CookieOptions {
  const options = sessionCookieOptions(config);
  return {
    httpOnly: options.httpOnly,
    path: options.path,
    sameSite: options.sameSite,
    secure: options.secure,
  };
}
