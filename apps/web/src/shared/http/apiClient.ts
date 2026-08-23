import { apiErrorSchema, type ApiErrorCode } from '@codelife/contracts/errors';
import type { ZodType } from 'zod';
import { ApiClientError } from './apiClientError';

export const apiUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

function requestUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${apiUrl}/${path.replace(/^\//, '')}`;
}

async function responsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('json') && response.status === 204) return undefined;
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function errorFromResponse(response: Response, payload: unknown): ApiClientError {
  const parsed = apiErrorSchema.safeParse(payload);
  if (parsed.success) {
    return new ApiClientError(
      response.status,
      parsed.data.code,
      parsed.data.message,
      parsed.data.details,
      parsed.data.requestId,
    );
  }

  const code: ApiErrorCode = response.status >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
  return new ApiClientError(
    response.status,
    code,
    response.status >= 500
      ? 'Não foi possível concluir a solicitação.'
      : 'A solicitação não pôde ser concluída.',
  );
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(requestUrl(path), {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch {
    throw new ApiClientError(0, 'HTTP_ERROR', 'Não foi possível conectar ao servidor.');
  }

  const payload = await responsePayload(response);
  if (!response.ok) throw errorFromResponse(response, payload);
  return payload;
}

export async function apiFetchParsed<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  return schema.parse(await apiFetch(path, init));
}
