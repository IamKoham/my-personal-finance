import {
  mockAccounts, mockGoals, mockEmergencyFund, mockRecommendations,
  mockUploads, mockSettings, mockSummary, mockTransactions, mockInvestmentSummary,
} from './mockData';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

function mock<T>(data: T): Promise<T> {
  return new Promise(r => setTimeout(() => r(JSON.parse(JSON.stringify(data))), 120));
}

export const api = {
  getTransactions: (params?: Record<string, string | number>) => {
    if (DEMO) {
      let txs = [...mockTransactions];
      if (params?.limit) txs = txs.slice(0, Number(params.limit));
      return mock(txs);
    }
    const q = params ? "?" + new URLSearchParams(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))).toString() : "";
    return request<any[]>(`/transactions${q}`);
  },
  updateTransactionCategory: (id: number, category: string) => {
    if (DEMO) return mock({ ok: true });
    return request<any>(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify({ category }) });
  },
  getSummary: (params?: { start?: string; end?: string }) => {
    if (DEMO) return mock(mockSummary);
    const q = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<any[]>(`/summary${q}`);
  },
  getAccounts: () => {
    if (DEMO) return mock(mockAccounts);
    return request<any[]>("/accounts");
  },
  createAccount: (body: any) => {
    if (DEMO) return mock({ id: 99, ...body });
    return request<any>("/accounts", { method: "POST", body: JSON.stringify(body) });
  },
  updateAccount: (id: number, body: any) => {
    if (DEMO) return mock({ ok: true });
    return request<any>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteAccount: (id: number) => {
    if (DEMO) return mock({ ok: true });
    return request<any>(`/accounts/${id}`, { method: "DELETE" });
  },
  getGoals: () => {
    if (DEMO) return mock(mockGoals);
    return request<any[]>("/goals");
  },
  createGoal: (body: any) => {
    if (DEMO) return mock({ id: 99, ...body });
    return request<any>("/goals", { method: "POST", body: JSON.stringify(body) });
  },
  updateGoal: (id: number, body: any) => {
    if (DEMO) return mock({ ok: true });
    return request<any>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(body) });
  },
  deleteGoal: (id: number) => {
    if (DEMO) return mock({ ok: true });
    return request<any>(`/goals/${id}`, { method: "DELETE" });
  },
  getEmergencyFund: () => {
    if (DEMO) return mock(mockEmergencyFund);
    return request<any>("/emergency-fund");
  },
  getRecommendations: () => {
    if (DEMO) return mock(mockRecommendations);
    return request<any[]>("/recommendations");
  },
  getUploads: () => {
    if (DEMO) return mock(mockUploads);
    return request<any[]>("/uploads");
  },
  deleteUpload: (id: number) => {
    if (DEMO) return mock({ ok: true });
    return request<any>(`/uploads/${id}`, { method: "DELETE" });
  },
  uploadFile: (file: File, accountName: string, accountType: string) => {
    if (DEMO) return mock({ ok: true, inserted: 0, message: 'Demo mode — uploads disabled' });
    const form = new FormData();
    form.append("file", file);
    form.append("account_name", accountName);
    form.append("account_type", accountType);
    return fetch(`${BASE}/upload`, { method: "POST", body: form }).then(r => r.json());
  },
  getSettings: () => {
    if (DEMO) return mock(mockSettings);
    return request<Record<string, string>>("/settings");
  },
  updateSetting: (key: string, value: string) => {
    if (DEMO) return mock({ ok: true });
    return request<any>("/settings", { method: "PUT", body: JSON.stringify({ key, value }) });
  },
  // Investments
  getInvestmentSummary: () => {
    if (DEMO) return mock(mockInvestmentSummary);
    return request<any>("/investments/summary");
  },
  getRobinhoodHoldings: (account?: string) => {
    if (DEMO) return mock(mockInvestmentSummary.holdings);
    return request<any>(`/investments/robinhood${account ? "?account=" + account : ""}`);
  },
  getFidelity: () => {
    if (DEMO) return mock({ value: mockInvestmentSummary.fidelityValue });
    return request<any>("/investments/fidelity");
  },
  getEspp: () => {
    if (DEMO) return mock({ value: mockInvestmentSummary.esppValue, shares: [] });
    return request<any>("/investments/espp");
  },
  getRsu: () => {
    if (DEMO) return mock({ value: 0, grants: [] });
    return request<any>("/investments/rsu");
  },
  // Tax
  getTax: () => {
    if (DEMO) return mock({ estimated: 18200, brackets: [] });
    return request<any>("/tax");
  },
};
