import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'finance.db');

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
  return _db;
}

export function saveDb(db: Database): void {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export type Row = Record<string, any>;

export interface StmtResult {
  lastInsertRowid: number | bigint;
  changes: number;
}

// Runs SQL and saves to disk — use for single important writes
export function dbRun(db: Database, sql: string, params: any[] = []): StmtResult {
  db.run(sql, params);
  const meta = db.exec('SELECT last_insert_rowid() as id, changes() as ch');
  const row = meta[0]?.values[0];
  const result: StmtResult = {
    lastInsertRowid: row ? Number(row[0]) : 0,
    changes: row ? Number(row[1]) : 0,
  };
  saveDb(db);
  return result;
}

// Runs SQL in-memory only — use inside bulk loops, call saveDb() once after
export function dbRunNoSave(db: Database, sql: string, params: any[] = []): StmtResult {
  db.run(sql, params);
  const meta = db.exec('SELECT last_insert_rowid() as id, changes() as ch');
  const row = meta[0]?.values[0];
  return {
    lastInsertRowid: row ? Number(row[0]) : 0,
    changes: row ? Number(row[1]) : 0,
  };
}

export function dbAll(db: Database, sql: string, params: any[] = []): Row[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Row[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function dbGet(db: Database, sql: string, params: any[] = []): Row | undefined {
  return dbAll(db, sql, params)[0];
}

export function dbExec(db: Database, sql: string): void {
  db.exec(sql);
  saveDb(db);
}
