import { create } from 'zustand';
import { format, subMonths, startOfMonth } from 'date-fns';

interface DateRangeStore {
  start: string;
  end: string;
  setRange: (start: string, end: string) => void;
  setPreset: (months: number) => void;
}

const today = new Date();

export const useDateRange = create<DateRangeStore>((set) => ({
  start: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'),
  end: format(today, 'yyyy-MM-dd'),
  setRange: (start, end) => set({ start, end }),
  setPreset: (months) => set({
    start: format(startOfMonth(subMonths(today, months - 1)), 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd'),
  }),
}));
