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
  const value = (raw.NODE_ENV ?? 'development').toString();
  if (!['development', 'test', 'production'].includes(value)) {
    throw new Error('NODE_ENV must be development, test or production');
  }
  const nodeEnv = value as AppConfig['nodeEnv'];
  const port = Number(raw.API_PORT ?? 3001);
  if (!Number.isInteger(port) || port <= 0) throw new Error('API_PORT must be a positive integer');
  const cookieSameSite = (raw.AUTH_COOKIE_SAME_SITE ?? 'lax').toString();
  if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict or none');
  }
  const cookieSecure = boolean(raw.AUTH_COOKIE_SECURE, 'AUTH_COOKIE_SECURE', nodeEnv === 'production');
  if (cookieSameSite === 'none' && !cookieSecure) {
    throw new Error('AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true');
  }
  const cookieMaxAgeSeconds = Number(raw.AUTH_COOKIE_MAX_AGE_SECONDS ?? 28800);
  if (!Number.isInteger(cookieMaxAgeSeconds) || cookieMaxAgeSeconds <= 0) {
    throw new Error('AUTH_COOKIE_MAX_AGE_SECONDS must be a positive integer');
  }
  return {
    nodeEnv,
    port,
    databaseUrl: required(raw, 'DATABASE_URL'),
    webOrigin: required(raw, 'WEB_ORIGIN', 'http://localhost:5173'),
    jwtSecret: required(raw, 'JWT_SECRET'),
    jwtExpiresIn: required(raw, 'JWT_EXPIRES_IN', '8h'),
    cookieName: required(raw, 'AUTH_COOKIE_NAME', 'codelife_experimental_session'),
    cookieSecure,
    cookieSameSite: cookieSameSite as AppConfig['cookieSameSite'],
    cookieMaxAgeSeconds,
    experimentalLoginEnabled: boolean(raw.EXPERIMENTAL_LOGIN_ENABLED, 'EXPERIMENTAL_LOGIN_ENABLED', false),
  };
}
