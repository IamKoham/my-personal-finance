import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { currency, pct } from '../lib/formatters';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { ACCOUNT_TYPES } from '../lib/constants';

export function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = () => api.getAccounts().then(setAccounts);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this account?')) return;
    await api.deleteAccount(id);
    load();
  };

  const netWorth = accounts.reduce((s, a) => a.type === 'credit' ? s - a.balance : s + a.balance, 0);

  const grouped = ACCOUNT_TYPES.reduce((g, t) => {
    g[t] = accounts.filter(a => a.type === t);
    return g;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Total Net Worth</p>
          <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>{currency(netWorth)}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm"
        >
          <Plus size={14} /> Add Account
        </button>
      </div>

      {Object.entries(grouped).map(([type, accts]) => accts.length === 0 ? null : (
        <div key={type}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{type}</h2>
          <div className="space-y-2">
            {accts.map(a => (
              <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.institution || '—'}</p>
                  {a.type === 'credit' && a.credit_limit > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Utilization: {pct(a.balance / a.credit_limit * 100)} of {currency(a.credit_limit)} limit
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${a.type === 'credit' ? 'text-red-400' : 'text-white'}`}>
                    {a.type === 'credit' ? '-' : ''}{currency(a.balance)}
                  </span>
                  <button onClick={() => { setEditing(a); setShowForm(true); }} className="text-gray-500 hover:text-white">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && (
        <AccountForm
          initial={editing}
          onSave={async (data) => {
            if (editing) {
              await api.updateAccount(editing.id, data);
            } else {
              await api.createAccount(data);
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

function AccountForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'checking',
    balance: initial?.balance || 0,
    credit_limit: initial?.credit_limit || 0,
    institution: initial?.institution || '',
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Edit' : 'Add'} Account</h2>
        <div className="space-y-3">
          <input placeholder="Account name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none">
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" placeholder="Balance" value={form.balance} onChange={e => setForm(f => ({...f, balance: parseFloat(e.target.value)}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          {form.type === 'credit' && (
            <input type="number" placeholder="Credit Limit" value={form.credit_limit} onChange={e => setForm(f => ({...f, credit_limit: parseFloat(e.target.value)}))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          )}
          <input placeholder="Institution (e.g. Bank of America)" value={form.institution} onChange={e => setForm(f => ({...f, institution: e.target.value}))}
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
