import { create } from 'zustand';
import { api } from '../lib/api';

interface AccountsStore {
  accounts: any[];
  loading: boolean;
  fetch: () => Promise<void>;
}

export const useAccountsStore = create<AccountsStore>((set) => ({
  accounts: [],
  loading: false,
  fetch: async () => {
    set({ loading: true });
    const accounts = await api.getAccounts();
    set({ accounts, loading: false });
  },
}));
