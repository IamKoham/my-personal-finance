const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  // Transactions
  getTransactions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/transactions${q}`);
  },

  // Summary
  getSummary: (params?: { start?: string; end?: string }) => {
    const q = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<any[]>(`/summary${q}`);
  },

  // Accounts
  getAccounts: () => request<any[]>('/accounts'),
  createAccount: (body: any) => request<any>('/accounts', { method: 'POST', body: JSON.stringify(body) }),
  updateAccount: (id: number, body: any) => request<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAccount: (id: number) => request<any>(`/accounts/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => request<any[]>('/goals'),
  createGoal: (body: any) => request<any>('/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: (id: number, body: any) => request<any>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGoal: (id: number) => request<any>(`/goals/${id}`, { method: 'DELETE' }),

  // Emergency Fund
  getEmergencyFund: () => request<any>('/emergency-fund'),

  // Recommendations
  getRecommendations: () => request<any[]>('/recommendations'),

  // Uploads
  getUploads: () => request<any[]>('/uploads'),
  deleteUpload: (id: number) => request<any>(`/uploads/${id}`, { method: 'DELETE' }),
  uploadFile: (file: File, accountName: string, accountType: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('account_name', accountName);
    form.append('account_type', accountType);
    return fetch(`${BASE}/upload`, { method: 'POST', body: form }).then(r => r.json());
  },

  // Settings
  getSettings: () => request<Record<string, string>>('/settings'),
  updateSetting: (key: string, value: string) => request<any>('/settings', { method: 'PUT', body: JSON.stringify({ key, value }) }),
};
