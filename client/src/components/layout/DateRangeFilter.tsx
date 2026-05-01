import { useState, useRef, useEffect } from 'react';
import { format, subMonths, startOfMonth, startOfYear } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useDateRange } from '../../store/useDateRange';
import 'react-day-picker/style.css';

const toStr = (d: Date) => format(d, 'yyyy-MM-dd');
const todayStr = () => toStr(new Date());
const ytdStart = () => toStr(startOfYear(new Date()));
const presetStart = (months: number) => toStr(startOfMonth(subMonths(new Date(), months - 1)));

const PRESETS = [
  { label: '1M',  getStart: () => presetStart(1) },
  { label: '3M',  getStart: () => presetStart(3) },
  { label: '6M',  getStart: () => presetStart(6) },
  { label: '1Y',  getStart: () => presetStart(12) },
  { label: 'YTD', getStart: () => ytdStart() },
];

function activeLabel(start: string, end: string): string {
  const t = todayStr();
  if (end !== t) return 'Custom';
  for (const p of PRESETS) if (start === p.getStart()) return p.label;
  return 'Custom';
}

interface Props { page: string; }

export function DateRangeFilter({ page }: Props) {
  const { start, end, setRange } = useDateRange(page);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange>({
    from: new Date(start),
    to: new Date(end),
  });
  const ref = useRef<HTMLDivElement>(null);

  const label = activeLabel(start, end);

  useEffect(() => {
    setDraft({ from: new Date(start), to: new Date(end) });
  }, [start, end, open]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  function applyPreset(getStart: () => string) {
    setRange(getStart(), todayStr());
    setOpen(false);
  }

  function applyDraft() {
    if (draft.from && draft.to) {
      setRange(toStr(draft.from), toStr(draft.to));
      setOpen(false);
    }
  }

  const displayLabel = label === 'Custom'
    ? `${start} – ${end}`
    : label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-200 hover:border-gray-500 transition-colors"
      >
        <CalendarDays size={13} className="text-gray-400" />
        <span>{displayLabel}</span>
        <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-xl shadow-black/40 p-4" style={{ minWidth: 300 }}>

          {/* Preset pills */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.getStart)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  label === p.label
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Range calendar */}
          <DayPicker
            mode="range"
            selected={draft}
            onSelect={r => r && setDraft(r)}
            defaultMonth={draft.from}
            classNames={{
              root: 'text-gray-200 text-sm',
              months: 'flex gap-4',
              month: 'w-full',
              month_caption: 'flex items-center justify-between mb-2 px-1',
              caption_label: 'text-sm font-medium text-white',
              nav: 'flex items-center gap-1',
              button_previous: 'p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors',
              button_next: 'p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors',
              month_grid: 'w-full',
              weekdays: 'flex',
              weekday: 'flex-1 text-center text-xs text-gray-500 pb-1',
              week: 'flex',
              day: 'flex-1 flex items-center justify-center',
              day_button: 'w-7 h-7 rounded-full text-xs hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center',
              selected: '[&>button]:bg-blue-600 [&>button]:text-white [&>button]:rounded-full',
              range_start: '[&>button]:bg-blue-600 [&>button]:text-white [&>button]:rounded-full',
              range_end: '[&>button]:bg-blue-600 [&>button]:text-white [&>button]:rounded-full',
              range_middle: 'bg-blue-500/20 [&>button]:text-blue-200 rounded-none',
              today: '[&>button]:ring-1 [&>button]:ring-gray-500',
              outside: '[&>button]:text-gray-600',
              disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed',
            }}
          />

          {/* Apply */}
          <button
            onClick={applyDraft}
            disabled={!draft.from || !draft.to}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
          >
            Apply {draft.from && draft.to ? `(${toStr(draft.from)} – ${toStr(draft.to)})` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
