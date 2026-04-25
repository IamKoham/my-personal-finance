import { Router } from 'express';
import { dbAll, dbRun } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  res.json(dbAll(req.app.locals.db, 'SELECT * FROM uploads ORDER BY upload_date DESC'));
});

router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  dbRun(db, 'DELETE FROM transactions WHERE upload_id=?', [req.params.id]);
  dbRun(db, 'DELETE FROM uploads WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

export default router;
