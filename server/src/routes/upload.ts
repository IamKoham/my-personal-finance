import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseStatement } from '../parsers';
import { categorize } from '../services/categorizer';
import { hashTransaction } from '../services/deduplicator';
import { dbRun, dbAll, dbGet, saveDb } from '../db/db';

const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { account_name, account_type } = req.body;
  if (!account_name || !account_type) {
    return res.status(400).json({ error: 'account_name and account_type required' });
  }

  const db = req.app.locals.db;
  const filePath = req.file.path;
  const filename = req.file.originalname;

  let text: string;
  try {
    text = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return res.status(500).json({ error: 'Failed to read uploaded file' });
  }

  const { transactions, bank, endingBalance, error, sample } = parseStatement(text, filename);

  if (error && transactions.length === 0) {
    return res.status(422).json({ error, sample, bank });
  }

  // Upsert account — auto-set balance from parsed ending balance if available
  const existingAccount = dbGet(db, 'SELECT id FROM accounts WHERE name=?', [account_name]);
  if (existingAccount) {
    if (endingBalance !== null) {
      dbRun(db, `UPDATE accounts SET balance=?, updated_at=datetime('now') WHERE name=?`, [endingBalance, account_name]);
    }
  } else {
    dbRun(db,
      'INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)',
      [account_name, account_type, endingBalance ?? 0]
    );
  }

  // Insert upload log
  const uploadResult = dbRun(db,
    'INSERT INTO uploads (filename, account_name, transaction_count, status) VALUES (?, ?, ?, ?)',
    [filename, account_name, 0, 'pending']
  );
  const uploadId = Number(uploadResult.lastInsertRowid);

  // Get existing hashes to dedup in memory
  const existingHashes = new Set(
    (dbAll(db, 'SELECT hash FROM transactions WHERE hash IS NOT NULL') as { hash: string }[])
      .map(r => r.hash as string)
  );

  let inserted = 0;
  for (const tx of transactions) {
    const category = categorize(tx.description, tx.category);
    const hash = hashTransaction(tx, account_name);
    if (existingHashes.has(hash)) continue;
    dbRun(db, `
      INSERT OR IGNORE INTO transactions
        (date, description, amount, type, category, account_name, account_type, source_file, upload_id, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tx.date, tx.description, tx.amount, tx.type, category, account_name, account_type, filename, uploadId, hash]);
    existingHashes.add(hash);
    inserted++;
  }

  // Update upload log
  dbRun(db, 'UPDATE uploads SET transaction_count=?, status=? WHERE id=?', [inserted, 'success', uploadId]);
  saveDb(db);

  res.json({
    ok: true,
    bank,
    parsed: transactions.length,
    inserted,
    duplicates: transactions.length - inserted,
    upload_id: uploadId,
    ending_balance: endingBalance,
  });
});

export default router;
