import { create } from 'zustand';
import { format, subMonths, startOfMonth } from 'date-fns';

const defaultRange = () => {
  const today = new Date();
  return {
    start: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd'),
  };
};

interface DateRangeStore {
  ranges: Record<string, { start: string; end: string }>;
  setRange: (page: string, start: string, end: string) => void;
  setPreset: (page: string, months: number) => void;
}

const useDateRangeStore = create<DateRangeStore>((set) => ({
  ranges: {},
  setRange: (page, start, end) =>
    set(s => ({ ranges: { ...s.ranges, [page]: { start, end } } })),
  setPreset: (page, months) => {
    const now = new Date();
    set(s => ({
      ranges: {
        ...s.ranges,
        [page]: {
          start: format(startOfMonth(subMonths(now, months - 1)), 'yyyy-MM-dd'),
          end: format(now, 'yyyy-MM-dd'),
        },
      },
    }));
  },
}));

export function useDateRange(page: string) {
  const { ranges, setRange, setPreset } = useDateRangeStore();
  const range = ranges[page] ?? defaultRange();
  return {
    start: range.start,
    end: range.end,
    setRange: (start: string, end: string) => setRange(page, start, end),
    setPreset: (months: number) => setPreset(page, months),
  };
}
