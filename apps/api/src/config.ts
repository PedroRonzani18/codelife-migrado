export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  webOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  cookieName: string;
  cookieSecure: boolean;
  cookieSameSite: 'lax' | 'strict' | 'none';
  cookieMaxAgeSeconds: number;
  experimentalLoginEnabled: boolean;
};

function required(raw: Record<string, unknown>, key: string, fallback?: string) {
  const value = raw[key] ?? fallback;
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

function boolean(raw: unknown, key: string, fallback: boolean) {
  if (raw === undefined || raw === '') return fallback;
  if (['true', '1'].includes(String(raw).toLowerCase())) return true;
  if (['false', '0'].includes(String(raw).toLowerCase())) return false;
  throw new Error(`${key} must be true or false`);
}

export function validateConfig(raw: Record<string, unknown>): AppConfig {
  let directory = __dirname;
  while (true) {
    const envPath = resolve(directory, '.env');
    if (existsSync(envPath)) {
      loadEnv({ path: envPath, quiet: true, override: true });
      break;
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  const config = { ...raw, ...process.env };
  const value = (config.NODE_ENV ?? 'development').toString();
  if (!['development', 'test', 'production'].includes(value)) {
    throw new Error('NODE_ENV must be development, test or production');
  }
  const nodeEnv = value as AppConfig['nodeEnv'];
  const port = Number(config.API_PORT ?? 3001);
  if (!Number.isInteger(port) || port <= 0) throw new Error('API_PORT must be a positive integer');
  const cookieSameSite = (config.AUTH_COOKIE_SAME_SITE ?? 'lax').toString();
  if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict or none');
  }
  const cookieSecure = boolean(config.AUTH_COOKIE_SECURE, 'AUTH_COOKIE_SECURE', nodeEnv === 'production');
  if (cookieSameSite === 'none' && !cookieSecure) {
    throw new Error('AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true');
  }
  const cookieMaxAgeSeconds = Number(config.AUTH_COOKIE_MAX_AGE_SECONDS ?? 28800);
  if (!Number.isInteger(cookieMaxAgeSeconds) || cookieMaxAgeSeconds <= 0) {
    throw new Error('AUTH_COOKIE_MAX_AGE_SECONDS must be a positive integer');
  }
  return {
    nodeEnv,
    port,
    databaseUrl: required(config, 'DATABASE_URL'),
    webOrigin: required(config, 'WEB_ORIGIN', 'http://localhost:5173'),
    jwtSecret: required(config, 'JWT_SECRET'),
    jwtExpiresIn: required(config, 'JWT_EXPIRES_IN', '8h'),
    cookieName: required(config, 'AUTH_COOKIE_NAME', 'codelife_experimental_session'),
    cookieSecure,
    cookieSameSite: cookieSameSite as AppConfig['cookieSameSite'],
    cookieMaxAgeSeconds,
    experimentalLoginEnabled: boolean(config.EXPERIMENTAL_LOGIN_ENABLED, 'EXPERIMENTAL_LOGIN_ENABLED', false),
  };
}
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as loadEnv } from 'dotenv';
