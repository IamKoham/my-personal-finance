import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSettings } from '../store/useSettings';
import { currency, pct } from '../lib/formatters';
import { Shield } from 'lucide-react';

export function EmergencyFund() {
  const [data, setData] = useState<any>(null);
  const { settings, fetch: fetchSettings, update } = useSettings();
  const [editMonths, setEditMonths] = useState('');
  const [editIncome, setEditIncome] = useState('');

  useEffect(() => {
    fetchSettings();
    api.getEmergencyFund().then(setData);
  }, []);

  useEffect(() => {
    if (settings['emergency_fund_months']) setEditMonths(settings['emergency_fund_months']);
    if (settings['monthly_income_estimate']) setEditIncome(settings['monthly_income_estimate']);
  }, [settings]);

  const handleSave = async () => {
    await update('emergency_fund_months', editMonths);
    await update('monthly_income_estimate', editIncome);
    const fresh = await api.getEmergencyFund();
    setData(fresh);
  };

  const colorMap = { red: '#ef4444', yellow: '#eab308', green: '#22c55e' };

  return (
    <div className="p-6 space-y-6">
      {data && (
        <>
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={24} style={{ color: colorMap[data.status as 'red'|'yellow'|'green'] }} />
              <div>
                <h2 className="text-lg font-semibold text-white">Emergency Fund</h2>
                <p className="text-sm text-gray-400">
                  {data.status === 'green' ? 'Fully funded ✅' : data.status === 'yellow' ? 'Partially funded ⚠️' : 'Critically low 🚨'}
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-3 mb-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, data.percent)}%`, background: colorMap[data.status as 'red'|'yellow'|'green'] }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Stat label="Saved" value={currency(data.current)} />
              <Stat label="Target" value={currency(data.target)} />
              <Stat label="Covered" value={`${data.months_covered.toFixed(1)} mo`} />
              <Stat label="Available to Invest" value={currency(data.available_to_invest)} />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">Settings</h2>
            <div className="space-y-3 max-w-sm">
              <div>
                <label className="text-xs text-gray-400">Target months of expenses</label>
                <input type="number" value={editMonths} onChange={e=>setEditMonths(e.target.value)}
                  className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
              </div>
              <div>
                <label className="text-xs text-gray-400">Monthly income estimate ($)</label>
                <input type="number" value={editIncome} onChange={e=>setEditIncome(e.target.value)}
                  className="w-full mt-1 bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
              </div>
              <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                Save & Recalculate
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-base font-semibold text-white">{value}</p>
    </div>
  );
}
