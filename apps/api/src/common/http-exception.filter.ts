import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = typeof raw === 'object' && raw && 'message' in raw ? String((raw as { message: unknown }).message) : exception instanceof Error ? exception.message : 'Erro interno';
    response.status(status).json({
      statusCode: status,
      code: HttpStatus[status] ?? 'ERROR',
      message,
      requestId: request.header('x-request-id'),
    });
  }
}
