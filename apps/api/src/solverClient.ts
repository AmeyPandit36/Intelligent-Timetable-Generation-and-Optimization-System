const solverUrl = process.env.SOLVER_URL ?? 'http://127.0.0.1:8000';

export class SolverServiceError extends Error {
  constructor(message: string, public readonly status: number, public readonly detail?: unknown) {
    super(message);
  }
}

export async function dispatchSchedule(snapshot: unknown, signal?: AbortSignal) {
  const response = await fetch(`${solverUrl}/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
    signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SolverServiceError('Optimization service rejected the scheduling snapshot.', response.status, payload);
  }
  return payload;
}

export async function getSolverHealth(signal?: AbortSignal) {
  const response = await fetch(`${solverUrl}/health`, { signal });
  if (!response.ok) throw new SolverServiceError('Optimization service is unhealthy.', response.status);
  return response.json();
}
