import { Database } from 'sql.js';
import { SCHEMA, CARD_REWARDS_SEED } from './schema';
import { dbExec } from './db';

export function migrate(db: Database): void {
  // Run schema (all CREATE IF NOT EXISTS — safe to re-run)
  dbExec(db, SCHEMA);

  // Seed card rewards if empty
  const { dbAll } = require('./db');
  const existing = dbAll(db, 'SELECT COUNT(*) as n FROM card_rewards') as any[];
  if (!existing[0] || Number(existing[0].n) === 0) {
    dbExec(db, CARD_REWARDS_SEED);
  }

  // Add new columns to existing tables if upgrading from older schema
  const addColIfMissing = (table: string, col: string, def: string) => {
    try { db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch {}
  };
  addColIfMissing('accounts', 'credit_limit', 'REAL DEFAULT 0');
  addColIfMissing('accounts', 'fico_score', 'INTEGER');

  // Clean up orphaned investment records (upload deleted without cleaning related tables).
  // Safe to run every startup — only removes rows whose upload_id no longer exists.
  const { dbAll: _dbAll, saveDb: _saveDb } = require('./db');
  const uploadIds = (_dbAll(db, 'SELECT id FROM uploads') as { id: number }[]).map(r => r.id);
  if (uploadIds.length === 0) {
    db.run('DELETE FROM investment_holdings');
    db.run('DELETE FROM fidelity_snapshots');
    db.run('DELETE FROM espp_lots');
    db.run('DELETE FROM rsu_grants');
    // Only zero balances for bank/credit accounts (not manually-managed investment accounts)
    db.run("UPDATE accounts SET balance=0, updated_at=datetime('now') WHERE type IN ('checking','savings','credit')");
  } else {
    const ids = uploadIds.join(',');
    db.run(`DELETE FROM investment_holdings WHERE upload_id NOT IN (${ids})`);
    db.run(`DELETE FROM fidelity_snapshots   WHERE upload_id NOT IN (${ids})`);
    db.run(`DELETE FROM espp_lots            WHERE upload_id NOT IN (${ids})`);
    db.run(`DELETE FROM rsu_grants           WHERE upload_id NOT IN (${ids})`);
    // Zero balances only for bank/credit accounts with no remaining uploads
    db.run(`UPDATE accounts SET balance=0, updated_at=datetime('now')
            WHERE type IN ('checking','savings','credit')
            AND name NOT IN (SELECT DISTINCT account_name FROM uploads)`);
  }
  _saveDb(db);
}
