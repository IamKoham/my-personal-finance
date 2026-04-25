import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useDateRange } from '../store/useDateRange';
import { currency } from '../lib/formatters';
import { SpendingBarChart } from '../components/charts/SpendingBarChart';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export function Overview() {
  const { start, end } = useDateRange();
  const [summary, setSummary] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSummary({ start, end }),
      api.getAccounts(),
    ]).then(([s, a]) => {
      setSummary(s);
      setAccounts(a);
    }).finally(() => setLoading(false));
  }, [start, end]);

  const totalIncome   = summary.reduce((s, m) => s + m.income, 0);
  const totalExpenses = summary.reduce((s, m) => s + m.expenses, 0);
  const net           = totalIncome - totalExpenses;
  const netWorth      = accounts.reduce((s, a) => a.type === 'credit' ? s - a.balance : s + a.balance, 0);

  // Aggregate by_category across all months
  const byCategory: Record<string, number> = {};
  for (const m of summary) {
    for (const [cat, amt] of Object.entries(m.by_category ?? {})) {
      byCategory[cat] = (byCategory[cat] || 0) + (amt as number);
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Net Worth"  value={netWorth}  icon={<Wallet size={18}/>}      color="blue" />
        <KpiCard label="Income"     value={totalIncome}  icon={<TrendingUp size={18}/>}  color="green" />
        <KpiCard label="Expenses"   value={totalExpenses} icon={<TrendingDown size={18}/>} color="red" />
        <KpiCard label="Net Saved"  value={net}       icon={<DollarSign size={18}/>}   color={net >= 0 ? 'green' : 'red'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Monthly Cash Flow</h2>
          <SpendingBarChart data={summary} />
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Spending by Category</h2>
          <CategoryDonut data={byCategory} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
  };
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`p-1.5 rounded-lg ${colorMap[color]}`}>{icon}</span>
      </div>
      <div className={`text-xl font-bold ${value < 0 ? 'text-red-400' : 'text-white'}`}>
        {currency(value)}
      </div>
    </div>
  );
}
