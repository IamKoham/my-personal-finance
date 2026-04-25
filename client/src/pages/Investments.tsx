import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { currency, pct } from '../lib/formatters';
import { PortfolioPie } from '../components/charts/PortfolioPie';
import { Plus, Pencil } from 'lucide-react';

export function Investments() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = () => api.getAccounts().then(a => setAccounts(a.filter((x: any) => x.type === 'investment')));
  useEffect(() => { load(); }, []);

  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Total Invested</p>
          <p className="text-3xl font-bold text-white">{currency(total)}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
        >
          <Plus size={14} /> Add Investment
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h2 className="text-sm font-medium text-gray-400 mb-4">Portfolio Allocation</h2>
            <PortfolioPie accounts={accounts} />
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h2 className="text-sm font-medium text-gray-400 mb-3">Holdings</h2>
            <div className="space-y-3">
              {accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.institution || '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{currency(a.balance)}</p>
                    <p className="text-xs text-gray-400">{total > 0 ? pct(a.balance / total * 100) : '0%'}</p>
                  </div>
                  <button onClick={() => { setEditing(a); setShowForm(true); }} className="ml-3 text-gray-500 hover:text-white">
                    <Pencil size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
          <p className="text-gray-400 text-sm">No investment accounts yet.</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-3 text-blue-400 text-sm hover:underline">
            Add your first investment account →
          </button>
        </div>
      )}

      {showForm && (
        <InvestmentForm
          initial={editing}
          onSave={async (data: any) => {
            if (editing) {
              await api.updateAccount(editing.id, data);
            } else {
              await api.createAccount({ ...data, type: 'investment' });
            }
            setShowForm(false);
            load();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function InvestmentForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    balance: initial?.balance || 0,
    institution: initial?.institution || '',
  });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Edit' : 'Add'} Investment</h2>
        <div className="space-y-3">
          <input placeholder="Account name (e.g. Fidelity 401K)" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
          <input type="number" placeholder="Current balance" value={form.balance} onChange={e => setForm(f=>({...f,balance:parseFloat(e.target.value)}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
          <input placeholder="Institution" value={form.institution} onChange={e => setForm(f=>({...f,institution:e.target.value}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={() => onSave(form)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
