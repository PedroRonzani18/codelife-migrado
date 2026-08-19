import { apiErrorSchema } from 'contracts';
import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { HttpExceptionFilter } from './http-exception.filter';
import type { RequestWithContext } from '../observability/request-context';

interface FilterFixture {
  filter: HttpExceptionFilter;
  host: ArgumentsHost;
  json: jest.Mock;
  status: jest.Mock;
}

function fixture(requestId = 'request-123'): FilterFixture {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status } as unknown as Response;
  const request = {
    requestId,
  } as RequestWithContext;
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ArgumentsHost;

  return { filter: new HttpExceptionFilter(), host, json, status };
}

describe('HttpExceptionFilter', () => {
  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves ValidationPipe messages as structured details', () => {
    const test = fixture();
    test.filter.catch(
      new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: ['levelId must be a string', 'property extra should not exist'],
      }),
      test.host,
    );

    expect(test.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(test.json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Payload inválido',
      details: [
        { message: 'levelId must be a string' },
        { message: 'property extra should not exist' },
      ],
      requestId: 'request-123',
    });
    expect(apiErrorSchema.safeParse(test.json.mock.calls[0][0]).success).toBe(true);
  });

  it('uses stable codes while preserving an intentional HTTP message', () => {
    const test = fixture();
    test.filter.catch(new UnauthorizedException('Sessão ausente'), test.host);

    expect(test.json).toHaveBeenCalledWith({
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Sessão ausente',
      requestId: 'request-123',
    });
  });

  it('returns a safe public message for an intentional service outage', () => {
    const test = fixture();
    test.filter.catch(new ServiceUnavailableException('database host must stay private'), test.host);

    expect(test.json).toHaveBeenCalledWith({
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Serviço temporariamente indisponível',
      requestId: 'request-123',
    });
    expect(loggerError).not.toHaveBeenCalled();
  });

  it.each([
    ['P2002', HttpStatus.CONFLICT, 'UNIQUE_CONFLICT', 'Recurso já existente'],
    ['P2003', HttpStatus.CONFLICT, 'RELATION_CONFLICT', 'Operação viola um relacionamento existente'],
    ['P2025', HttpStatus.NOT_FOUND, 'RESOURCE_NOT_FOUND', 'Recurso não encontrado'],
  ])('maps Prisma %s without exposing database metadata', (prismaCode, statusCode, code, message) => {
    const test = fixture();
    const exception = new Prisma.PrismaClientKnownRequestError('database detail that must stay private', {
      code: prismaCode,
      clientVersion: '7.9.1',
      meta: { target: ['private_column'] },
    });

    test.filter.catch(exception, test.host);

    expect(test.status).toHaveBeenCalledWith(statusCode);
    expect(test.json).toHaveBeenCalledWith({ statusCode, code, message, requestId: 'request-123' });
    expect(JSON.stringify(test.json.mock.calls[0][0])).not.toContain('private_column');
  });

  it.each([
    new Error('connection string and stack must stay private'),
    new InternalServerErrorException('controller detail must stay private'),
    new Prisma.PrismaClientKnownRequestError('unknown Prisma detail must stay private', {
      code: 'P2999',
      clientVersion: '7.9.1',
    }),
  ])('returns a safe envelope for internal errors', (exception) => {
    const test = fixture();
    test.filter.catch(exception, test.host);

    const payload = test.json.mock.calls[0][0];
    expect(payload).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      requestId: 'request-123',
    });
    expect(apiErrorSchema.safeParse(payload).success).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('private');
    expect(loggerError).toHaveBeenCalled();
  });
});
