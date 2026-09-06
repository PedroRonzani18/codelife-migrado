import { validateConfig } from './config';

describe('validateConfig', () => {
  const required = {
    DATABASE_URL: 'postgresql://localhost:5432/codelife',
    JWT_SECRET: 'x'.repeat(32),
  };

  it('applies safe development defaults', () => {
    expect(validateConfig(required)).toEqual({
      nodeEnv: 'development',
      port: 3001,
      databaseUrl: required.DATABASE_URL,
      webOrigin: 'http://localhost:5173',
      jwtSecret: required.JWT_SECRET,
      jwtExpiresIn: '8h',
      jwtIssuer: 'codelife-api',
      jwtAudience: 'codelife-web',
      cookieName: 'codelife_session',
      cookieSecure: false,
      cookieSameSite: 'lax',
      cookieMaxAgeSeconds: 28_800,
      experimentalLoginEnabled: false,
      swaggerEnabled: true,
      googleClientId: undefined,
      googleClientSecret: undefined,
      googleRedirectUri: undefined,
    });
  });

  it('is pure and only validates the object it receives', () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://localhost/should-not-be-used';
    try {
      expect(() => validateConfig({ JWT_SECRET: required.JWT_SECRET })).toThrow('DATABASE_URL is required');
    } finally {
      if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });

  it.each([
    ['mysql://localhost/codelife', 'DATABASE_URL'],
    ['postgresql://localhost', 'DATABASE_URL'],
    ['not-a-url', 'DATABASE_URL'],
  ])('rejects invalid PostgreSQL URL %s', (databaseUrl, message) => {
    expect(() => validateConfig({ ...required, DATABASE_URL: databaseUrl })).toThrow(message);
  });

  it.each([
    ['ftp://example.com', 'WEB_ORIGIN'],
    ['https://example.com/app', 'WEB_ORIGIN'],
    ['https://*.example.com', 'WEB_ORIGIN'],
    ['https://user:pass@example.com', 'WEB_ORIGIN'],
  ])('rejects invalid web origin %s', (webOrigin, message) => {
    expect(() => validateConfig({ ...required, WEB_ORIGIN: webOrigin })).toThrow(message);
  });

  it.each(['0', '65536', '1.5', 'not-a-port'])('rejects invalid API port %s', (port) => {
    expect(() => validateConfig({ ...required, API_PORT: port })).toThrow('API_PORT');
  });

  it('rejects a short JWT secret', () => {
    expect(() => validateConfig({ ...required, JWT_SECRET: 'short-secret' })).toThrow('at least 32');
  });

  it.each(['0s', '-1h', 'later'])('rejects invalid JWT duration %s', (jwtExpiresIn) => {
    expect(() => validateConfig({ ...required, JWT_EXPIRES_IN: jwtExpiresIn })).toThrow('JWT_EXPIRES_IN');
  });

  it('rejects insecure cross-site cookies', () => {
    expect(() =>
      validateConfig({ ...required, AUTH_COOKIE_SAME_SITE: 'none', AUTH_COOKIE_SECURE: 'false' }),
    ).toThrow('requires');
  });

  it('requires secure cookies in production', () => {
    expect(() =>
      validateConfig({ ...required, NODE_ENV: 'production', AUTH_COOKIE_SECURE: 'false' }),
    ).toThrow('must be true in production');
  });

  it('rejects experimental login in production during validation', () => {
    expect(() =>
      validateConfig({ ...required, NODE_ENV: 'production', EXPERIMENTAL_LOGIN_ENABLED: 'true' }),
    ).toThrow('must be false in production');
  });

  it('disables Swagger by default outside development', () => {
    expect(validateConfig({ ...required, NODE_ENV: 'test' }).swaggerEnabled).toBe(false);
    expect(validateConfig({ ...required, NODE_ENV: 'production' }).swaggerEnabled).toBe(false);
  });

  it('accepts explicit issuer, audience and Swagger configuration', () => {
    const config = validateConfig({
      ...required,
      JWT_ISSUER: 'example-api',
      JWT_AUDIENCE: 'example-web',
      SWAGGER_ENABLED: 'false',
    });
    expect(config).toMatchObject({
      jwtIssuer: 'example-api',
      jwtAudience: 'example-web',
      swaggerEnabled: false,
    });
  });

  it('accepts optional Google OIDC configuration', () => {
    expect(validateConfig({
      ...required,
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3001/auth/google/callback',
    })).toMatchObject({
      googleClientId: 'google-client-id',
      googleClientSecret: 'google-client-secret',
      googleRedirectUri: 'http://localhost:3001/auth/google/callback',
    });
  });

  it.each([
    ['ftp://localhost/callback', 'GOOGLE_REDIRECT_URI'],
    ['not-a-url', 'GOOGLE_REDIRECT_URI'],
  ])('rejects invalid Google redirect URI %s', (redirectUri, message) => {
    expect(() => validateConfig({ ...required, GOOGLE_REDIRECT_URI: redirectUri })).toThrow(message);
  });

  it('requires the Google client ID and redirect URI when partially configured', () => {
    expect(() => validateConfig({ ...required, GOOGLE_CLIENT_SECRET: 'secret' })).toThrow('GOOGLE_CLIENT_ID');
    expect(() => validateConfig({ ...required, GOOGLE_CLIENT_ID: 'client-id' })).toThrow('GOOGLE_REDIRECT_URI');
  });
});
