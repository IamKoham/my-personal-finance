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
  const totalVestedValue = grants.reduce((s: number, g: any) => s + Number(g.market_value), 0);
  const totalUnvested = grants.reduce((s: number, g: any) => s + Number(g.unvested_qty), 0);
  res.json({ grants, totalVestedValue, totalUnvested });
});

router.get("/summary", (req, res) => {
  const db = req.app.locals.db;
  const robinhoodAccounts = dbAll(db, "SELECT name, balance FROM accounts WHERE institution='Robinhood' OR name LIKE '%Robinhood%'");
  const robinhoodValue = robinhoodAccounts.reduce((s: number, a: any) => s + Number(a.balance), 0);
  const fidelity = dbGet(db, "SELECT ending_balance, employee_contributions, employer_contributions FROM fidelity_snapshots ORDER BY id DESC LIMIT 1");
  const fidelityValue = fidelity ? Number(fidelity.ending_balance) : 0;
  const esppRow = dbGet(db, "SELECT COALESCE(SUM(market_value),0) as total FROM espp_lots");
  const rsuRow = dbGet(db, "SELECT COALESCE(SUM(market_value),0) as total FROM rsu_grants");
  const esppValue = Number(esppRow?.total || 0);
  const rsuValue = Number(rsuRow?.total || 0);
  const total = robinhoodValue + fidelityValue + esppValue + rsuValue;
  res.json({ robinhoodValue, fidelityValue, esppValue, rsuValue, total });
});

export default router;
