import { Database } from 'sql.js';
import { SCHEMA } from './schema';
import { dbExec } from './db';

export function migrate(db: Database): void {
  dbExec(db, SCHEMA);
  console.log('✅ DB migrated');
}
