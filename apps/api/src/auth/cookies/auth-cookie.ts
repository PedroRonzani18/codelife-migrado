import type { ConfigService } from '@nestjs/config';
import type { CookieOptions } from 'express';

export const GOOGLE_AUTH_TRANSACTION_COOKIE = 'codelife_google_auth_transaction';

export function sessionCookieOptions(config: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    secure: config.getOrThrow<boolean>('cookieSecure'),
    sameSite: config.getOrThrow<'lax' | 'strict' | 'none'>('cookieSameSite'),
    path: '/',
    maxAge: config.getOrThrow<number>('cookieMaxAgeSeconds') * 1000,
  };
}

export function googleAuthTransactionCookieOptions(config: ConfigService): CookieOptions {
  return {
    httpOnly: true,
    secure: config.getOrThrow<boolean>('cookieSecure'),
    sameSite: 'lax',
    path: '/auth/google/callback',
    maxAge: 10 * 60 * 1000,
  };
}

export function clearGoogleAuthTransactionCookieOptions(config: ConfigService): CookieOptions {
  const options = googleAuthTransactionCookieOptions(config);
  return {
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
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
