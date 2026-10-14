import type { components } from './api.generated';
export type Health = components['schemas']['Health'];

export function parseHealth(value: unknown): Health {
  if (!value || typeof value !== 'object') throw new Error('Resposta inválida');
  const candidate = value as Record<string, unknown>;
  if ((candidate.status !== 'up' && candidate.status !== 'down') || (candidate.database !== 'up' && candidate.database !== 'down') || candidate.mode !== 'local') throw new Error('Resposta inválida');
  return candidate as Health;
}

export async function loadHealth(signal?: AbortSignal): Promise<Health> {
  const response = await fetch('/api/health', { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Serviço indisponível');
  const health = parseHealth(await response.json());
  if (health.status !== 'up' || health.database !== 'up') throw new Error('Serviço indisponível');
  return health;
}
