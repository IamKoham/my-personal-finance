import { create } from 'zustand';
import { api } from '../lib/api';

interface SettingsStore {
  settings: Record<string, string>;
  fetch: () => Promise<void>;
  update: (key: string, value: string) => Promise<void>;
}

export const useSettings = create<SettingsStore>((set) => ({
  settings: {},
  fetch: async () => {
    const settings = await api.getSettings();
    set({ settings });
  },
  update: async (key, value) => {
    await api.updateSetting(key, value);
    set(s => ({ settings: { ...s.settings, [key]: value } }));
  },
}));
