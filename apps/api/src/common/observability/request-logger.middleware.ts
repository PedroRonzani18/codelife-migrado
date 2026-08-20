import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { RequestWithContext } from './request-context';

const logger = new Logger('HTTP');

export function requestLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();
  let logged = false;

  const logRequest = (outcome: 'completed' | 'aborted') => {
    if (logged) return;
    logged = true;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = response.statusCode;
    const payload = {
      durationMs: Number(durationMs.toFixed(1)),
      method: request.method,
      outcome,
      path: request.path,
      requestId: (request as RequestWithContext).requestId,
      statusCode,
    };
    const message = JSON.stringify(payload);
    if (statusCode >= 500) logger.error(message);
    else if (statusCode >= 400) logger.warn(message);
    else logger.log(message);
  };

  response.once('finish', () => logRequest('completed'));
  response.once('close', () => logRequest('aborted'));
  next();
}
