import { Router } from 'express';
import { dbAll, dbGet, dbRun } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  res.json(dbAll(req.app.locals.db, 'SELECT * FROM uploads ORDER BY upload_date DESC'));
});

router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const uploadId = req.params.id;

  const upload = dbGet(db, 'SELECT account_name FROM uploads WHERE id=?', [uploadId]) as { account_name: string } | undefined;

  // Remove transactions and all investment-specific data tied to this upload
  dbRun(db, 'DELETE FROM transactions         WHERE upload_id=?', [uploadId]);
  dbRun(db, 'DELETE FROM investment_holdings  WHERE upload_id=?', [uploadId]);
  dbRun(db, 'DELETE FROM fidelity_snapshots   WHERE upload_id=?', [uploadId]);
  dbRun(db, 'DELETE FROM espp_lots            WHERE upload_id=?', [uploadId]);
  dbRun(db, 'DELETE FROM rsu_grants           WHERE upload_id=?', [uploadId]);
  dbRun(db, 'DELETE FROM uploads              WHERE id=?',        [uploadId]);

  // If no more uploads exist for this account, zero out its balance
  if (upload?.account_name) {
    const remaining = dbGet(db, 'SELECT COUNT(*) as cnt FROM uploads WHERE account_name=?', [upload.account_name]) as { cnt: number };
    if (Number(remaining?.cnt) === 0) {
      dbRun(db, "UPDATE accounts SET balance=0, updated_at=datetime('now') WHERE name=?", [upload.account_name]);
    }
  }

  res.json({ ok: true });
});

export default router;
