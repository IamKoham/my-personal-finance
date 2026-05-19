import { Router } from 'express';
import { dbAll, dbRun, dbGet } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  res.json(dbAll(req.app.locals.db, 'SELECT * FROM accounts ORDER BY name'));
});

router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { name, type, balance = 0, institution, credit_limit = 0 } = req.body;
  const result = dbRun(db,
    'INSERT INTO accounts (name, type, balance, institution, credit_limit) VALUES (?, ?, ?, ?, ?)',
    [name, type, balance, institution ?? null, credit_limit]
  );
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { balance, credit_limit, institution, due_day } = req.body;
  const current = dbGet(db, 'SELECT * FROM accounts WHERE id=?', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Not found' });
  dbRun(db,
    `UPDATE accounts SET balance=?, credit_limit=?, institution=?, due_day=?, updated_at=datetime('now') WHERE id=?`,
    [balance ?? current.balance, credit_limit ?? current.credit_limit, institution ?? current.institution, due_day !== undefined ? due_day : current.due_day, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  dbRun(req.app.locals.db, 'DELETE FROM accounts WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
