import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useDateRange } from '../store/useDateRange';
import { currency, shortDate } from '../lib/formatters';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { SpendingBarChart } from '../components/charts/SpendingBarChart';
import { CATEGORY_COLORS } from '../lib/constants';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

type Tab = 'expenses' | 'credits';

export function Spending() {
  const { start, end } = useDateRange();
  const [debits, setDebits]   = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [filterCat, setFilterCat] = useState('');
  const [tab, setTab] = useState<Tab>('expenses');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getTransactions({ start, end, type: 'debit' }),
      api.getTransactions({ start, end, type: 'credit' }),
      api.getSummary({ start, end }),
    ]).then(([d, c, s]) => {
      setDebits(d);
      setCredits(c);
      setSummary(s);
    }).finally(() => setLoading(false));
  }, [start, end]);

  // Expense category totals (from summary, already excludes Investments)
  const byCategory: Record<string, number> = {};
  for (const m of summary) {
    for (const [cat, amt] of Object.entries(m.by_category ?? {})) {
      byCategory[cat] = (byCategory[cat] || 0) + (amt as number);
    }
  }
  const categories = Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]);
  const filteredDebits = filterCat ? debits.filter(t => t.category === filterCat) : debits;

  // Split credits into income (counted) vs other (not counted)
  const incomeCredits = credits.filter(c => c.category === 'Income');
  const otherCredits  = credits.filter(c => c.category !== 'Income');
  const totalIncome   = incomeCredits.reduce((s, c) => s + c.amount, 0);
  const totalOther    = otherCredits.reduce((s, c) => s + c.amount, 0);

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;

  return (
    <div className="p-6 space-y-6">

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        <TabBtn active={tab === 'expenses'} onClick={() => { setTab('expenses'); setFilterCat(''); }}>
          <TrendingDown size={14} /> Expenses
        </TabBtn>
        <TabBtn active={tab === 'credits'} onClick={() => { setTab('credits'); setFilterCat(''); }}>
          <TrendingUp size={14} /> Credits & Income
          {otherCredits.length > 0 && (
            <span className="ml-1.5 bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">
              {otherCredits.length} unreviewed
            </span>
          )}
        </TabBtn>
      </div>

      {/* ── EXPENSES TAB ── */}
      {tab === 'expenses' && (
        <>
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

          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h2 className="text-sm font-medium text-gray-400 mb-3">Category Totals</h2>
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${filterCat === cat ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] || '#6b7280' }} />
                    <span className="text-sm text-gray-200">{cat}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{currency(byCategory[cat])}</span>
                </button>
              ))}
            </div>
          </div>

          <TransactionList
            transactions={filteredDebits}
            filterCat={filterCat}
            onClearFilter={() => setFilterCat('')}
            type="debit"
          />
        </>
      )}

      {/* ── CREDITS TAB ── */}
      {tab === 'credits' && (
        <div className="space-y-6">

          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Counted as Income</p>
              <p className="text-lg font-bold text-emerald-400">{currency(totalIncome)}</p>
              <p className="text-xs text-gray-600 mt-0.5">{incomeCredits.length} transactions</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Not Counted as Income</p>
              <p className="text-lg font-bold text-yellow-400">{currency(totalOther)}</p>
              <p className="text-xs text-gray-600 mt-0.5">{otherCredits.length} transactions · refunds, transfers, CC payments</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">All Credits Total</p>
              <p className="text-lg font-bold text-white">{currency(totalIncome + totalOther)}</p>
              <p className="text-xs text-gray-600 mt-0.5">{credits.length} total credit transactions</p>
            </div>
          </div>

          {/* Counted as income */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-white">✅ Counted as Income</h2>
                <p className="text-xs text-gray-500 mt-0.5">Category = "Income" — used in savings rate & cash flow calculations</p>
              </div>
              <span className="text-sm font-bold text-emerald-400">{currency(totalIncome)}</span>
            </div>
            <div className="divide-y divide-gray-800 max-h-72 overflow-y-auto">
              {incomeCredits.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">No income transactions found.</p>
                  <p className="text-xs text-gray-600 mt-1">Check that direct deposits are categorized as "Income".</p>
                </div>
              )}
              {incomeCredits.map(t => (
                <CreditRow key={t.id} t={t} counted />
              ))}
            </div>
          </div>

          {/* Not counted as income */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-start gap-3">
              <div className="flex-1">
                <h2 className="text-sm font-medium text-white">⚠️ Not Counted as Income</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Credits with other categories — refunds, CC payments, transfers. If any of these are real income, let me know and I'll update the categorizer.
                </p>
              </div>
              <span className="text-sm font-bold text-yellow-400 flex-shrink-0">{currency(totalOther)}</span>
            </div>
            <div className="divide-y divide-gray-800 max-h-72 overflow-y-auto">
              {otherCredits.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-gray-500">All credits are counted as income.</p>
              )}
              {otherCredits.map(t => (
                <CreditRow key={t.id} t={t} counted={false} />
              ))}
            </div>
          </div>

          {/* Explainer */}
          <div className="flex gap-2 bg-gray-900 rounded-xl border border-gray-800 p-4 text-xs text-gray-400">
            <Info size={14} className="flex-shrink-0 mt-0.5 text-blue-400" />
            <p>
              Income = credits categorized as <span className="text-white">"Income"</span> (direct deposits, payroll, Zelle/Venmo received).
              Credit card payments and inter-account transfers are excluded to avoid double-counting.
              If a real income source is missing, check the "Not Counted" list above — the description will tell you what it is.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function CreditRow({ t, counted }: { t: any; counted: boolean }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-200 truncate">{t.description}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {shortDate(t.date)} · {t.account_name}
          {t.category && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs" style={{
              background: (CATEGORY_COLORS[t.category] || '#6b7280') + '22',
              color: CATEGORY_COLORS[t.category] || '#9ca3af',
            }}>
              {t.category}
            </span>
          )}
        </p>
      </div>
      <span className={`text-sm font-medium ml-4 flex-shrink-0 ${counted ? 'text-emerald-400' : 'text-yellow-400'}`}>
        +{currency(t.amount)}
      </span>
    </div>
  );
}

function TransactionList({ transactions, filterCat, onClearFilter, type }: {
  transactions: any[]; filterCat: string; onClearFilter: () => void; type: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400">
          Transactions {filterCat && <span className="text-blue-400">· {filterCat}</span>}
          <span className="ml-2 text-gray-600">({transactions.length})</span>
        </h2>
        {filterCat && (
          <button onClick={onClearFilter} className="text-xs text-gray-500 hover:text-white">Clear filter</button>
        )}
      </div>
      <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
        {transactions.slice(0, 200).map(t => (
          <div key={t.id} className="px-4 py-3 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-200 truncate">{t.description}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {shortDate(t.date)} · {t.account_name} ·{' '}
                <span style={{ color: CATEGORY_COLORS[t.category] || '#6b7280' }}>{t.category || 'Other'}</span>
              </p>
            </div>
            <span className="text-sm font-medium text-red-400 ml-4 flex-shrink-0">-{currency(t.amount)}</span>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="px-4 py-8 text-center text-gray-500 text-sm">No transactions</p>
        )}
      </div>
    </div>
  );
}
