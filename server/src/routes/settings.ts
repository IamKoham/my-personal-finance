import { Router } from 'express';
import { dbAll, dbRun } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  const rows = dbAll(req.app.locals.db, 'SELECT key, value FROM settings') as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const r of rows) result[r.key as string] = r.value as string;
  res.json(result);
});

router.put('/', (req, res) => {
  const { key, value } = req.body;
  dbRun(req.app.locals.db, 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
  res.json({ ok: true });
});

export default router;
