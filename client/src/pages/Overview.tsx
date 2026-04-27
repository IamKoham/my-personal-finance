import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useDateRange } from "../store/useDateRange";
import { currency, pct } from "../lib/formatters";
import { SpendingBarChart } from "../components/charts/SpendingBarChart";
import { CategoryDonut } from "../components/charts/CategoryDonut";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Landmark, AlertTriangle } from "lucide-react";

export function Overview() {
  const { start, end } = useDateRange();
  const [summary, setSummary] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getSummary({ start, end }), api.getAccounts(), api.getRecommendations()])
      .then(([s, a, r]) => { setSummary(s); setAccounts(a); setRecommendations(r); })
      .finally(() => setLoading(false));
  }, [start, end]);

  const totalIncome   = summary.reduce((s, m) => s + m.income, 0);
  const totalExpenses = summary.reduce((s, m) => s + m.expenses, 0);
  const net           = totalIncome - totalExpenses;

  const liquidTypes = ["checking", "savings"];
  const liquid      = accounts.filter(a => liquidTypes.includes(a.type)).reduce((s, a) => s + a.balance, 0);
  const investments = accounts.filter(a => a.type === "investment").reduce((s, a) => s + a.balance, 0);
  const creditDebt  = accounts.filter(a => a.type === "credit").reduce((s, a) => s + a.balance, 0);
  const netWorth    = liquid + investments - creditDebt;

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const srColor = savingsRate >= 20 ? "emerald" : savingsRate >= 10 ? "yellow" : "red";

  const byCategory: Record<string, number> = {};
  for (const m of summary) {
    for (const [cat, amt] of Object.entries(m.by_category ?? {})) {
      byCategory[cat] = (byCategory[cat] || 0) + (amt as number);
    }
  }

  const criticalRecs = recommendations.filter(r => r.severity === "critical").slice(0, 3);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Critical alerts */}
      {criticalRecs.length > 0 && (
        <div className="space-y-2">
          {criticalRecs.map(r => (
            <div key={r.id} className="flex items-start gap-3 bg-red-500/5 border border-red-500/30 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">{r.title}</p>
                <p className="text-xs text-gray-400">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Net Worth"    value={netWorth}  icon={<Wallet size={18}/>}         color="blue" />
        <KpiCard label="Liquid Cash"  value={liquid}    icon={<Landmark size={18}/>}        color="slate" />
        <KpiCard label="Investments"  value={investments} icon={<TrendingUp size={18}/>}   color="emerald" />
        <KpiCard label="Credit Debt"  value={-creditDebt} icon={<TrendingDown size={18}/>} color={creditDebt > 0 ? "red" : "slate"} />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Income"       value={totalIncome}   icon={<TrendingUp size={18}/>}    color="green" />
        <KpiCard label="Expenses"     value={totalExpenses} icon={<TrendingDown size={18}/>}  color="red" />
        <KpiCard label="Net Saved"    value={net}           icon={<DollarSign size={18}/>}    color={net >= 0 ? "green" : "red"} />
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Savings Rate</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              srColor === "emerald" ? "bg-emerald-500/20 text-emerald-400" :
              srColor === "yellow"  ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            }`}>{srColor === "emerald" ? "Great" : srColor === "yellow" ? "OK" : "Low"}</span>
          </div>
          <p className={`text-xl font-bold ${srColor === "emerald" ? "text-emerald-400" : srColor === "yellow" ? "text-yellow-400" : "text-red-400"}`}>
            {pct(savingsRate)}
          </p>
        </div>
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
  const map: Record<string, string> = {
    blue:    "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    green:   "text-green-400 bg-green-500/10",
    red:     "text-red-400 bg-red-500/10",
    yellow:  "text-yellow-400 bg-yellow-500/10",
    slate:   "text-slate-300 bg-slate-500/10",
  };
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`p-1.5 rounded-lg ${map[color] || map.slate}`}>{icon}</span>
      </div>
      <div className={`text-xl font-bold ${value < 0 ? "text-red-400" : "text-white"}`}>
        {currency(value)}
      </div>
    </div>
  );
}
