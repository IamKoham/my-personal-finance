import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { Upload, Trash2, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { ACCOUNT_TYPES } from '../lib/constants';

export function Uploads() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [accountName, setAccountName] = useState('');
  const [customName, setCustomName] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    api.getUploads().then(setUploads);
    api.getAccounts().then(setAccounts);
  };
  useEffect(() => { load(); }, []);

  const handleAccountSelect = (name: string) => {
    setAccountName(name);
    if (name !== '__other__') {
      const acct = accounts.find(a => a.name === name);
      if (acct) setAccountType(acct.type);
    }
  };

  const effectiveName = accountName === '__other__' ? customName : accountName;

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !effectiveName) { alert('Select a file and choose an account.'); return; }
    setUploading(true);
    setResult(null);
    const r = await api.uploadFile(file, effectiveName, accountType);
    setResult(r);
    setUploading(false);
    load();
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this upload? Data will be deleted from the dashboard but the log entry will be kept.')) return;
    await api.deleteUpload(id);
    load();
  };

  const active  = uploads.filter(u => !u.deleted_at);
  const deleted = uploads.filter(u =>  u.deleted_at);

  return (
    <div className="p-6 space-y-6">
      {/* Upload zone */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-sm font-medium text-gray-400 mb-4">Upload Statement</h2>
        <div className="space-y-3 max-w-md">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs cursor-pointer"
          />

          <select
            value={accountName}
            onChange={e => handleAccountSelect(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— Select account —</option>
            {accounts.map(a => (
              <option key={a.id} value={a.name}>{a.name} ({a.type})</option>
            ))}
            <option value="__other__">+ Other (new account)</option>
          </select>

          {accountName === '__other__' && (
            <input
              placeholder="New account name (e.g. BofA Checking)"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          )}

          {(accountName === '__other__' || !accounts.find(a => a.name === accountName)) && (
            <select
              value={accountType}
              onChange={e => setAccountType(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !effectiveName}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
          >
            <Upload size={14} /> {uploading ? 'Processing…' : 'Upload'}
          </button>
        </div>

        {result && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${result.error ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-green-500/10 border border-green-500/30 text-green-400'}`}>
            {result.error ? (
              <><XCircle size={14} className="inline mr-1"/>{result.error}</>
            ) : (
              <><CheckCircle size={14} className="inline mr-1"/>
                Detected: <strong>{result.bank}</strong> · {result.inserted} inserted · {result.duplicates} duplicates skipped
                {result.ending_balance !== null && result.ending_balance !== undefined &&
                  <> · Balance: <strong>${Number(result.ending_balance).toFixed(2)}</strong></>
                }
              </>
            )}
          </div>
        )}
      </div>

      {/* Active uploads */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-400">Active Uploads</h2>
          <span className="text-xs text-gray-600">{active.length} file{active.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-gray-800">
          {active.map(u => (
            <div key={u.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-200">{u.filename}</p>
                <p className="text-xs text-gray-500">
                  {u.account_name} · {String(u.upload_date).slice(0, 10)} · {u.transaction_count} transactions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={14} className="text-green-400"/>
                <button onClick={() => handleDelete(u.id)} className="text-gray-500 hover:text-red-400 transition-colors" title="Remove upload">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
          {active.length === 0 && (
            <p className="px-4 py-8 text-center text-gray-500 text-sm">No active uploads. Upload a statement above.</p>
          )}
        </div>
      </div>

      {/* Deleted uploads log */}
      {deleted.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Deleted Upload Log</h2>
            <span className="text-xs text-gray-600">{deleted.length} record{deleted.length !== 1 ? 's' : ''} kept for audit</span>
          </div>
          <div className="divide-y divide-gray-800">
            {deleted.map(u => (
              <div key={u.id} className="px-4 py-3 flex items-center justify-between opacity-50">
                <div>
                  <p className="text-sm text-gray-400 line-through">{u.filename}</p>
                  <p className="text-xs text-gray-600">
                    {u.account_name} · uploaded {String(u.upload_date).slice(0, 10)} · {u.transaction_count} transactions
                    · deleted {String(u.deleted_at).slice(0, 10)}
                  </p>
                </div>
                <Clock size={14} className="text-gray-600 flex-shrink-0"/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
