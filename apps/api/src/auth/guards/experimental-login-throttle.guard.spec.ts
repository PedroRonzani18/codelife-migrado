import { HttpException, type ExecutionContext } from '@nestjs/common';
import { ExperimentalLoginThrottleGuard } from './experimental-login-throttle.guard';

function contextFor(ip?: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ip, socket: { remoteAddress: '127.0.0.1' } }) }),
  } as unknown as ExecutionContext;
}

describe('ExperimentalLoginThrottleGuard', () => {
  it('limits repeated attempts per client and releases them after the window', () => {
    const guard = new ExperimentalLoginThrottleGuard();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    for (let attempt = 0; attempt < 5; attempt += 1) expect(guard.canActivate(contextFor('client'))).toBe(true);
    expect(() => guard.canActivate(contextFor('client'))).toThrow(HttpException);
    clock.mockReturnValue(62_000);
    expect(guard.canActivate(contextFor('client'))).toBe(true);
    clock.mockRestore();
  });

  it('falls back to the remote address', () => {
    expect(new ExperimentalLoginThrottleGuard().canActivate(contextFor())).toBe(true);
  });
});
