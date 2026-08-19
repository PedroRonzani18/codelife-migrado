import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { RequestWithContext } from './request-context';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function requestIdMiddleware(request: Request, response: Response, next: NextFunction) {
  const incoming = request.header('x-request-id');
  const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  (request as RequestWithContext).requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}
