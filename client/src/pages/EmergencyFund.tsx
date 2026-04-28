import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSettings } from '../store/useSettings';
import { currency } from '../lib/formatters';
import { Shield, Info } from 'lucide-react';

export function EmergencyFund() {
  const [data, setData] = useState<any>(null);
  const { settings, fetch: fetchSettings, update } = useSettings();
  const [editMonths, setEditMonths] = useState('3');

  useEffect(() => {
    fetchSettings();
    api.getEmergencyFund().then(setData);
  }, []);

  useEffect(() => {
    if (settings['emergency_fund_months']) setEditMonths(settings['emergency_fund_months']);
  }, [settings]);

  const handleSave = async () => {
    await update('emergency_fund_months', editMonths);
    const fresh = await api.getEmergencyFund();
    setData(fresh);
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

      {/* Status card */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} style={{ color: colorMap[data.status as 'red'|'yellow'|'green'] }} />
          <div>
            <h2 className="text-lg font-semibold text-white">Emergency Fund</h2>
            <p className="text-sm text-gray-400">{statusLabel[data.status as 'red'|'yellow'|'green']}</p>
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
        <p className="text-xs text-gray-500 mb-5">
          {data.percent.toFixed(0)}% of {data.target_months}-month target
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label="Saved (Savings Accounts)"
            value={currency(data.current)}
          />
          <Stat
            label={`Target (${data.target_months} mo × avg expenses)`}
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
                ? `${currency(data.available_to_invest)} above your target — consider putting this to work in your investment accounts.`
                : `Build your emergency fund to ${data.target_months} months before investing surplus cash.`
            }
          />
        </div>
      )}

      {/* Settings */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 mb-4">Settings</h2>
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="text-xs text-gray-400">Target months of expenses</label>
            <p className="text-xs text-gray-600 mb-1">Recommended: 3–6 months</p>
            <input
              type="number"
              value={editMonths}
              min={1}
              max={24}
              onChange={e => setEditMonths(e.target.value)}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Save & Recalculate
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const textColor = color === 'green' ? 'text-emerald-400' : color === 'yellow' ? 'text-yellow-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-400 mb-1 leading-tight">{label}</p>
      <p className={`text-lg font-bold ${textColor}`}>{value}</p>
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
