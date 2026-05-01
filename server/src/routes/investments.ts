import { Router } from "express";
import { dbAll, dbGet } from "../db/db";

const router = Router();

router.get("/holdings", (req, res) => {
  const db = req.app.locals.db;
  const holdings = dbAll(db, "SELECT * FROM investment_holdings ORDER BY market_value DESC");
  res.json(holdings);
});

router.get("/robinhood", (req, res) => {
  const db = req.app.locals.db;
  const account = (req.query.account as string) || "";
  const where = account ? "WHERE account_name=?" : "";
  const params = account ? [account] : [];
  const holdings = dbAll(db, `SELECT * FROM investment_holdings ${where} ORDER BY market_value DESC`, params);
  const total = holdings.reduce((s: number, h: any) => s + Number(h.market_value), 0);
  res.json({ holdings, total });
});

router.get("/fidelity", (req, res) => {
  const db = req.app.locals.db;
  const snapshot = dbGet(db, "SELECT * FROM fidelity_snapshots ORDER BY id DESC LIMIT 1");
  if (!snapshot) return res.json(null);
  const result = { ...snapshot, funds: [] as any[] };
  try { result.funds = JSON.parse(snapshot.funds_json as string || "[]"); } catch {}
  res.json(result);
});

router.get("/espp", (req, res) => {
  const db = req.app.locals.db;
  const lots = dbAll(db, "SELECT * FROM espp_lots ORDER BY purchase_date DESC");
  const totalValue = lots.reduce((s: number, l: any) => s + Number(l.market_value), 0);
  const totalGain = lots.reduce((s: number, l: any) => s + Number(l.expected_gain_loss), 0);
  res.json({ lots, totalValue, totalGain });
});

router.get("/rsu", (req, res) => {
  const db = req.app.locals.db;
  const grants = dbAll(db, "SELECT * FROM rsu_grants ORDER BY vest_date ASC");
  const totalVestedValue = grants.reduce((s: number, g: any) => {
    const grantedQty = Number(g.granted_qty) || 1;
    return s + Number(g.market_value) * Number(g.vested_qty) / grantedQty;
  }, 0);
  const totalGrantValue = grants.reduce((s: number, g: any) => s + Number(g.market_value), 0);
  const totalUnvestedQty = grants.reduce((s: number, g: any) => s + Number(g.unvested_qty), 0);
  res.json({ grants, totalVestedValue, totalGrantValue, totalUnvestedQty });
});

router.get("/summary", (req, res) => {
  const db = req.app.locals.db;
  const robinhoodAccounts = dbAll(db, "SELECT name, balance FROM accounts WHERE institution='Robinhood' OR name LIKE '%Robinhood%'");
  const robinhoodValue = robinhoodAccounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
  const fidelity = dbGet(db, "SELECT ending_balance, employee_contributions, employer_contributions FROM fidelity_snapshots ORDER BY id DESC LIMIT 1");
  let fidelityValue = fidelity ? Number(fidelity.ending_balance) : 0;
  if (fidelityValue === 0) {
    const fidelityAcct = dbGet(db, "SELECT balance FROM accounts WHERE institution LIKE '%Fidelity%' OR name LIKE '%Fidelity%' OR name LIKE '%401k%' ORDER BY id DESC LIMIT 1");
    if (fidelityAcct) fidelityValue = Number(fidelityAcct.balance) || 0;
  }
  const esppRow = dbGet(db, "SELECT COALESCE(SUM(market_value),0) as total FROM espp_lots");
  // Only count vested RSU shares — prorate market_value by vested_qty/granted_qty
  const rsuRow = dbGet(db, `
    SELECT COALESCE(SUM(market_value * CAST(vested_qty AS REAL) / NULLIF(granted_qty, 0)), 0) as total
    FROM rsu_grants
  `);
  const esppValue = Number(esppRow?.total || 0);
  const rsuValue = Number(rsuRow?.total || 0);
  const total = robinhoodValue + fidelityValue + esppValue + rsuValue;
  res.json({ robinhoodValue, fidelityValue, esppValue, rsuValue, total });
});

export default router;
