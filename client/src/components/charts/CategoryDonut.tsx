import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORY_COLORS } from '../../lib/constants';
import { currency } from '../../lib/formatters';

const EXCLUDED = new Set(['Investments', 'Income', 'CC Payment', 'Transfer']);

interface Props {
  data: Record<string, number>;
  onSelect?: (cat: string) => void;
}

export function CategoryDonut({ data, onSelect }: Props) {
  const entries = Object.entries(data)
    .filter(([cat, v]) => v > 0 && !EXCLUDED.has(cat))
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((s, [, v]) => s + v, 0);

  // Merge slices < 2% into "Other"
  const main: { name: string; value: number }[] = [];
  let otherSum = 0;
  for (const [name, value] of entries) {
    if (total > 0 && value / total < 0.02) {
      otherSum += value;
    } else {
      main.push({ name, value });
    }
  }
  if (otherSum > 0) main.push({ name: 'Other', value: otherSum });

  if (main.length === 0) {
    return <div className="flex items-center justify-center h-44 text-sm text-gray-500">No expense data</div>;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={main}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            onClick={(e) => onSelect?.(e.name)}
          >
            {main.map((entry) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            formatter={(v: number) => [currency(v), '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {main.map(e => (
          <div key={e.name} className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer hover:text-white" onClick={() => onSelect?.(e.name)}>
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[e.name] || '#6b7280' }} />
            {e.name}
          </div>
        ))}
      </div>
    </div>
  );
}
