import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { currency } from '../../lib/formatters';

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#14b8a6','#ef4444','#06b6d4'];

interface Props { accounts: any[]; }

export function PortfolioPie({ accounts }: Props) {
  const data = accounts.map(a => ({ name: a.name, value: a.balance }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          formatter={(v: number) => [currency(v), '']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
