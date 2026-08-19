import { authSessionSchema } from '@codelife/contracts/auth';
import { apiFetch } from './client';
export async function getSession() { return authSessionSchema.parse(await apiFetch('/auth/me')); }
export async function startExperimentalSession() { return authSessionSchema.parse(await apiFetch('/auth/experimental-login', { method: 'POST' })); }
export async function logout() { await apiFetch('/auth/logout', { method: 'POST' }); }
