import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AlertTriangle, Info, XCircle, RefreshCw } from 'lucide-react';

export function Recommendations() {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getRecommendations().then(setRecs).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const icon = (severity: string) => {
    if (severity === 'critical') return <XCircle size={18} className="text-red-400 flex-shrink-0" />;
    if (severity === 'warning')  return <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />;
    return <Info size={18} className="text-blue-400 flex-shrink-0" />;
  };

  const bg = (severity: string) => ({
    critical: 'border-red-500/30 bg-red-500/5',
    warning:  'border-yellow-500/30 bg-yellow-500/5',
    info:     'border-blue-500/30 bg-blue-500/5',
  }[severity] || 'border-gray-700 bg-gray-800');

  if (loading) return <div className="p-6 text-gray-400">Loading…</div>;

  const sorted = [...recs].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3);
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Personalized Tips</h2>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={16}/></button>
      </div>
      {sorted.map(r => (
        <div key={r.id} className={`rounded-xl p-4 border ${bg(r.severity)}`}>
          <div className="flex items-start gap-3">
            {icon(r.severity)}
            <div className="flex-1">
              <p className="font-medium text-white text-sm">{r.title}</p>
              <p className="text-xs text-gray-400 mt-1">{r.detail}</p>
              {r.action && <p className="text-xs text-blue-400 mt-1">→ {r.action}</p>}
            </div>
          </div>
        </div>
      ))}
      {sorted.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-10 border border-gray-800 text-center">
          <p className="text-gray-400">No recommendations yet. Upload some statements first.</p>
        </div>
      )}
    </div>
  );
}
