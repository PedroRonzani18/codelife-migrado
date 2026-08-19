import ms, { type StringValue } from 'ms';

export type AppConfig = {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  webOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtIssuer: string;
  jwtAudience: string;
  cookieName: string;
  cookieSecure: boolean;
  cookieSameSite: 'lax' | 'strict' | 'none';
  cookieMaxAgeSeconds: number;
  experimentalLoginEnabled: boolean;
  swaggerEnabled: boolean;
};

function required(raw: Record<string, unknown>, key: string, fallback?: string) {
  const value = raw[key] ?? fallback;
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

function boolean(raw: unknown, key: string, fallback: boolean) {
  if (raw === undefined || raw === '') return fallback;
  const normalized = String(raw).trim().toLowerCase();
  if (['true', '1'].includes(normalized)) return true;
  if (['false', '0'].includes(normalized)) return false;
  throw new Error(`${key} must be true or false`);
}

function positiveInteger(raw: unknown, key: string, fallback: number, maximum?: number) {
  const value = raw === undefined || raw === '' ? fallback : Number(raw);
  if (!Number.isInteger(value) || value <= 0 || (maximum !== undefined && value > maximum)) {
    const range = maximum === undefined ? 'a positive integer' : `an integer between 1 and ${maximum}`;
    throw new Error(`${key} must be ${range}`);
  }
  return value;
}

function postgresUrl(raw: Record<string, unknown>) {
  const value = required(raw, 'DATABASE_URL');
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }
  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.pathname ||
    parsed.pathname === '/'
  ) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL');
  }
  return value;
}

function httpOrigin(raw: Record<string, unknown>) {
  const value = required(raw, 'WEB_ORIGIN', 'http://localhost:5173');
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('WEB_ORIGIN must be a valid HTTP or HTTPS origin');
  }
  const isOrigin =
    ['http:', 'https:'].includes(parsed.protocol) &&
    Boolean(parsed.hostname) &&
    !value.includes('*') &&
    !parsed.username &&
    !parsed.password &&
    parsed.pathname === '/' &&
    !parsed.search &&
    !parsed.hash;
  if (!isOrigin) throw new Error('WEB_ORIGIN must be a valid HTTP or HTTPS origin without a path');
  return parsed.origin;
}

export function validateConfig(raw: Record<string, unknown>): AppConfig {
  const nodeEnvValue = String(raw.NODE_ENV ?? 'development');
  if (!['development', 'test', 'production'].includes(nodeEnvValue)) {
    throw new Error('NODE_ENV must be development, test or production');
  }
  const nodeEnv = nodeEnvValue as AppConfig['nodeEnv'];
  const port = positiveInteger(raw.API_PORT, 'API_PORT', 3001, 65_535);

  const jwtSecret = required(raw, 'JWT_SECRET');
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  const jwtExpiresIn = required(raw, 'JWT_EXPIRES_IN', '8h');
  const jwtDurationMs = ms(jwtExpiresIn as StringValue);
  if (!Number.isFinite(jwtDurationMs) || jwtDurationMs <= 0) {
    throw new Error('JWT_EXPIRES_IN must be a positive duration such as 30m or 8h');
  }

  const cookieSameSiteValue = String(raw.AUTH_COOKIE_SAME_SITE ?? 'lax').trim().toLowerCase();
  if (!['lax', 'strict', 'none'].includes(cookieSameSiteValue)) {
    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict or none');
  }
  const cookieSameSite = cookieSameSiteValue as AppConfig['cookieSameSite'];
  const cookieSecure = boolean(raw.AUTH_COOKIE_SECURE, 'AUTH_COOKIE_SECURE', nodeEnv === 'production');
  if (nodeEnv === 'production' && !cookieSecure) {
    throw new Error('AUTH_COOKIE_SECURE must be true in production');
  }
  if (cookieSameSite === 'none' && !cookieSecure) {
    throw new Error('AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true');
  }

  const experimentalLoginEnabled = boolean(
    raw.EXPERIMENTAL_LOGIN_ENABLED,
    'EXPERIMENTAL_LOGIN_ENABLED',
    false,
  );
  if (nodeEnv === 'production' && experimentalLoginEnabled) {
    throw new Error('EXPERIMENTAL_LOGIN_ENABLED must be false in production');
  }

  return {
    nodeEnv,
    port,
    databaseUrl: postgresUrl(raw),
    webOrigin: httpOrigin(raw),
    jwtSecret,
    jwtExpiresIn,
    jwtIssuer: required(raw, 'JWT_ISSUER', 'codelife-api'),
    jwtAudience: required(raw, 'JWT_AUDIENCE', 'codelife-web'),
    cookieName: required(raw, 'AUTH_COOKIE_NAME', 'codelife_experimental_session'),
    cookieSecure,
    cookieSameSite,
    cookieMaxAgeSeconds: positiveInteger(
      raw.AUTH_COOKIE_MAX_AGE_SECONDS,
      'AUTH_COOKIE_MAX_AGE_SECONDS',
      28_800,
    ),
    experimentalLoginEnabled,
    swaggerEnabled: boolean(raw.SWAGGER_ENABLED, 'SWAGGER_ENABLED', nodeEnv === 'development'),
  };
}
