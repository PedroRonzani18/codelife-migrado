import type { NextFunction, Request, Response } from 'express';
import { requestIdMiddleware } from './request-id.middleware';
import type { RequestWithContext } from './request-context';

describe('requestIdMiddleware', () => {
  function run(incoming?: string) {
    const request = { header: () => incoming } as unknown as Request;
    const response = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;
    requestIdMiddleware(request, response, next);
    return { request: request as RequestWithContext, response, next };
  }

  it('preserves a safe correlation id', () => {
    const { request, response, next } = run('client-request-1');
    expect(request.requestId).toBe('client-request-1');
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'client-request-1');
    expect(next).toHaveBeenCalled();
  });

  it('generates an id for absent or unsafe values', () => {
    expect(run().request.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(run('contains spaces').request.requestId).not.toBe('contains spaces');
  });
});
