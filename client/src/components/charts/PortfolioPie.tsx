import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { currency } from '../../lib/formatters';

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#14b8a6','#ef4444','#06b6d4'];

interface Props { accounts: { name: string; balance: number }[]; }

export function PortfolioPie({ accounts }: Props) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  if (total === 0) return null;

  // Merge slices < 2% of total into "Other" to avoid broken micro-slivers
  const threshold = total * 0.02;
  const main: { name: string; value: number }[] = [];
  let otherValue = 0;

  for (const a of accounts) {
    if (a.balance >= threshold) {
      main.push({ name: a.name, value: a.balance });
    } else {
      otherValue += a.balance;
    }
  }
  if (otherValue > 0) main.push({ name: 'Other', value: otherValue });

  // Sort largest first
  main.sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={main}
          cx="50%"
          cy="50%"
          outerRadius={85}
          dataKey="value"
          paddingAngle={0}
        >
          {main.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          formatter={(v: number) => [`${currency(v)} (${((v / total) * 100).toFixed(1)}%)`, '']}
        />
        <Legend
          formatter={(value, entry: any) => (
            <span style={{ color: '#9ca3af', fontSize: 12 }}>
              {value} — {((entry.payload.value / total) * 100).toFixed(1)}%
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
