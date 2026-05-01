import { useDateRange } from '../../store/useDateRange';

const PRESETS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
];

interface Props {
  page: string;
}

export function DateRangeFilter({ page }: Props) {
  const { start, end, setRange, setPreset } = useDateRange(page);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="hidden sm:flex gap-1">
        {PRESETS.map(p => (
          <button
            key={p.months}
            onClick={() => setPreset(p.months)}
            className="px-2 py-1 rounded text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 text-gray-400">
        <input
          type="date"
          value={start}
          onChange={e => setRange(e.target.value, end)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
        />
        <span>–</span>
        <input
          type="date"
          value={end}
          onChange={e => setRange(start, e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
