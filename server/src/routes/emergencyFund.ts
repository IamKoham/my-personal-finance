import { Router } from 'express';
import { dbAll, dbGet } from '../db/db';

const router = Router();

router.get('/', (req, res) => {
  const db = req.app.locals.db;

  const rows = dbAll(db, 'SELECT key, value FROM settings') as { key: string; value: string }[];
  const s: Record<string, string> = {};
  for (const r of rows) s[r.key] = r.value;

  const targetMonths = parseFloat(s['emergency_fund_months'] || '3');

  // Avg monthly expenses from last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const sinceDate = threeMonthsAgo.toISOString().slice(0, 10);

  const expRow = dbGet(db,
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE type='debit' AND category NOT IN ('Investments','Income','CC Payment','Transfer')
     AND account_type NOT IN ('investment') AND date >= ?`,
    [sinceDate]
  ) as { total: number };
  const totalExpenses3mo = Number(expRow?.total || 0);
  const avgMonthlyExpenses = totalExpenses3mo / 3;

  const manualIncome = parseFloat(s['monthly_income_estimate'] || '0');
  const monthlyExpenseBase = avgMonthlyExpenses > 0 ? avgMonthlyExpenses : manualIncome;

  const target = targetMonths * monthlyExpenseBase;

  // Liquid cash = checking + savings
  const savRow = dbGet(db, "SELECT COALESCE(SUM(balance),0) as total FROM accounts WHERE type IN ('savings','checking')") as { total: number };
  const liquidCash = Number(savRow?.total || 0);

  // Goals: separate saved vs still-needed for incomplete goals
  const goals = dbAll(db, 'SELECT current_amount, target_amount FROM goals') as { current_amount: number; target_amount: number }[];
  const savedForGoals   = goals.reduce((s, g) => s + Math.min(Number(g.current_amount), Number(g.target_amount)), 0);
  const remainingForGoals = goals.reduce((s, g) => s + Math.max(0, Number(g.target_amount) - Number(g.current_amount)), 0);
  const allocatedToGoals = savedForGoals; // already sitting in liquid cash, committed

  // EF current = liquid minus what's already earmarked for goals
  const current = Math.max(0, liquidCash - allocatedToGoals);

  const monthsCovered = monthlyExpenseBase > 0 ? current / monthlyExpenseBase : 0;
  const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const status: 'red' | 'yellow' | 'green' = percent >= 100 ? 'green' : percent >= 50 ? 'yellow' : 'red';

  // Available to invest = what remains after EF target AND remaining goal needs
  const afterEF = Math.max(0, current - target);
  const availableToInvest = Math.max(0, afterEF - remainingForGoals);

  res.json({
    current,
    liquid_cash: liquidCash,
    allocated_to_goals: allocatedToGoals,
    remaining_for_goals: remainingForGoals,
    target,
    months_covered: monthsCovered,
    target_months: targetMonths,
    percent,
    status,
    available_to_invest: availableToInvest,
    after_ef_surplus: afterEF,
    avg_monthly_expenses: monthlyExpenseBase,
    data_source: avgMonthlyExpenses > 0 ? 'transactions' : 'manual',
  });
});

export default router;
