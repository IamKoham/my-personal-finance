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
  addColIfMissing('accounts', 'due_day', 'INTEGER');
  addColIfMissing('uploads', 'deleted_at', 'TEXT');
}
