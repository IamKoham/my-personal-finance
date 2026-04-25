import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useDateRange } from '../store/useDateRange';
import { currency, shortDate } from '../lib/formatters';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { SpendingBarChart } from '../components/charts/SpendingBarChart';
import { CATEGORY_COLORS } from '../lib/constants';

export function Spending() {
  const { start, end } = useDateRange();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getTransactions({ start, end, type: 'debit' }),
      api.getSummary({ start, end }),
    ]).then(([t, s]) => {
      setTransactions(t);
      setSummary(s);
    }).finally(() => setLoading(false));
  }, [start, end]);

  const byCategory: Record<string, number> = {};
  for (const m of summary) {
    for (const [cat, amt] of Object.entries(m.by_category ?? {})) {
      byCategory[cat] = (byCategory[cat] || 0) + (amt as number);
    }
  }

  const categories = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]);
  const filtered = filterCat ? transactions.filter(t => t.category === filterCat) : transactions;

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-4">Monthly Spending</h2>
          <SpendingBarChart data={summary} />
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-4">By Category</h2>
          <CategoryDonut data={byCategory} onSelect={setFilterCat} />
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Category Totals</h2>
        <div className="space-y-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${filterCat === cat ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: CATEGORY_COLORS[cat] || '#6b7280' }} />
                <span className="text-sm text-gray-200">{cat}</span>
              </div>
              <span className="text-sm font-medium text-white">{currency(byCategory[cat])}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400">
            Transactions {filterCat && <span className="text-blue-400">· {filterCat}</span>}
          </h2>
          {filterCat && (
            <button onClick={() => setFilterCat('')} className="text-xs text-gray-500 hover:text-white">Clear filter</button>
          )}
        </div>
        <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
          {filtered.slice(0, 100).map(t => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-200 truncate max-w-xs">{t.description}</p>
                <p className="text-xs text-gray-500">{shortDate(t.date)} · {t.account_name} · <span style={{ color: CATEGORY_COLORS[t.category] || '#6b7280' }}>{t.category || 'Other'}</span></p>
              </div>
              <span className="text-sm font-medium text-red-400">-{currency(t.amount)}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-500 text-sm">No transactions</p>
          )}
        </div>
      </div>
    </div>
  );
}
