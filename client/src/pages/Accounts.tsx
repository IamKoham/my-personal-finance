import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { currency } from "../lib/formatters";
import { Plus, Pencil, Trash2, CreditCard, Landmark, TrendingUp, PiggyBank } from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  checking:   <Landmark size={16} />,
  savings:    <PiggyBank size={16} />,
  credit:     <CreditCard size={16} />,
  investment: <TrendingUp size={16} />,
};

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking", savings: "Savings", credit: "Credit Card", investment: "Investment",
};

export function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.getAccounts().then(setAccounts).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const assets = accounts.filter(a => a.type !== "credit").reduce((s, a) => s + a.balance, 0);
  const liabilities = accounts.filter(a => a.type === "credit").reduce((s, a) => s + a.balance, 0);
  const netWorth = assets - liabilities;

  const grouped = accounts.reduce((g: Record<string, any[]>, a) => {
    (g[a.type] = g[a.type] || []).push(a);
    return g;
  }, {});

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Net worth summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Total Assets</p>
          <p className="text-xl font-bold text-emerald-400">{currency(assets)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Total Liabilities</p>
          <p className="text-xl font-bold text-red-400">{currency(liabilities)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-400 mb-1">Net Worth</p>
          <p className={`text-xl font-bold ${netWorth >= 0 ? "text-white" : "text-red-400"}`}>{currency(netWorth)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
          <Plus size={14} /> Add Account
        </button>
      </div>

      {/* Account groups */}
      {["checking", "savings", "credit", "investment"].map(type => {
        const group = grouped[type];
        if (!group || group.length === 0) return null;
        return (
          <div key={type} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <span className="text-gray-400">{TYPE_ICONS[type]}</span>
              <h2 className="text-sm font-medium text-gray-300">{TYPE_LABELS[type]}</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {group.map((a: any) => (
                <AccountRow key={a.id} account={a}
                  onEdit={() => { setEditing(a); setShowForm(true); }}
                  onDelete={async () => { await api.deleteAccount(a.id); load(); }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {showForm && (
        <AccountForm
          initial={editing}
          onSave={async (data: any) => {
            if (editing) await api.updateAccount(editing.id, data);
            else await api.createAccount(data);
            setShowForm(false);
            load();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function AccountRow({ account: a, onEdit, onDelete }: { account: any; onEdit: () => void; onDelete: () => void }) {
  const isCredit = a.type === "credit";
  const limit = Number(a.credit_limit) || 0;
  const balance = Number(a.balance) || 0;
  const utilization = isCredit && limit > 0 ? (balance / limit) * 100 : null;
  const utilizationColor = utilization === null ? "" : utilization < 10 ? "text-emerald-400" : utilization < 30 ? "text-yellow-400" : "text-red-400";
  const barColor = utilization === null ? "" : utilization < 10 ? "bg-emerald-500" : utilization < 30 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">{a.name}</p>
          <p className="text-xs text-gray-500">{a.institution || "—"} · Updated {a.updated_at?.slice(0, 10)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-sm font-medium ${isCredit ? "text-red-400" : "text-white"}`}>{currency(balance)}</p>
            {a.fico_score && <p className="text-xs text-blue-400">FICO {a.fico_score}</p>}
          </div>
          <button onClick={onEdit} className="text-gray-500 hover:text-white"><Pencil size={14} /></button>
          <button onClick={onDelete} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      </div>
      {utilization !== null && (
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Credit utilization</span>
            <span className={utilizationColor}>{utilization.toFixed(1)}% of {currency(limit)}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, utilization)}%` }} />
          </div>
          {utilization >= 30 && (
            <p className="text-xs text-red-400 mt-1">Pay down to below 30% to improve credit score</p>
          )}
        </div>
      )}
    </div>
  );
}

function AccountForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    type: initial?.type || "checking",
    balance: initial?.balance || 0,
    credit_limit: initial?.credit_limit || 0,
    institution: initial?.institution || "",
  });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">{initial ? "Edit" : "Add"} Account</h2>
        <div className="space-y-3">
          <input placeholder="Account name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="credit">Credit Card</option>
            <option value="investment">Investment</option>
          </select>
          <input type="number" placeholder="Current balance" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: parseFloat(e.target.value) }))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          {form.type === "credit" && (
            <input type="number" placeholder="Credit limit" value={form.credit_limit} onChange={e => setForm(f => ({ ...f, credit_limit: parseFloat(e.target.value) }))}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          )}
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
