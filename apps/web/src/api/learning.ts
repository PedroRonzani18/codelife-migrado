import { islandDetailSchema } from '@codelife/contracts';
import { apiFetch } from './client';
export async function getExperimentalIsland() { return islandDetailSchema.parse(await apiFetch('/learning/islands/island-3')); }
