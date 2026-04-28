import { Router } from 'express';
import { dbAll, dbGet } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;

  const rows = dbAll(db, 'SELECT key, value FROM settings') as { key: string; value: string }[];
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;

  const targetMonths = parseFloat(s['emergency_fund_months'] || '3');

  // Auto-calculate avg monthly expenses from last 3 months of real transactions
  // Exclude Investments and Income categories (not real expenses)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sinceDate = threeMonthsAgo.toISOString().slice(0, 10);

  const expRow = dbGet(db,
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE type='debit' AND category NOT IN ('Investments','Income') AND date >= ?`,
    [sinceDate]
  ) as { total: number };
  const totalExpenses3mo = Number(expRow?.total || 0);
  const avgMonthlyExpenses = totalExpenses3mo / 3;

  // Fall back to manual income estimate if no transaction data
  const manualIncome = parseFloat(s['monthly_income_estimate'] || '0');
  const monthlyExpenseBase = avgMonthlyExpenses > 0 ? avgMonthlyExpenses : manualIncome;

  const target = targetMonths * monthlyExpenseBase;

  // Current = sum of all savings account balances (liquid cash only)
  const savRow = dbGet(db, "SELECT COALESCE(SUM(balance),0) as total FROM accounts WHERE type='savings'") as { total: number };
  const current = Number(savRow?.total || 0);

  const monthsCovered = monthlyExpenseBase > 0 ? current / monthlyExpenseBase : 0;
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const status: 'red' | 'yellow' | 'green' = percent >= 100 ? 'green' : percent >= 50 ? 'yellow' : 'red';
  const availableToInvest = Math.max(0, current - target);

  res.json({
    current,
    target,
    months_covered: monthsCovered,
    target_months: targetMonths,
    percent,
    status,
    available_to_invest: availableToInvest,
    avg_monthly_expenses: monthlyExpenseBase,
    data_source: avgMonthlyExpenses > 0 ? 'transactions' : 'manual',
  });
});

export default router;
