import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORY_COLORS } from '../../lib/constants';
import { currency } from '../../lib/formatters';

interface Props {
  data: Record<string, number>;
  onSelect?: (cat: string) => void;
}

export function CategoryDonut({ data, onSelect }: Props) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const chartData = entries.map(([name, value]) => ({ name, value }));

  return (
    <div className="flex flex-col items-center gap-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            onClick={(e) => onSelect?.(e.name)}
          >
            {chartData.map((entry) => (
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
        {chartData.slice(0, 8).map(e => (
          <div key={e.name} className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer hover:text-white" onClick={() => onSelect?.(e.name)}>
            <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[e.name] || '#6b7280' }} />
            {e.name}
          </div>
        ))}
      </div>
    </div>
  );
}
