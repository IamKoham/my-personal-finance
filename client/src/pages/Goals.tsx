import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { currency, pct } from '../lib/formatters';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = () => api.getGoals().then(setGoals);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return;
    await api.deleteGoal(id);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Financial Goals</h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
          <Plus size={14} /> Add Goal
        </button>
      </div>

      {goals.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
          <p className="text-gray-400 text-sm">No goals yet. Add your first goal!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map(g => {
          const progress = Math.min(100, g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0);
          const remaining = g.target_amount - g.current_amount;
          return (
            <div key={g.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-white">{g.name}</h3>
                  {g.target_date && <p className="text-xs text-gray-400 mt-0.5">Target: {g.target_date}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(g); setShowForm(true); }} className="text-gray-500 hover:text-white"><Pencil size={14}/></button>
                  <button onClick={() => handleDelete(g.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${progress}%`, background: progress >= 100 ? '#22c55e' : '#3b82f6' }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{currency(g.current_amount)} saved</span>
                <span>{pct(progress)} · {currency(remaining)} left</span>
                <span>Goal: {currency(g.target_amount)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <GoalForm
          initial={editing}
          onSave={async (data: any) => {
            if (editing) await api.updateGoal(editing.id, data);
            else await api.createGoal(data);
            setShowForm(false);
            load();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function GoalForm({ initial, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    target_amount: initial?.target_amount || '',
    current_amount: initial?.current_amount || 0,
    target_date: initial?.target_date || '',
  });
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">{initial ? 'Edit' : 'New'} Goal</h2>
        <div className="space-y-3">
          <input placeholder="Goal name (e.g. Emergency Fund)" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
          <input type="number" placeholder="Target amount" value={form.target_amount} onChange={e=>setForm(f=>({...f,target_amount:parseFloat(e.target.value)}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
          <input type="number" placeholder="Current amount saved" value={form.current_amount} onChange={e=>setForm(f=>({...f,current_amount:parseFloat(e.target.value)}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
          <input type="date" value={form.target_date} onChange={e=>setForm(f=>({...f,target_date:e.target.value}))}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"/>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={()=>onSave(form)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
