import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../lib/api";
import { useDateRange } from "../store/useDateRange";
import { currency, pct, shortDate } from "../lib/formatters";
import { SpendingBarChart } from "../components/charts/SpendingBarChart";
import { CategoryDonut } from "../components/charts/CategoryDonut";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, Landmark,
  AlertTriangle, ShieldAlert, ArrowUp, ArrowDown, Upload, ShoppingCart,
  Car, Home, Zap, CreditCard, Repeat, ShoppingBag, Plane, Heart, Coffee
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Rent:          <Home size={13} />,
  Transport:     <Car size={13} />,
  Subscriptions: <Repeat size={13} />,
  Utilities:     <Zap size={13} />,
  Restaurants:   <Coffee size={13} />,
  Groceries:     <ShoppingCart size={13} />,
  Shopping:      <ShoppingBag size={13} />,
  Travel:        <Plane size={13} />,
  Health:        <Heart size={13} />,
  'CC Payment':  <CreditCard size={13} />,
};

function shiftPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86400000);
  const priorEnd = new Date(s.getTime() - 86400000);
  const priorStart = new Date(priorEnd.getTime() - days * 86400000);
  return {
    priorEnd: priorEnd.toISOString().slice(0, 10),
    priorStart: priorStart.toISOString().slice(0, 10),
  };
}

export function Overview() {
  const navigate = useNavigate();
  const { start, end } = useDateRange("/");
  const [summary, setSummary]           = useState<any[]>([]);
  const [priorSummary, setPriorSummary] = useState<any[]>([]);
  const [allTimeSummary, setAllTime]    = useState<any[]>([]);
  const [accounts, setAccounts]         = useState<any[]>([]);
  const [recommendations, setRecs]      = useState<any[]>([]);
  const [investSummary, setInvest]      = useState<any>(null);
  const [efData, setEfData]             = useState<any>(null);
  const [recentTx, setRecentTx]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    setLoading(true);
    const { priorStart, priorEnd } = shiftPeriod(start, end);
    Promise.all([
      api.getSummary({ start, end }),
      api.getSummary({ start: priorStart, end: priorEnd }),
      api.getSummary(),
      api.getAccounts(),
      api.getRecommendations(),
      api.getInvestmentSummary().catch(() => null),
      api.getEmergencyFund().catch(() => null),
      api.getTransactions({ limit: 10 }),
    ])
      .then(([s, prior, allTime, a, r, inv, ef, tx]) => {
        setSummary(s);
        setPriorSummary(prior);
        setAllTime(allTime);
        setAccounts(a);
        setRecs(r);
        setInvest(inv);
        setEfData(ef);
        setRecentTx(tx);
      })
      .finally(() => setLoading(false));
  }, [start, end]);

  // ── Wealth snapshot ──────────────────────────────────────────────────────────
  const liquidRaw  = accounts.filter(a => a.type === "checking" || a.type === "savings").reduce((s, a) => s + a.balance, 0);
  const goalAlloc  = efData?.allocated_to_goals ?? 0;
  const liquidNet  = Math.max(0, liquidRaw - goalAlloc);
  const creditDebt = accounts.filter(a => a.type === "credit").reduce((s, a) => s + a.balance, 0);
  const investTotal = investSummary?.total > 0
    ? investSummary.total
    : accounts.filter(a => a.type === "investment").reduce((s, a) => s + a.balance, 0);
  const netWorth = liquidRaw + investTotal - creditDebt;

  // ── Net worth sparkline from all-time monthly nets ───────────────────────────
  const sparkData = (() => {
    const sorted = [...allTimeSummary].sort((a, b) => a.month.localeCompare(b.month));
    let running = netWorth - sorted.reduce((s, m) => s + m.net, 0);
    return sorted.map(m => { running += m.net; return { v: running }; });
  })();
  const sparkTrend = sparkData.length >= 2
    ? ((sparkData[sparkData.length - 1].v - sparkData[0].v) / Math.abs(sparkData[0].v || 1)) * 100
    : null;

  // ── Period cash flow ─────────────────────────────────────────────────────────
  const totalIncome   = summary.reduce((s, m) => s + m.income, 0);
  const totalExpenses = summary.reduce((s, m) => s + m.expenses, 0);
  const net           = totalIncome - totalExpenses;
  const savingsRate   = totalIncome > 0 ? (net / totalIncome) * 100 : 0;
  const srColor       = savingsRate >= 20 ? "emerald" : savingsRate >= 10 ? "yellow" : "red";

  // ── Trend vs prior period ────────────────────────────────────────────────────
  const priorIncome   = priorSummary.reduce((s, m) => s + m.income, 0);
  const priorExpenses = priorSummary.reduce((s, m) => s + m.expenses, 0);
  const incomeTrend   = priorIncome > 0   ? ((totalIncome - priorIncome) / priorIncome) * 100 : null;
  const expenseTrend  = priorExpenses > 0 ? ((totalExpenses - priorExpenses) / priorExpenses) * 100 : null;

  // ── All-time averages ────────────────────────────────────────────────────────
  const avgMonthlyIncome   = allTimeSummary.length > 0 ? allTimeSummary.reduce((s, m) => s + m.income, 0) / allTimeSummary.length : 0;
  const avgMonthlyExpenses = allTimeSummary.length > 0 ? allTimeSummary.reduce((s, m) => s + m.expenses, 0) / allTimeSummary.length : 0;

  // ── Category spend for donut ─────────────────────────────────────────────────
  const byCategory: Record<string, number> = {};
  for (const m of summary) {
    for (const [cat, amt] of Object.entries(m.by_category ?? {})) {
      byCategory[cat] = (byCategory[cat] || 0) + (amt as number);
    }
  }

  const criticalRecs = recommendations.filter(r => r.severity === "critical");
  const warningRecs  = recommendations.filter(r => r.severity === "warning");

  // ── Onboarding check ─────────────────────────────────────────────────────────
  const isEmpty = !loading && totalIncome === 0 && totalExpenses === 0 && netWorth === 0 && recentTx.length === 0;

  if (loading) return <OverviewSkeleton />;

  if (isEmpty) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-10 max-w-sm w-full">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Upload size={22} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No data yet</h2>
          <p className="text-sm text-gray-400 mb-6">Upload your bank or investment statements to get started.</p>
          <button
            onClick={() => navigate("/uploads")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            Go to Uploads
          </button>
        </div>
      </div>
    );
  }

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

      {/* Net Worth Hero */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Worth</p>
          <p className="text-3xl font-bold text-white">{currency(netWorth)}</p>
          <p className="text-xs text-gray-500 mt-1">Assets − debt</p>
          {sparkTrend != null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${sparkTrend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {sparkTrend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(sparkTrend).toFixed(1)}% over period
            </div>
          )}
        </div>
        {sparkData.length > 1 && (
          <div className="flex-1 h-16 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fill="url(#sparkGrad)" dot={false} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length
                      ? <div className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white">{currency(payload[0].value as number)}</div>
                      : null
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Row 1 — Wealth snapshot */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Wealth Snapshot</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard label="Liquid Cash"      value={liquidNet}   icon={<Landmark size={16}/>}     color="slate"                             sub={goalAlloc > 0 ? `${currency(liquidRaw)} − ${currency(goalAlloc)} goals` : "Checking + savings"} />
          <KpiCard label="Investments"      value={investTotal} icon={<TrendingUp size={16}/>}   color="emerald"                           sub={investSummary ? "RH · 401k · ESPP · RSU (vested)" : "From accounts"} />
          <KpiCard label="Credit Card Debt" value={creditDebt}  icon={<TrendingDown size={16}/>} color={creditDebt > 0 ? "red" : "slate"} sub={creditDebt > 0 ? "Outstanding balance" : "No debt"} negate />
        </div>
      </div>

      {/* Row 2 — Period cash flow */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Cash Flow — Selected Period</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Income"    value={totalIncome}   icon={<TrendingUp size={16}/>}   color="green"                       sub={`Avg ${currency(avgMonthlyIncome)}/mo`}   trend={incomeTrend}  trendInvert={false} />
          <KpiCard label="Expenses"  value={totalExpenses} icon={<TrendingDown size={16}/>} color="red"                         sub={`Avg ${currency(avgMonthlyExpenses)}/mo`} trend={expenseTrend} trendInvert={true} />
          <KpiCard label="Net Saved" value={net}           icon={<DollarSign size={16}/>}   color={net >= 0 ? "green" : "red"}  sub="Income − expenses" />
          <SavingsRateCard rate={savingsRate} color={srColor} />
        </div>
      </div>

      {/* Investment breakdown strip */}
      {investSummary && investSummary.total > 0 && (
        <div className="bg-gray-900 rounded-xl px-5 py-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-3">Investment Breakdown</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat label="Robinhood"           value={investSummary.robinhoodValue} total={investSummary.total} color="blue" />
            <MiniStat label="Fidelity 401k"       value={investSummary.fidelityValue}  total={investSummary.total} color="emerald" />
            <MiniStat label="Etrade ESPP"         value={investSummary.esppValue}       total={investSummary.total} color="purple" />
            <MiniStat label="Etrade RSU (vested)" value={investSummary.rsuValue}        total={investSummary.total} color="yellow" />
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

      {/* Recent Transactions */}
      {recentTx.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-400">Recent Transactions</h2>
            <button onClick={() => navigate("/spending")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</button>
          </div>
          <div className="divide-y divide-gray-800">
            {recentTx.slice(0, 10).map(tx => (
              <RecentTxRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      )}
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

function TrendBadge({ trend, invert }: { trend: number; invert: boolean }) {
  const isPositive = invert ? trend < 0 : trend > 0;
  const color = isPositive ? "text-emerald-400" : "text-red-400";
  const Icon  = trend > 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon size={11} />
      {Math.abs(trend).toFixed(1)}%
    </span>
  );
}

function KpiCard({ label, value, icon, color, sub, negate, trend, trendInvert }: {
  label: string; value: number; icon: React.ReactNode;
  color: string; sub?: string; negate?: boolean;
  trend?: number | null; trendInvert?: boolean;
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
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-600 hover:shadow-lg hover:shadow-black/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`p-1.5 rounded-lg ${colorMap[color] || colorMap.slate}`}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${valueColor}`}>{currency(Math.abs(value))}</p>
      <div className="flex items-center justify-between mt-0.5">
        {sub && <p className="text-xs text-gray-600">{sub}</p>}
        {trend != null && <TrendBadge trend={trend} invert={trendInvert ?? false} />}
      </div>
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

function MiniStat({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const textMap: Record<string, string> = { blue: "text-blue-400", emerald: "text-emerald-400", purple: "text-purple-400", yellow: "text-yellow-400" };
  const allocation = total > 0 && value > 0 ? ((value / total) * 100).toFixed(1) : null;
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-base font-semibold ${value > 0 ? (textMap[color] || "text-white") : "text-gray-500"}`}>
        {value > 0 ? currency(value) : "—"}
      </p>
      {allocation && <p className="text-xs text-gray-600 mt-0.5">{allocation}% of portfolio</p>}
    </div>
  );
}

function Skel({ className }: { className?: string }) {
  return <div className={`bg-gray-800 animate-pulse rounded ${className}`} />;
}

function OverviewSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Hero */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 px-6 py-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skel className="h-3 w-20" />
          <Skel className="h-8 w-40" />
          <Skel className="h-3 w-24" />
        </div>
        <Skel className="h-16 flex-1 rounded-lg" />
      </div>
      {/* Wealth snapshot */}
      <div>
        <Skel className="h-3 w-28 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-2">
              <Skel className="h-3 w-20" />
              <Skel className="h-7 w-28" />
              <Skel className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
      {/* Cash flow */}
      <div>
        <Skel className="h-3 w-40 mb-3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-2">
              <Skel className="h-3 w-16" />
              <Skel className="h-7 w-24" />
              <Skel className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <Skel className="h-3 w-32 mb-4" />
          <Skel className="h-44 w-full rounded-lg" />
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <Skel className="h-3 w-36 mb-4" />
          <Skel className="h-44 w-full rounded-full mx-auto" style={{ maxWidth: 180 }} />
        </div>
      </div>
    </div>
  );
}

function RecentTxRow({ tx }: { tx: any }) {
  const EXCLUDED = new Set(['Investments', 'Income', 'CC Payment', 'Transfer']);
  const isCredit = tx.type === 'credit';
  const icon = CATEGORY_ICONS[tx.category] ?? <DollarSign size={13} />;
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{tx.description}</p>
        <p className="text-xs text-gray-500">{shortDate(tx.date)} · {tx.account_name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-medium ${isCredit ? "text-emerald-400" : EXCLUDED.has(tx.category) ? "text-gray-400" : "text-white"}`}>
          {isCredit ? "+" : "−"}{currency(tx.amount)}
        </p>
        {tx.category && <p className="text-xs text-gray-600">{tx.category}</p>}
      </div>
    </div>
  );
}
