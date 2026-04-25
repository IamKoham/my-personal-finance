import { Router } from 'express';
import { dbAll, dbGet } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;
  const rows = dbAll(db, 'SELECT key, value FROM settings') as { key: string; value: string }[];
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key as string] = r.value as string;

  const targetMonths = parseFloat(s['emergency_fund_months'] || '3');
  const monthlyIncome = parseFloat(s['monthly_income_estimate'] || '0');
  const target = targetMonths * monthlyIncome;

  const row = dbGet(db, "SELECT COALESCE(SUM(balance),0) as total FROM accounts WHERE type='savings'");
  const current = Number(row?.total || 0);
  const monthsCovered = monthlyIncome > 0 ? current / monthlyIncome : 0;
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const status = percent >= 100 ? 'green' : percent >= 50 ? 'yellow' : 'red';
  const availableToInvest = Math.max(0, current - target);

  res.json({ current, target, months_covered: monthsCovered, target_months: targetMonths, percent, status, available_to_invest: availableToInvest });
});

export default router;
