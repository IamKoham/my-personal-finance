import { Router } from 'express';
import { dbAll, dbGet, dbRunNoSave, saveDb } from '../db/db';

const router = Router();

// All uploads — active and deleted — for the history log
router.get('/', (req, res) => {
  res.json(dbAll(req.app.locals.db, 'SELECT * FROM uploads ORDER BY upload_date DESC'));
});

// Soft-delete: mark upload as deleted, hard-delete its data, keep the log row
router.delete('/:id', (req, res) => {
  const db = req.app.locals.db;
  const uploadId = req.params.id;

  const upload = dbGet(db, 'SELECT account_name FROM uploads WHERE id=?', [uploadId]) as { account_name: string } | undefined;
  if (!upload) return res.status(404).json({ error: 'Upload not found' });

  // Hard-delete the actual data
  dbRunNoSave(db, 'DELETE FROM transactions        WHERE upload_id=?', [uploadId]);
  dbRunNoSave(db, 'DELETE FROM investment_holdings WHERE upload_id=?', [uploadId]);
  dbRunNoSave(db, 'DELETE FROM fidelity_snapshots  WHERE upload_id=?', [uploadId]);
  dbRunNoSave(db, 'DELETE FROM espp_lots           WHERE upload_id=?', [uploadId]);
  dbRunNoSave(db, 'DELETE FROM rsu_grants          WHERE upload_id=?', [uploadId]);

  // Soft-delete the upload log row (keep it for history)
  dbRunNoSave(db, "UPDATE uploads SET status='deleted', deleted_at=datetime('now') WHERE id=?", [uploadId]);

  // Zero account balance if no remaining active uploads for that account
  const activeForAccount = dbAll(db, 'SELECT id FROM uploads WHERE account_name=? AND deleted_at IS NULL', [upload.account_name]);
  if (activeForAccount.length === 0) {
    dbRunNoSave(db, "UPDATE accounts SET balance=0, updated_at=datetime('now') WHERE name=?", [upload.account_name]);
  }

  saveDb(db); // single disk write

  res.json({ ok: true });
});

export default router;
