import { apiErrorCodeSchema, apiValidationErrorDetailSchema } from 'contracts';
import type { ApiErrorCode } from 'contracts';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import type { RequestWithContext } from '../observability/request-context';

interface ErrorPayload {
  statusCode: number;
  code: ApiErrorCode;
  message: string;
  details?: Array<{ field?: string; message: string }>;
  requestId: string;
}

const statusCodeMap: Partial<Record<number, ApiErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.REQUEST_TIMEOUT]: 'REQUEST_TIMEOUT',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithContext>();
    const requestId = request.requestId;
    const payload = this.toPayload(exception, requestId);

    if (payload.code === 'INTERNAL_ERROR') {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`Unhandled request error requestId=${requestId}`, stack);
    }

    response.status(payload.statusCode).json(payload);
  }

  private toPayload(exception: unknown, requestId: string): ErrorPayload {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.prismaPayload(exception.code, requestId);
    }

    if (!(exception instanceof HttpException)) {
      return this.internalError(requestId);
    }

    const statusCode = exception.getStatus();
    if (statusCode === HttpStatus.SERVICE_UNAVAILABLE) {
      return this.payload(
        HttpStatus.SERVICE_UNAVAILABLE,
        'SERVICE_UNAVAILABLE',
        'Serviço temporariamente indisponível',
        requestId,
      );
    }
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return this.internalError(requestId);
    }

    const raw = exception.getResponse();
    const rawObject = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : undefined;
    const validationMessages = Array.isArray(rawObject?.message)
      ? rawObject.message.filter((message): message is string => typeof message === 'string' && message.length > 0)
      : undefined;
    const explicitCode = apiErrorCodeSchema.safeParse(rawObject?.code);
    const code = validationMessages?.length
      ? 'VALIDATION_ERROR'
      : explicitCode.success
        ? explicitCode.data
        : (statusCodeMap[statusCode] ?? 'HTTP_ERROR');
    const message = validationMessages?.length
      ? 'Payload inválido'
      : typeof raw === 'string'
        ? raw
        : typeof rawObject?.message === 'string' && rawObject.message.length > 0
          ? rawObject.message
          : exception.message;
    const details = validationMessages?.map((validationMessage) => ({ message: validationMessage }))
      ?? this.validationDetails(rawObject?.details);

    return {
      statusCode,
      code,
      message,
      ...(details?.length ? { details } : {}),
      requestId,
    };
  }

  private prismaPayload(code: string, requestId: string): ErrorPayload {
    switch (code) {
      case 'P2002':
        return this.payload(HttpStatus.CONFLICT, 'UNIQUE_CONFLICT', 'Recurso já existente', requestId);
      case 'P2003':
        return this.payload(
          HttpStatus.CONFLICT,
          'RELATION_CONFLICT',
          'Operação viola um relacionamento existente',
          requestId,
        );
      case 'P2025':
        return this.payload(HttpStatus.NOT_FOUND, 'RESOURCE_NOT_FOUND', 'Recurso não encontrado', requestId);
      default:
        return this.internalError(requestId);
    }
  }

  private internalError(requestId: string): ErrorPayload {
    return this.payload(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_ERROR',
      'Erro interno do servidor',
      requestId,
    );
  }

  private payload(statusCode: number, code: ApiErrorCode, message: string, requestId: string): ErrorPayload {
    return { statusCode, code, message, requestId };
  }

  private validationDetails(value: unknown): ErrorPayload['details'] {
    if (!Array.isArray(value)) return undefined;
    const details = value
      .map((detail) => apiValidationErrorDetailSchema.safeParse(detail))
      .filter((result) => result.success)
      .map((result) => result.data);
    return details.length > 0 ? details : undefined;
  }
}
