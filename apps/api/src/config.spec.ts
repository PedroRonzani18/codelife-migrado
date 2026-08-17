import { validateConfig } from './config';

describe('validateConfig', () => {
  const required = { DATABASE_URL: 'postgresql://localhost/codelife', JWT_SECRET: 'local-secret' };
  it('rejects insecure cross-site cookies', () => {
    expect(() => validateConfig({ ...required, AUTH_COOKIE_SAME_SITE: 'none', AUTH_COOKIE_SECURE: 'false' })).toThrow('requires');
  });
  it('disables experimental login by default', () => {
    expect(validateConfig(required).experimentalLoginEnabled).toBe(false);
  });
});
