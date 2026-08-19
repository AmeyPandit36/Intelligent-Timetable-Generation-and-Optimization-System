import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('API client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads dashboard data through a relative browser URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ readinessScore: 92 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const result = await api.dashboard();
    expect(fetchMock).toHaveBeenCalledWith('/api/dashboard', expect.any(Object));
    expect(result.readinessScore).toBe(92);
  });

  it('surfaces server validation messages', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Workload cap exceeded' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    await expect(api.generate({})).rejects.toThrow('Workload cap exceeded');
  });
});
