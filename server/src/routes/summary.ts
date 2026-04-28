import { Router } from 'express';
import { dbAll } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { start, end } = req.query;
  let where = '1=1';
  const params: any[] = [];
  if (start) { where += ' AND date >= ?'; params.push(start); }
  if (end)   { where += ' AND date <= ?'; params.push(end); }

  const rows = dbAll(db, `
    SELECT
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type='debit' AND category NOT IN ('Investments','Income') THEN amount ELSE 0 END) as expenses,
      category
    FROM transactions
    WHERE ${where}
    GROUP BY month, category
    ORDER BY month DESC
  `, params);

  const byMonth: Record<string, any> = {};
  for (const row of rows) {
    const m = row.month as string;
    if (!byMonth[m]) byMonth[m] = { month: m, income: 0, expenses: 0, net: 0, by_category: {} };
    byMonth[m].income   += Number(row.income) || 0;
    byMonth[m].expenses += Number(row.expenses) || 0;
    if (row.category) {
      byMonth[m].by_category[row.category as string] =
        (byMonth[m].by_category[row.category as string] || 0) + (Number(row.expenses) || 0);
    }
  }
  for (const m of Object.values(byMonth) as any[]) m.net = m.income - m.expenses;

  res.json(Object.values(byMonth));
});

export default router;
