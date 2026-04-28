import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { parseStatement } from "../parsers";
import { categorize } from "../services/categorizer";
import { hashTransaction } from "../services/deduplicator";
import { dbRun, dbRunNoSave, dbAll, dbGet, saveDb, dbExec } from "../db/db";

const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

async function extractText(filePath: string, filename: string): Promise<string> {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (ext === ".xlsx" || ext === ".xls") {
    const XLSX = await import("xlsx");
    const wb = XLSX.readFile(filePath);
    const result: Record<string, any[][]> = {};
    for (const sheetName of wb.SheetNames) {
      result[sheetName] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
    }
    return JSON.stringify({ __xlsx: true, sheets: result });
  }
  return fs.readFileSync(filePath, "utf-8");
}

function persistMeta(db: any, bank: string, meta: any, accountName: string, uploadId: number) {
  if (!meta) return;
  if (bank === "robinhood_pdf" && meta.holdings) {
    db.run("DELETE FROM investment_holdings WHERE account_name=?", [accountName]);
    for (const h of meta.holdings) {
      dbRunNoSave(db, "INSERT INTO investment_holdings (account_name, symbol, name, qty, price, market_value, pct_of_portfolio, holding_type, upload_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'stock', ?)",
        [accountName, h.symbol, h.name, h.qty, h.price, h.marketValue, h.pctOfPortfolio, uploadId]);
    }
    if (meta.cashBalance) {
      const pct = meta.portfolioValue ? (meta.cashBalance / meta.portfolioValue) * 100 : 0;
      dbRunNoSave(db, "INSERT INTO investment_holdings (account_name, symbol, name, qty, price, market_value, pct_of_portfolio, holding_type, upload_id) VALUES (?, 'CASH', 'Cash', 1, ?, ?, ?, 'cash', ?)",
        [accountName, meta.cashBalance, meta.cashBalance, pct, uploadId]);
    }
  }
  if (bank === "fidelity_pdf") {
    dbRunNoSave(db, "INSERT INTO fidelity_snapshots (plan_name, ending_balance, vested_balance, employee_contributions, employer_contributions, change_in_market_value, rate_of_return, funds_json, upload_id, statement_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'))",
      [meta.planName, meta.endingBalance || 0, meta.vestedBalance || 0, meta.employeeContributions || 0,
       meta.employerContributions || 0, meta.changeInMarketValue || 0, meta.rateOfReturn || 0,
       JSON.stringify(meta.funds || []), uploadId]);
  }
  if (bank === "etrade_xlsx") {
    if (meta.esppLots && meta.esppLots.length) {
      for (const lot of meta.esppLots) {
        dbRunNoSave(db, "INSERT INTO espp_lots (symbol, purchase_date, purchase_price, purchased_qty, net_shares, sellable_qty, market_value, expected_gain_loss, discount_pct, cost_basis_per_share, taxable_gain_per_share, tax_status, first_sellable_date, upload_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [lot.symbol, lot.purchaseDate, lot.purchasePrice, lot.purchasedQty, lot.netShares,
           lot.sellableQty, lot.marketValue, lot.expectedGainLoss, lot.discountPct,
           lot.costBasisPerShare, lot.taxableGainPerShare, lot.taxStatus, lot.firstSellableDate, uploadId]);
      }
    }
    if (meta.rsuGrants && meta.rsuGrants.length) {
      for (const g of meta.rsuGrants) {
        dbRunNoSave(db, "INSERT INTO rsu_grants (symbol, grant_date, granted_qty, vested_qty, unvested_qty, sellable_qty, market_value, vest_date, total_taxes_paid, effective_tax_rate, taxable_gain, cost_basis_per_share, upload_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [g.symbol, g.grantDate, g.grantedQty, g.vestedQty, g.unvestedQty, g.sellableQty,
           g.marketValue, g.vestDate, g.totalTaxesPaid, g.effectiveTaxRate, g.taxableGain,
           g.costBasisPerShare, uploadId]);
      }
    }
  }
  if (bank === "discover_pdf") {
    if (meta.creditLimit) dbRunNoSave(db, "UPDATE accounts SET credit_limit=?, updated_at=datetime('now') WHERE name=?", [meta.creditLimit, accountName]);
    if (meta.ficoScore) dbRunNoSave(db, "UPDATE accounts SET fico_score=?, updated_at=datetime('now') WHERE name=?", [meta.ficoScore, accountName]);
  }
}

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const { account_name, account_type } = req.body;
  if (!account_name || !account_type) return res.status(400).json({ error: "account_name and account_type required" });

  const db = req.app.locals.db;
  const filePath = req.file.path;
  const filename = req.file.originalname;

  let text: string;
  try { text = await extractText(filePath, filename); }
  catch (err: any) { return res.status(500).json({ error: `Failed to read file: ${err.message}` }); }

  const { transactions, bank, endingBalance, error, sample, meta } = parseStatement(text, filename);
  if (error && transactions.length === 0) return res.status(422).json({ error, sample, bank });

  const existingAccount = dbGet(db, "SELECT id FROM accounts WHERE name=?", [account_name]);
  if (existingAccount) {
    if (endingBalance !== null) dbRun(db, "UPDATE accounts SET balance=?, updated_at=datetime('now') WHERE name=?", [endingBalance, account_name]);
  } else {
    dbRun(db, "INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)", [account_name, account_type, endingBalance ?? 0]);
  }

  const uploadResult = dbRun(db, "INSERT INTO uploads (filename, account_name, transaction_count, status) VALUES (?, ?, ?, ?)", [filename, account_name, 0, "pending"]);
  const uploadId = Number(uploadResult.lastInsertRowid);

  persistMeta(db, bank, meta, account_name, uploadId);

  const existingHashes = new Set(
    (dbAll(db, "SELECT hash FROM transactions WHERE hash IS NOT NULL") as { hash: string }[]).map(r => r.hash as string)
  );

  let inserted = 0;
  for (const tx of transactions) {
    const category = categorize(tx.description, (tx as any).category);
    const hash = hashTransaction(tx, account_name);
    if (existingHashes.has(hash)) continue;
    dbRunNoSave(db, "INSERT OR IGNORE INTO transactions (date, description, amount, type, category, account_name, account_type, source_file, upload_id, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [tx.date, tx.description, tx.amount, tx.type, category, account_name, account_type, filename, uploadId, hash]);
    existingHashes.add(hash);
    inserted++;
  }

  dbRunNoSave(db, "UPDATE uploads SET transaction_count=?, status=? WHERE id=?", [inserted, "success", uploadId]);
  saveDb(db); // single write for the entire upload

  res.json({ ok: true, bank, parsed: transactions.length, inserted, duplicates: transactions.length - inserted, upload_id: uploadId, ending_balance: endingBalance });
});

export default router;
