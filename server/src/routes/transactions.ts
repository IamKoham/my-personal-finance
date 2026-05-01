import { Router } from 'express';
import { dbAll, dbRun } from '../db/db';
import { categorize } from '../services/categorizer';

const router = Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { start, end, account, category, type, limit } = req.query;
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (start)    { sql += ' AND date >= ?'; params.push(start); }
  if (end)      { sql += ' AND date <= ?'; params.push(end); }
  if (account)  { sql += ' AND account_name = ?'; params.push(account); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (type)     { sql += ' AND type = ?'; params.push(type); }

  sql += ' ORDER BY date DESC';
  if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)); }
  res.json(dbAll(db, sql, params));
});

// Re-run categorizer on all existing transactions (preserves manual overrides is NOT a goal here)
router.post('/recategorize', (req, res) => {
  const db = req.app.locals.db;
  const rows = dbAll(db, 'SELECT id, description FROM transactions', []) as { id: number; description: string }[];
  let updated = 0;
  for (const row of rows) {
    const category = categorize(row.description);
    dbRun(db, 'UPDATE transactions SET category = ? WHERE id = ?', [category, row.id]);
    updated++;
  }
  res.json({ ok: true, updated });
});

router.patch('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'category required' });
  dbRun(db, 'UPDATE transactions SET category = ? WHERE id = ?', [category, req.params.id]);
  res.json({ ok: true });
});

export default router;
