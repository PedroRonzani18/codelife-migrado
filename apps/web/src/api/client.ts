import { apiErrorSchema } from '@codelife/contracts/errors';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiClientError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiUrl}${path}`, { credentials: 'include', ...init });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const error = apiErrorSchema.safeParse(payload);
    throw new ApiClientError(response.status, error.success ? error.data.message : 'Não foi possível concluir a solicitação.');
  }
  return payload;
}
