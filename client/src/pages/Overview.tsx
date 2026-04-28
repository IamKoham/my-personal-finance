import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useDateRange } from "../store/useDateRange";
import { currency, pct } from "../lib/formatters";
import { SpendingBarChart } from "../components/charts/SpendingBarChart";
import { CategoryDonut } from "../components/charts/CategoryDonut";
import { TrendingUp, TrendingDown, DollarSign, Wallet, Landmark, AlertTriangle, ShieldAlert, Info } from "lucide-react";

export function Overview() {
  const { start, end } = useDateRange();
  const [summary, setSummary]           = useState<any[]>([]);
  const [accounts, setAccounts]         = useState<any[]>([]);
  const [recommendations, setRecs]      = useState<any[]>([]);
  const [investSummary, setInvest]      = useState<any>(null);
  const [efData, setEfData]             = useState<any>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSummary({ start, end }),
      api.getAccounts(),
      api.getRecommendations(),
      api.getInvestmentSummary().catch(() => null),
      api.getEmergencyFund().catch(() => null),
    ])
      .then(([s, a, r, inv, ef]) => {
        setSummary(s);
        setAccounts(a);
        setRecs(r);
        setInvest(inv);
        setEfData(ef);
      })
      .finally(() => setLoading(false));
  }, [start, end]);

  // ── Wealth snapshot (always current, not date-filtered) ──────────────────
  const liquidRaw  = accounts.filter(a => a.type === "checking" || a.type === "savings").reduce((s, a) => s + a.balance, 0);
  const goalAlloc  = efData?.allocated_to_goals ?? 0;
  const liquidNet  = Math.max(0, liquidRaw - goalAlloc);           // freely available cash
  const creditDebt = accounts.filter(a => a.type === "credit").reduce((s, a) => s + a.balance, 0);

  // Use investment summary API (Robinhood holdings + Fidelity 401k + ESPP + RSU vested)
  // Fall back to accounts table if API not yet populated
  const investTotal = investSummary?.total > 0
    ? investSummary.total
    : accounts.filter(a => a.type === "investment").reduce((s, a) => s + a.balance, 0);

  const netWorth = liquidRaw + investTotal - creditDebt;  // true net worth (goals still count as assets)

  // ── Period income/expenses (date-filtered) ───────────────────────────────
  const totalIncome   = summary.reduce((s, m) => s + m.income, 0);
  const totalExpenses = summary.reduce((s, m) => s + m.expenses, 0);
  const net           = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? (net / totalIncome) * 100 : 0;
  const srColor       = savingsRate >= 20 ? "emerald" : savingsRate >= 10 ? "yellow" : "red";

  // ── Category spend for donut ─────────────────────────────────────────────
  const byCategory: Record<string, number> = {};
  for (const m of summary) {
    for (const [cat, amt] of Object.entries(m.by_category ?? {})) {
      byCategory[cat] = (byCategory[cat] || 0) + (amt as number);
    }
  }

  const criticalRecs = recommendations.filter(r => r.severity === "critical");
  const warningRecs  = recommendations.filter(r => r.severity === "warning");

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">

      {/* Alerts */}
      {(criticalRecs.length > 0 || warningRecs.length > 0) && (
        <div className="space-y-2">
          {criticalRecs.map(r => (
            <Alert key={r.id} severity="critical" title={r.title} detail={r.detail} />
          ))}
          {warningRecs.slice(0, 2).map(r => (
            <Alert key={r.id} severity="warning" title={r.title} detail={r.detail} />
          ))}
        </div>
      )}

      {/* Row 1 — Wealth snapshot */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Wealth Snapshot</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Net Worth"
            value={netWorth}
            icon={<Wallet size={16}/>}
            color="blue"
            sub="Assets − debt"
          />
          <KpiCard
            label="Liquid Cash"
            value={liquidNet}
            icon={<Landmark size={16}/>}
            color="slate"
            sub={goalAlloc > 0 ? `${currency(liquidRaw)} − ${currency(goalAlloc)} goals` : "Checking + savings"}
          />
          <KpiCard
            label="Investments"
            value={investTotal}
            icon={<TrendingUp size={16}/>}
            color="emerald"
            sub={investSummary ? `RH · 401k · ESPP · RSU (vested)` : "From accounts"}
          />
          <KpiCard
            label="Credit Card Debt"
            value={creditDebt}
            icon={<TrendingDown size={16}/>}
            color={creditDebt > 0 ? "red" : "slate"}
            sub={creditDebt > 0 ? "Outstanding balance" : "No debt"}
            negate
          />
        </div>
      </div>

      {/* Row 2 — Period cash flow */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Cash Flow — Selected Period</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Income"    value={totalIncome}   icon={<TrendingUp size={16}/>}   color="green" sub="Credits in period" />
          <KpiCard label="Expenses"  value={totalExpenses} icon={<TrendingDown size={16}/>} color="red"   sub="Debits excl. investments" />
          <KpiCard label="Net Saved" value={net}           icon={<DollarSign size={16}/>}   color={net >= 0 ? "green" : "red"} sub="Income − expenses" />
          <SavingsRateCard rate={savingsRate} color={srColor} />
        </div>
      </div>

      {/* Investment breakdown strip */}
      {investSummary && investSummary.total > 0 && (
        <div className="bg-gray-900 rounded-xl px-5 py-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-3">Investment Breakdown</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat label="Robinhood" value={investSummary.robinhoodValue} color="blue" />
            <MiniStat label="Fidelity 401k" value={investSummary.fidelityValue} color="emerald" />
            <MiniStat label="Etrade ESPP" value={investSummary.esppValue} color="purple" />
            <MiniStat label="Etrade RSU (vested)" value={investSummary.rsuValue} color="yellow" />
          </div>
        </div>
      )}

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

// ── Sub-components ────────────────────────────────────────────────────────────

function Alert({ severity, title, detail }: { severity: "critical"|"warning"; title: string; detail: string }) {
  const isCrit = severity === "critical";
  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${isCrit ? "bg-red-500/5 border-red-500/30" : "bg-yellow-500/5 border-yellow-500/30"}`}>
      {isCrit
        ? <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
        : <ShieldAlert  size={15} className="text-yellow-400 flex-shrink-0 mt-0.5" />}
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-gray-400">{detail}</p>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color, sub, negate }: {
  label: string; value: number; icon: React.ReactNode;
  color: string; sub?: string; negate?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue:    "text-blue-400 bg-blue-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    green:   "text-green-400 bg-green-500/10",
    red:     "text-red-400 bg-red-500/10",
    yellow:  "text-yellow-400 bg-yellow-500/10",
    slate:   "text-slate-300 bg-slate-500/10",
    purple:  "text-purple-400 bg-purple-500/10",
  };
  const displayValue = negate ? -value : value;
  const valueColor = displayValue < 0 ? "text-red-400" : color === "green" ? "text-green-400" : color === "emerald" ? "text-emerald-400" : color === "red" && value > 0 ? "text-red-400" : "text-white";

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`p-1.5 rounded-lg ${colorMap[color] || colorMap.slate}`}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${valueColor}`}>{currency(Math.abs(value))}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function SavingsRateCard({ rate, color }: { rate: number; color: string }) {
  const label  = color === "emerald" ? "Great" : color === "yellow" ? "OK" : "Low";
  const badge  = color === "emerald" ? "bg-emerald-500/20 text-emerald-400" : color === "yellow" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400";
  const text   = color === "emerald" ? "text-emerald-400" : color === "yellow" ? "text-yellow-400" : "text-red-400";
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Savings Rate</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>{label}</span>
      </div>
      <p className={`text-xl font-bold ${text}`}>{pct(Math.max(0, rate))}</p>
      <p className="text-xs text-gray-600 mt-0.5">of income saved</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const textMap: Record<string, string> = { blue: "text-blue-400", emerald: "text-emerald-400", purple: "text-purple-400", yellow: "text-yellow-400" };
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold ${value > 0 ? (textMap[color] || "text-white") : "text-gray-500"}`}>
        {value > 0 ? currency(value) : "—"}
      </p>
    </div>
  );
}
