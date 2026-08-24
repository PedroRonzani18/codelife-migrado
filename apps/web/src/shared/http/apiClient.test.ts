import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from './apiClientError';
import { apiFetch, apiUrl } from './apiClient';

describe('apiFetch', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends cookies and parses a successful JSON response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/health')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(`${apiUrl}/health`, expect.objectContaining({ credentials: 'include' }));
  });

  it('preserves the structured API error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      statusCode: 409,
      code: 'LEVEL_BLOCKED',
      message: 'Nível bloqueado',
      requestId: 'req-123',
    }), { status: 409, headers: { 'content-type': 'application/json' } })));

    const promise = apiFetch('/progress');
    await expect(promise).rejects.toMatchObject({
      status: 409,
      code: 'LEVEL_BLOCKED',
      message: 'Nível bloqueado',
      requestId: 'req-123',
    });
    await expect(promise).rejects.toBeInstanceOf(ApiClientError);
  });
});
