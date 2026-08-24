import { authSessionSchema } from '@codelife/contracts/auth';
import { apiFetch, apiFetchParsed } from '@/shared/http';

export function getSession() {
  return apiFetchParsed('/auth/me', authSessionSchema);
}

export function startExperimentalSession() {
  return apiFetchParsed('/auth/experimental-login', authSessionSchema, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
}
