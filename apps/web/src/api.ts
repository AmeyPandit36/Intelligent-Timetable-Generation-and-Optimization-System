async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || 'Request failed');
  return payload as T;
}

export const api = {
  dashboard: () => request<any>('/api/dashboard'),
  departments: () => request<any[]>('/api/departments'),
  faculty: () => request<any[]>('/api/faculty'),
  resources: () => request<any[]>('/api/resources'),
  policies: () => request<any[]>('/api/policies'),
  diagnostics: () => request<any[]>('/api/diagnostics'),
  schedule: () => request<any>('/api/schedules/current'),
  generate: (options: Record<string, unknown>) => request<any>('/api/schedule/generate', { method: 'POST', body: JSON.stringify(options) }),
  validateMove: (move: Record<string, unknown>) => request<any>('/api/schedule/validate-move', { method: 'POST', body: JSON.stringify(move) }),
  togglePolicy: (id: string) => request<any>(`/api/policies/${id}/toggle`, { method: 'PATCH' }),
  interpretPolicy: (message: string) => request<any>('/api/agent/interpret', { method: 'POST', body: JSON.stringify({ message }) }),
  createPolicy: (policy: Record<string, unknown>) => request<any>('/api/policies', { method: 'POST', body: JSON.stringify(policy) }),
};
