import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { currency, pct } from "../lib/formatters";
import { AlertTriangle, CheckCircle, TrendingUp, Clock, DollarSign } from "lucide-react";

export function Tax() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTax().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!data) return <div className="p-6 text-gray-400">No tax data yet. Upload your Etrade and Fidelity statements.</div>;

  const { espp, rsu, retirement, upcomingVests, actions, holdings } = data;

  return (
    <div className="p-6 space-y-6">

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Actions Before Year End</h2>
          {actions.map((a: any, i: number) => (
            <div key={i} className={`rounded-xl p-4 border flex gap-3 ${
              a.priority === "high" ? "border-red-500/30 bg-red-500/5" :
              a.priority === "medium" ? "border-yellow-500/30 bg-yellow-500/5" :
              "border-blue-500/30 bg-blue-500/5"
            }`}>
              <AlertTriangle size={18} className={a.priority === "high" ? "text-red-400 flex-shrink-0 mt-0.5" : "text-yellow-400 flex-shrink-0 mt-0.5"} />
              <div>
                <p className="text-sm font-medium text-white">{a.title}</p>
                <p className="text-xs text-gray-400 mt-1">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 401k Status */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <h2 className="text-sm font-medium text-gray-400 mb-4">401k Contribution Status</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat label="Your Contributions" value={currency(retirement.ytdEmployeeContrib)} />
          <Stat label="Employer Match" value={currency(retirement.ytdEmployerContrib)} color="green" />
          <Stat label="Annualized Rate" value={currency(retirement.annualizedContrib)} />
          <Stat label={`Room Left (${currency(retirement.limit)} limit)`} value={currency(retirement.remainingRoom)} color={retirement.isMaxing401k ? "green" : "yellow"} />
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress to {currency(retirement.limit)} limit</span>
            <span>{pct(Math.min(100, (retirement.annualizedContrib / retirement.limit) * 100))}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (retirement.annualizedContrib / retirement.limit) * 100)}%` }} />
          </div>
        </div>
        {retirement.ytdEmployerContrib > 0 && (
          <p className="mt-3 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle size={12} /> Employer match captured: {currency(retirement.ytdEmployerContrib)} this period
          </p>
        )}
      </div>

      {/* RSU Summary */}
      {rsu && rsu.grants && rsu.grants.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-4">RSU Tax Summary</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Stat label="Total Taxable Gain" value={currency(rsu.totalTaxableGain)} />
            <Stat label="Taxes Withheld" value={currency(rsu.totalTaxesPaid)} />
            <Stat label="Avg Withholding Rate" value={pct(rsu.avgEffectiveTaxRate)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-left py-2">Grant Date</th>
                  <th className="text-right py-2">Vested</th>
                  <th className="text-right py-2">Unvested</th>
                  <th className="text-right py-2">Taxable Gain</th>
                  <th className="text-right py-2">Tax Rate</th>
                  <th className="text-right py-2">Vest Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rsu.grants.map((g: any, i: number) => (
                  <tr key={i} className="text-gray-300">
                    <td className="py-2 font-medium">{g.symbol}</td>
                    <td className="py-2">{g.grant_date}</td>
                    <td className="py-2 text-right">{g.vested_qty}</td>
                    <td className="py-2 text-right text-yellow-400">{g.unvested_qty}</td>
                    <td className="py-2 text-right">{currency(g.taxable_gain)}</td>
                    <td className="py-2 text-right">{pct(g.effective_tax_rate)}</td>
                    <td className="py-2 text-right">{g.vest_date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ESPP Tax Optimizer */}
      {espp && espp.lots && espp.lots.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-1">ESPP Tax Optimizer</h2>
          <p className="text-xs text-gray-500 mb-4">Qualifying disposition = held 2yr from grant + 1yr from purchase. Better tax treatment.</p>
          <div className="space-y-3">
            {espp.lots.map((lot: any, i: number) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{lot.symbol}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lot.isQualifying ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {lot.isQualifying ? "Qualifying" : "Disqualifying"}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${lot.totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {lot.totalGainLoss >= 0 ? "+" : ""}{currency(lot.totalGainLoss)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-400">
                  <div><span className="block text-gray-500">Purchase</span>{lot.purchase_date}</div>
                  <div><span className="block text-gray-500">Discount</span>{pct(lot.discount_pct)}</div>
                  <div><span className="block text-gray-500">Sellable</span>{lot.sellable_qty} shares</div>
                  <div><span className="block text-gray-500">Market Value</span>{currency(lot.market_value)}</div>
                </div>
                {!lot.isQualifying && lot.daysToQualifying !== null && lot.daysToQualifying > 0 && (
                  <p className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                    <Clock size={11} /> Hold {lot.daysToQualifying} more days for qualifying disposition
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Vests */}
      {upcomingVests && upcomingVests.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Upcoming Vests (Next 90 Days)</h2>
          <div className="space-y-2">
            {upcomingVests.map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-white font-medium">{g.symbol}</span>
                  <span className="text-xs text-gray-500 ml-2">Grant {g.grant_date}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">{currency(g.market_value)}</p>
                  <p className="text-xs text-gray-500">{g.vest_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Robinhood Holdings */}
      {holdings && holdings.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h2 className="text-sm font-medium text-gray-400 mb-1">Robinhood Holdings</h2>
          <p className="text-xs text-gray-500 mb-4">Cost basis not in PDF — gains shown are unrealized market value only. Use Robinhood tax forms (1099-B) for realized gain/loss.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-right py-2">Shares</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Market Value</th>
                  <th className="text-right py-2">% of Portfolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {(() => {
                  const total = holdings.reduce((s: number, h: any) => s + h.marketValue, 0);
                  return holdings.map((h: any, i: number) => {
                    const pctOfPort = total > 0 ? (h.marketValue / total) * 100 : 0;
                    return (
                      <tr key={i} className="text-gray-300">
                        <td className="py-2 font-medium">{h.symbol}</td>
                        <td className="py-2 text-right">{h.qty.toFixed(4)}</td>
                        <td className="py-2 text-right">{currency(h.price)}</td>
                        <td className="py-2 text-right">{currency(h.marketValue)}</td>
                        <td className={`py-2 text-right font-medium ${pctOfPort > 40 ? "text-red-400" : pctOfPort > 25 ? "text-yellow-400" : "text-gray-300"}`}>
                          {pctOfPort.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500 flex items-center gap-1">
            <TrendingUp size={11} /> To get realized gain/loss, download your 1099-B from Robinhood and check tax forms section.
          </p>
        </div>
      )}

      {!data.rsu?.grants?.length && !data.espp?.lots?.length && (
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
          <DollarSign size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Upload your Etrade XLSX and Fidelity PDF to see tax optimization tips.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const c = color === "green" ? "text-emerald-400" : color === "yellow" ? "text-yellow-400" : "text-white";
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${c}`}>{value}</p>
    </div>
  );
}
