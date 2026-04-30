import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { categorize } from '../services/categorizer';

const DB_PATH = path.resolve(__dirname, '../../../data/finance.db');

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB_PATH));

  const stmt = db.prepare('SELECT id, description FROM transactions');
  const rows: { id: number; description: string }[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as any);
  stmt.free();

  let updated = 0;
  for (const row of rows) {
    const category = categorize(row.description);
    db.run('UPDATE transactions SET category = ? WHERE id = ?', [category, row.id]);
    updated++;
  }

  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
  console.log(`Recategorized ${updated} transactions.`);
  db.close();
}

main().catch(err => { console.error(err); process.exit(1); });
