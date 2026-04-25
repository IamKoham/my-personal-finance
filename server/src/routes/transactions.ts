import { Router } from 'express';
import { dbAll } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const { start, end, account, category, type } = req.query;
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (start)    { sql += ' AND date >= ?'; params.push(start); }
  if (end)      { sql += ' AND date <= ?'; params.push(end); }
  if (account)  { sql += ' AND account_name = ?'; params.push(account); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (type)     { sql += ' AND type = ?'; params.push(type); }

  sql += ' ORDER BY date DESC';
  res.json(dbAll(db, sql, params));
});

export default router;
