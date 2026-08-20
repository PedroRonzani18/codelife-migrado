import ms, { type StringValue } from 'ms';
import { z } from 'zod';

function isPostgresUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      ['postgres:', 'postgresql:'].includes(parsed.protocol) &&
      Boolean(parsed.hostname) &&
      Boolean(parsed.pathname) &&
      parsed.pathname !== '/'
    );
  } catch {
    return false;
  }
}

function isHttpOrigin(value: string) {
  try {
    const parsed = new URL(value);
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      Boolean(parsed.hostname) &&
      !value.includes('*') &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname === '/' &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

const configSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'], {
        error: 'NODE_ENV must be development, test or production',
      })
      .default('development'),
    API_PORT: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce
        .number({ error: 'API_PORT must be an integer between 1 and 65535' })
        .int({ error: 'API_PORT must be an integer between 1 and 65535' })
        .min(1, { error: 'API_PORT must be an integer between 1 and 65535' })
        .max(65_535, {
          error: 'API_PORT must be an integer between 1 and 65535',
        })
        .default(3001),
    ),
    DATABASE_URL: z
      .string({ error: 'DATABASE_URL is required' })
      .trim()
      .min(1, { error: 'DATABASE_URL is required' })
      .refine(isPostgresUrl, {
        error: 'DATABASE_URL must be a valid PostgreSQL URL',
      }),
    WEB_ORIGIN: z
      .string({ error: 'WEB_ORIGIN is required' })
      .trim()
      .min(1, { error: 'WEB_ORIGIN is required' })
      .refine(isHttpOrigin, {
        error: 'WEB_ORIGIN must be a valid HTTP or HTTPS origin without a path',
      })
      .transform((value) => new URL(value).origin)
      .default('http://localhost:5173'),
    JWT_SECRET: z
      .string({ error: 'JWT_SECRET is required' })
      .trim()
      .min(1, { error: 'JWT_SECRET is required' })
      .min(32, { error: 'JWT_SECRET must contain at least 32 characters' }),
    JWT_EXPIRES_IN: z
      .string({ error: 'JWT_EXPIRES_IN is required' })
      .trim()
      .min(1, { error: 'JWT_EXPIRES_IN is required' })
      .refine(
        (value) => {
          const duration = ms(value as StringValue);
          return Number.isFinite(duration) && duration > 0;
        },
        {
          error: 'JWT_EXPIRES_IN must be a positive duration such as 30m or 8h',
        },
      )
      .default('8h'),
    JWT_ISSUER: z
      .string({ error: 'JWT_ISSUER is required' })
      .trim()
      .min(1, { error: 'JWT_ISSUER is required' })
      .default('codelife-api'),
    JWT_AUDIENCE: z
      .string({ error: 'JWT_AUDIENCE is required' })
      .trim()
      .min(1, { error: 'JWT_AUDIENCE is required' })
      .default('codelife-web'),
    AUTH_COOKIE_NAME: z
      .string({ error: 'AUTH_COOKIE_NAME is required' })
      .trim()
      .min(1, { error: 'AUTH_COOKIE_NAME is required' })
      .default('codelife_experimental_session'),
    AUTH_COOKIE_SECURE: z
      .stringbool({ error: 'AUTH_COOKIE_SECURE must be true or false' })
      .optional(),
    AUTH_COOKIE_SAME_SITE: z.preprocess(
      (value) =>
        value === undefined || value === ''
          ? 'lax'
          : String(value).trim().toLowerCase(),
      z.enum(['lax', 'strict', 'none'], {
        error: 'AUTH_COOKIE_SAME_SITE must be lax, strict or none',
      }),
    ),
    AUTH_COOKIE_MAX_AGE_SECONDS: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.coerce
        .number({
          error: 'AUTH_COOKIE_MAX_AGE_SECONDS must be a positive integer',
        })
        .int({
          error: 'AUTH_COOKIE_MAX_AGE_SECONDS must be a positive integer',
        })
        .min(1, {
          error: 'AUTH_COOKIE_MAX_AGE_SECONDS must be a positive integer',
        })
        .default(28_800),
    ),
    EXPERIMENTAL_LOGIN_ENABLED: z
      .stringbool({ error: 'EXPERIMENTAL_LOGIN_ENABLED must be true or false' })
      .default(false),
    SWAGGER_ENABLED: z
      .stringbool({ error: 'SWAGGER_ENABLED must be true or false' })
      .optional(),
  })
  .transform((config, ctx) => {
    const cookieSecure =
      config.AUTH_COOKIE_SECURE ?? config.NODE_ENV === 'production';
    const swaggerEnabled =
      config.SWAGGER_ENABLED ?? config.NODE_ENV === 'development';

    if (config.NODE_ENV === 'production' && !cookieSecure) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_COOKIE_SECURE'],
        message: 'AUTH_COOKIE_SECURE must be true in production',
      });
    }
    if (config.AUTH_COOKIE_SAME_SITE === 'none' && !cookieSecure) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_COOKIE_SAME_SITE'],
        message: 'AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true',
      });
    }
    if (config.NODE_ENV === 'production' && config.EXPERIMENTAL_LOGIN_ENABLED) {
      ctx.addIssue({
        code: 'custom',
        path: ['EXPERIMENTAL_LOGIN_ENABLED'],
        message: 'EXPERIMENTAL_LOGIN_ENABLED must be false in production',
      });
    }

    return {
      nodeEnv: config.NODE_ENV,
      port: config.API_PORT,
      databaseUrl: config.DATABASE_URL,
      webOrigin: config.WEB_ORIGIN,
      jwtSecret: config.JWT_SECRET,
      jwtExpiresIn: config.JWT_EXPIRES_IN,
      jwtIssuer: config.JWT_ISSUER,
      jwtAudience: config.JWT_AUDIENCE,
      cookieName: config.AUTH_COOKIE_NAME,
      cookieSecure,
      cookieSameSite: config.AUTH_COOKIE_SAME_SITE,
      cookieMaxAgeSeconds: config.AUTH_COOKIE_MAX_AGE_SECONDS,
      experimentalLoginEnabled: config.EXPERIMENTAL_LOGIN_ENABLED,
      swaggerEnabled,
    };
  });

export type AppConfig = z.output<typeof configSchema>;

export function validateConfig(raw: Record<string, unknown>): AppConfig {
  const result = configSchema.safeParse(raw);
  if (result.success) return result.data;

  throw new Error(result.error.issues.map((issue) => issue.message).join('; '));
}
