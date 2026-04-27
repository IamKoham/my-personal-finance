import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { currency, pct } from "../lib/formatters";
import { PortfolioPie } from "../components/charts/PortfolioPie";
import { TrendingUp, AlertTriangle, Plus, Pencil } from "lucide-react";

export function Investments() {
  const [summary, setSummary] = useState<any>(null);
  const [robinhood, setRobinhood] = useState<any>(null);
  const [fidelity, setFidelity] = useState<any>(null);
  const [espp, setEspp] = useState<any>(null);
  const [rsu, setRsu] = useState<any>(null);
  const [manualAccounts, setManualAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [sum, rbh, fid, esp, rs, accts] = await Promise.all([
        api.getInvestmentSummary(),
        api.getRobinhoodHoldings().catch(() => null),
        api.getFidelity().catch(() => null),
        api.getEspp().catch(() => null),
        api.getRsu().catch(() => null),
        api.getAccounts(),
      ]);
      setSummary(sum);
      setRobinhood(rbh);
      setFidelity(fid);
      setEspp(esp);
      setRsu(rs);
      setManualAccounts(accts.filter((a: any) => a.type === "investment"));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const total = summary?.total || 0;

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Total */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-white">{currency(total)}</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
          <Plus size={14} /> Add Manual Account
        </button>
      </div>

      {/* Breakdown KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Robinhood" value={summary.robinhoodValue} />
          <KpiCard label="Fidelity 401k" value={summary.fidelityValue} color="blue" />
          <KpiCard label="Etrade ESPP" value={summary.esppValue} color="purple" />
          <KpiCard label="Etrade RSU" value={summary.rsuValue} color="emerald" />
        </div>
      )}

      {/* Robinhood Holdings */}
      {robinhood && robinhood.holdings && robinhood.holdings.length > 0 && (
        <Section title="Robinhood — Taxable Brokerage">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PortfolioPie accounts={robinhood.holdings.map((h: any) => ({ name: h.symbol, balance: h.market_value }))} />
            </div>
            <div className="space-y-2">
              {robinhood.holdings.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{h.symbol}</p>
                    <p className="text-xs text-gray-500">{h.name} · {h.qty} shares @ {currency(h.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{currency(h.market_value)}</p>
                    <p className={`text-xs ${h.pct_of_portfolio > 30 ? "text-yellow-400" : "text-gray-500"}`}>{pct(h.pct_of_portfolio)}</p>
                  </div>
                </div>
              ))}
              {robinhood.holdings.some((h: any) => h.pct_of_portfolio > 30) && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  <p className="text-xs text-yellow-300">Concentration risk: one holding exceeds 30% of portfolio</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Fidelity 401k */}
      {fidelity && (
        <Section title="Fidelity — 401k (Intuit)">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Stat label="Balance" value={currency(fidelity.ending_balance)} />
            <Stat label="Vested" value={currency(fidelity.vested_balance)} color="emerald" />
            <Stat label="Your Contributions" value={currency(fidelity.employee_contributions)} />
            <Stat label="Employer Match" value={currency(fidelity.employer_contributions)} color="emerald" />
          </div>
          {fidelity.rate_of_return !== undefined && (
            <p className={`text-sm ${fidelity.rate_of_return >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              <TrendingUp size={14} className="inline mr-1" />
              Period return: {fidelity.rate_of_return >= 0 ? "+" : ""}{fidelity.rate_of_return}%
            </p>
          )}
          {fidelity.funds && fidelity.funds.length > 0 && (
            <div className="mt-3 space-y-2">
              {fidelity.funds.map((f: any, i: number) => (
                <div key={i} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-white mb-2">{f.name}</p>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span className="text-blue-400">Stocks {f.allocation.stocks}%</span>
                    <span className="text-emerald-400">Bonds {f.allocation.bonds}%</span>
                    <span className="text-gray-400">Short-term {f.allocation.shortTerm}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Etrade RSU */}
      {rsu && rsu.grants && rsu.grants.length > 0 && (
        <Section title="Etrade — RSU Grants">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Stat label="Total Vested Value" value={currency(rsu.totalVestedValue)} />
            <Stat label="Total Unvested Shares" value={String(rsu.totalUnvested)} color="yellow" />
            <Stat label="Grants" value={String(rsu.grants.length)} />
          </div>
          <div className="space-y-2">
            {rsu.grants.map((g: any, i: number) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 grid grid-cols-4 gap-3 text-xs">
                <div><span className="text-gray-500 block">Symbol</span><span className="text-white font-medium">{g.symbol}</span></div>
                <div><span className="text-gray-500 block">Vested / Unvested</span><span className="text-white">{g.vested_qty} / <span className="text-yellow-400">{g.unvested_qty}</span></span></div>
                <div><span className="text-gray-500 block">Market Value</span><span className="text-white">{currency(g.market_value)}</span></div>
                <div><span className="text-gray-500 block">Next Vest</span><span className="text-white">{g.vest_date || "—"}</span></div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Etrade ESPP */}
      {espp && espp.lots && espp.lots.length > 0 && (
        <Section title="Etrade — ESPP Lots">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="Total Market Value" value={currency(espp.totalValue)} />
            <Stat label="Total Gain/Loss" value={currency(espp.totalGain)} color={espp.totalGain >= 0 ? "emerald" : "red"} />
          </div>
          <div className="space-y-2">
            {espp.lots.map((lot: any, i: number) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 grid grid-cols-4 gap-3 text-xs">
                <div><span className="text-gray-500 block">Symbol / Date</span><span className="text-white font-medium">{lot.symbol}</span><span className="text-gray-400 block">{lot.purchase_date}</span></div>
                <div><span className="text-gray-500 block">Discount</span><span className="text-white">{pct(lot.discount_pct)}</span></div>
                <div><span className="text-gray-500 block">Gain/Loss</span><span className={lot.expected_gain_loss >= 0 ? "text-emerald-400" : "text-red-400"}>{currency(lot.expected_gain_loss)}</span></div>
                <div><span className="text-gray-500 block">Tax Status</span><span className={lot.tax_status?.includes("Qualifying") ? "text-emerald-400" : "text-yellow-400"}>{lot.tax_status || "—"}</span></div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Manual accounts form */}
      {showForm && (
        <InvestmentForm
          initial={editing}
          onSave={async (data: any) => {
            if (editing) await api.updateAccount(editing.id, data);
            else await api.createAccount({ ...data, type: "investment" });
            setShowForm(false);
            load();
          }}
          onClose={() => setShowForm(false)}
        />
      )}

      {total === 0 && (
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
          <p className="text-gray-400 text-sm">No investment data yet. Upload Robinhood, Fidelity, or Etrade statements.</p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-sm font-semibold text-gray-300 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color?: string }) {
  const c = color === "emerald" ? "text-emerald-400" : color === "blue" ? "text-blue-400" : color === "purple" ? "text-purple-400" : "text-white";
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${c}`}>{currency(value)}</p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const c = color === "emerald" ? "text-emerald-400" : color === "yellow" ? "text-yellow-400" : color === "red" ? "text-red-400" : "text-white";
  return <div><p className="text-xs text-gray-500 mb-1">{label}</p><p className={`text-lg font-bold ${c}`}>{value}</p></div>;
}

function InvestmentForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({ name: initial?.name || "", balance: initial?.balance || 0, institution: initial?.institution || "" });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">{initial ? "Edit" : "Add"} Investment Account</h2>
        <div className="space-y-3">
          <input placeholder="Account name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <input type="number" placeholder="Current balance" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) }))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <input placeholder="Institution" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => onSave(form)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
