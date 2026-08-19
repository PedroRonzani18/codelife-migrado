import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { CsrfOriginGuard } from './csrf-origin.guard';

function contextFor(request: object) {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('CsrfOriginGuard', () => {
  const config = {
    getOrThrow: (key: string) => key === 'cookieName' ? 'session' : 'http://localhost:5173',
  } as unknown as ConfigService;
  const guard = new CsrfOriginGuard(config);

  it('allows safe methods and unauthenticated login requests', () => {
    expect(guard.canActivate(contextFor({ method: 'GET' }))).toBe(true);
    expect(guard.canActivate(contextFor({ method: 'POST', cookies: {} }))).toBe(true);
  });

  it('requires the configured origin for authenticated mutations', () => {
    const headers = { origin: 'http://localhost:5173' };
    const valid = { method: 'POST', cookies: { session: 'jwt' }, header: (name: string) => headers[name.toLowerCase() as keyof typeof headers] };
    expect(guard.canActivate(contextFor(valid))).toBe(true);
    const missing = { method: 'PATCH', cookies: { session: 'jwt' }, header: () => undefined };
    expect(() => guard.canActivate(contextFor(missing))).toThrow(ForbiddenException);
  });
});
