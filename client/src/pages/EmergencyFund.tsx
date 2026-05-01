import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSettings } from '../store/useSettings';
import { currency } from '../lib/formatters';
import { Shield, Info } from 'lucide-react';

export function EmergencyFund() {
  const [data, setData] = useState<any>(null);
  const { settings, fetch: fetchSettings, update } = useSettings();
  const [editMonths, setEditMonths] = useState('3');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    fetchSettings();
    api.getEmergencyFund().then(setData);
  }, []);

  useEffect(() => {
    if (settings['emergency_fund_months']) setEditMonths(settings['emergency_fund_months']);
  }, [settings]);

  const handleSave = async () => {
    setSaveState('saving');
    await update('emergency_fund_months', editMonths);
    const fresh = await api.getEmergencyFund();
    setData(fresh);
    setSaveState('saved');
    setToast(true);
    setTimeout(() => { setSaveState('idle'); setToast(false); }, 2500);
  };

  const colorMap = { red: '#ef4444', yellow: '#eab308', green: '#22c55e' };
  const statusLabel = {
    green: 'Fully funded ✅',
    yellow: 'Partially funded ⚠️',
    red: 'Critically low 🚨',
  };

  if (!data) return <div className="p-6 text-gray-400">Loading...</div>;

  const noExpenseData = data.data_source === 'manual' && data.avg_monthly_expenses === 0;

  return (
    <div className="p-6 space-y-6">
      {toast && (
        <div
          className="fixed top-4 left-1/2 z-50 bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
          style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
        >
          Target months updated ✓
          <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateX(-50%) translateY(-6px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }`}</style>
        </div>
      )}

      {/* Status card */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield size={24} style={{ color: colorMap[data.status as 'red'|'yellow'|'green'] }} />
            <div>
              <h2 className="text-lg font-semibold text-white">Emergency Fund</h2>
              <p className="text-sm text-gray-400">{statusLabel[data.status as 'red'|'yellow'|'green']}</p>
            </div>
          </div>
          {/* Target months inline CTA */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 whitespace-nowrap">Target months</label>
            <input
              type="number"
              value={editMonths}
              min={1}
              max={24}
              onChange={e => setEditMonths(e.target.value)}
              className="w-14 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                saveState === 'saved'
                  ? 'bg-emerald-800 text-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              } disabled:opacity-60`}
            >
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-800 rounded-full h-3 mb-1">
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${Math.min(100, data.percent)}%`,
              background: colorMap[data.status as 'red'|'yellow'|'green'],
            }}
          />
        </div>

        {/* Target months inline CTA */}
        <div className="flex items-center gap-2 mt-1 mb-5">
          <p className="text-xs text-gray-500">{data.percent.toFixed(0)}% of</p>
          <input
            type="number"
            value={editMonths}
            min={1}
            max={24}
            onChange={e => setEditMonths(e.target.value)}
            className="w-12 bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="text-xs text-gray-500">-month target</p>
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={`ml-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              saveState === 'saved'
                ? 'bg-emerald-800 text-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } disabled:opacity-60`}
          >
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : 'Save'}
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="Liquid Cash (after goals saved)"
            value={currency(data.current)}
            sub={data.allocated_to_goals > 0 ? `${currency(data.liquid_cash)} − ${currency(data.allocated_to_goals)} saved for goals` : undefined}
          />
          <Stat
            label={`EF Target (${data.target_months} mo × avg expenses)`}
            value={currency(data.target)}
          />
          <Stat
            label="Months Covered"
            value={`${data.months_covered.toFixed(1)} mo`}
            color={data.status}
          />
          <Stat
            label="Available to Invest"
            value={currency(data.available_to_invest)}
            color={data.available_to_invest > 0 ? 'green' : undefined}
            sub={
              data.remaining_for_goals > 0
                ? `After EF + ${currency(data.remaining_for_goals)} still needed for goals`
                : data.after_ef_surplus > 0 ? 'All goals funded ✓' : undefined
            }
          />
        </div>

        {/* Monthly expenses source note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-gray-800 rounded-lg px-3 py-2">
          <Info size={12} className="flex-shrink-0 mt-0.5" />
          {noExpenseData ? (
            <span>No transaction data yet. Upload bank statements to auto-calculate monthly expenses. Or set a target manually below.</span>
          ) : (
            <span>
              Monthly expenses (3-month avg): <span className="text-white font-medium">{currency(data.avg_monthly_expenses)}</span>
              {data.data_source === 'transactions' ? ' — auto-calculated from your transactions' : ' — using manual estimate'}
            </span>
          )}
        </div>
      </div>

      {/* What this means */}
      {data.months_covered > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            color={data.status === 'green' ? 'emerald' : data.status === 'yellow' ? 'yellow' : 'red'}
            title={data.months_covered >= data.target_months ? 'Emergency fund complete' : `${(data.target_months - data.months_covered).toFixed(1)} months short`}
            detail={
              data.months_covered >= data.target_months
                ? `You have ${data.months_covered.toFixed(1)} months of expenses covered. Surplus of ${currency(data.available_to_invest)} is available to invest.`
                : `You need ${currency(data.target - data.current)} more to hit your ${data.target_months}-month target.`
            }
          />
          <InsightCard
            color="blue"
            title="Avg monthly expenses"
            detail={`${currency(data.avg_monthly_expenses)}/month based on last 3 months of transactions (excluding investments).`}
          />
          <InsightCard
            color={data.available_to_invest > 0 ? 'emerald' : 'gray'}
            title="Available to invest"
            detail={
              data.available_to_invest > 0
                ? `${currency(data.available_to_invest)} free after EF target + goal needs — consider putting this to work in your investment accounts.`
                : data.after_ef_surplus > 0
                  ? `${currency(data.after_ef_surplus)} above EF target, but ${currency(data.remaining_for_goals)} is still needed for your goals.`
                  : `Build your emergency fund to ${data.target_months} months before investing surplus cash.`
            }
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  const textColor = color === 'green' ? 'text-emerald-400' : color === 'yellow' ? 'text-yellow-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1 leading-tight">{label}</p>
      <p className={`text-lg font-bold ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function InsightCard({ title, detail, color }: { title: string; detail: string; color: string }) {
  const border = color === 'emerald' ? 'border-emerald-500/30' : color === 'yellow' ? 'border-yellow-500/30' : color === 'red' ? 'border-red-500/30' : color === 'blue' ? 'border-blue-500/30' : 'border-gray-700';
  const bg = color === 'emerald' ? 'bg-emerald-500/5' : color === 'yellow' ? 'bg-yellow-500/5' : color === 'red' ? 'bg-red-500/5' : color === 'blue' ? 'bg-blue-500/5' : 'bg-gray-800';
  return (
    <div className={`rounded-xl p-4 border ${border} ${bg}`}>
      <p className="text-sm font-medium text-white mb-1">{title}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{detail}</p>
    </div>
  );
}
