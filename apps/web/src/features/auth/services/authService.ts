import { authSessionSchema } from '@codelife/contracts/auth';
import { apiFetch, apiFetchParsed, apiUrl } from '@/shared/http';

export function getSession() {
  return apiFetchParsed('/auth/me', authSessionSchema);
}

export function startGoogleLogin(): void {
  window.location.assign(`${apiUrl}/auth/google`);
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
}
