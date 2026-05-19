import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { monthLabel } from '../../lib/formatters';

interface Props { data: any[]; }

export function SpendingBarChart({ data }: Props) {
  const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));
  const chartData = sorted.map(m => ({
    month: monthLabel(m.month),
    Income: parseFloat(m.income.toFixed(2)),
    Expenses: parseFloat(m.expenses.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55}
          tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#e5e7eb', fontSize: 12 }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, '']}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#9ca3af' }} />
        <Bar dataKey="Income"   fill="#22c55e" radius={[4,4,0,0]} animationBegin={0} animationDuration={700} animationEasing="ease-out" />
        <Bar dataKey="Expenses" fill="#ef4444" radius={[4,4,0,0]} animationBegin={100} animationDuration={700} animationEasing="ease-out" />
      </BarChart>
    </ResponsiveContainer>
  );
}
