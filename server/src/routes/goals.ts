import { Router } from 'express';
import { dbAll, dbRun, dbGet } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  res.json(dbAll(req.app.locals.db, 'SELECT * FROM goals ORDER BY created_at DESC'));
});

router.post('/', (req, res) => {
  const db = req.app.locals.db;
  const { name, target_amount, current_amount = 0, target_date } = req.body;
  const result = dbRun(db,
    'INSERT INTO goals (name, target_amount, current_amount, target_date) VALUES (?, ?, ?, ?)',
    [name, target_amount, current_amount, target_date ?? null]
  );
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const db = req.app.locals.db;
  const { name, target_amount, current_amount, target_date } = req.body;
  const current = dbGet(db, 'SELECT * FROM goals WHERE id=?', [req.params.id]);
  if (!current) return res.status(404).json({ error: 'Not found' });
  dbRun(db,
    'UPDATE goals SET name=?, target_amount=?, current_amount=?, target_date=? WHERE id=?',
    [name ?? current.name, target_amount ?? current.target_amount, current_amount ?? current.current_amount, target_date ?? current.target_date, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  dbRun(req.app.locals.db, 'DELETE FROM goals WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
