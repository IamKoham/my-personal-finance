import { Database } from 'sql.js';
import { dbAll } from '../db/db';

export interface RecurringTransaction {
  description: string;
  amount: number;
  category: string;
  count: number;
}

export function detectRecurring(db: Database): RecurringTransaction[] {
  const rows = dbAll(db, `
    SELECT description, amount, category, COUNT(*) as count
    FROM transactions
    WHERE type = 'debit'
    GROUP BY LOWER(TRIM(description)), amount
    HAVING COUNT(*) >= 2
    ORDER BY count DESC
    LIMIT 50
  `) as any[];

  return rows.map(r => ({
    description: r.description as string,
    amount: Number(r.amount),
    category: (r.category as string) ?? 'Other',
    count: Number(r.count),
  }));
}
