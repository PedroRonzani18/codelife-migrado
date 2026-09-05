import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { requestLoggerMiddleware } from './request-logger.middleware';

describe('requestLoggerMiddleware', () => {
  const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();

  beforeEach(() => {
    log.mockClear();
    warn.mockClear();
    error.mockClear();
  });

  function run(statusCode: number, event: 'finish' | 'close' = 'finish') {
    const callbacks: Partial<Record<'finish' | 'close', () => void>> = {};
    const request = { method: 'GET', path: '/health/live', requestId: 'req-1' } as unknown as Request;
    const response = {
      statusCode,
      once: (name: 'finish' | 'close', callback: () => void) => { callbacks[name] = callback; },
    } as unknown as Response;
    const next = jest.fn() as NextFunction;
    requestLoggerMiddleware(request, response, next);
    callbacks[event]?.();
    callbacks.close?.();
    return next;
  }

  it('logs completed, client-error and server-error requests once', () => {
    expect(run(200)).toHaveBeenCalled();
    expect(log).toHaveBeenCalledTimes(1);
    run(400);
    expect(warn).toHaveBeenCalledTimes(1);
    run(500, 'close');
    expect(error).toHaveBeenCalledTimes(1);
  });
});
