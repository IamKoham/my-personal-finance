import { Database } from 'sql.js';
import { Recommendation } from '../../../shared/types';
import { dbAll, dbGet } from '../db/db';

export async function getRecommendations(db: Database): Promise<Recommendation[]> {
  const recs: Recommendation[] = [];

  const settingRows = dbAll(db, 'SELECT key, value FROM settings') as { key: string; value: string }[];
  const s: Record<string, string> = {};
  for (const r of settingRows) s[r.key as string] = r.value as string;

  const targetMonths = parseFloat(s['emergency_fund_months'] || '3');
  const monthlyIncome = parseFloat(s['monthly_income_estimate'] || '0');
  const target = targetMonths * monthlyIncome;

  const efRow = dbGet(db, "SELECT COALESCE(SUM(balance),0) as total FROM accounts WHERE type='savings'");
  const efCurrent = Number(efRow?.total || 0);
  const efPercent = target > 0 ? (efCurrent / target) * 100 : 0;

  if (efPercent < 50) {
    recs.push({ id: 'R2', severity: 'critical', title: 'Emergency fund critically low', detail: `${efPercent.toFixed(0)}% funded. Target: ${targetMonths} months.`, action: 'Increase savings.' });
  } else if (efPercent < 100) {
    recs.push({ id: 'R1', severity: 'critical', title: 'Build emergency fund first', detail: `${efPercent.toFixed(0)}% funded. Need $${(target - efCurrent).toFixed(2)} more.`, action: 'Save before investing.' });
  }

  if (monthlyIncome > 0) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const start = threeMonthsAgo.toISOString().slice(0, 10);

    const incRow = dbGet(db, "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='credit' AND date >= ?", [start]);
    const expRow = dbGet(db, "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='debit' AND date >= ?", [start]);
    const income = Number(incRow?.total || 0);
    const expenses = Number(expRow?.total || 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    if (savingsRate < 10) {
      recs.push({ id: 'R3', severity: 'warning', title: `Savings rate ${savingsRate.toFixed(0)}% — low`, detail: 'Aim for at least 20%.', action: 'Review spending.' });
    } else if (savingsRate >= 20) {
      recs.push({ id: 'R4', severity: 'info', title: `Great savings rate: ${savingsRate.toFixed(0)}%`, detail: 'Keep it up!' });
    }
  }

  const investments = dbAll(db, "SELECT name, balance FROM accounts WHERE type='investment'") as { name: string; balance: number }[];
  const totalInvested = investments.reduce((s, a) => s + Number(a.balance), 0);
  if (totalInvested > 0) {
    for (const inv of investments) {
      const pct = (Number(inv.balance) / totalInvested) * 100;
      if (pct > 50) {
        recs.push({ id: 'R6', severity: 'critical', title: `High concentration in ${inv.name}`, detail: `${pct.toFixed(0)}% of portfolio.`, action: 'Diversify.' });
      } else if (pct > 30) {
        recs.push({ id: 'R5', severity: 'warning', title: `Concentrated risk: ${inv.name} is ${pct.toFixed(0)}% of portfolio`, detail: 'Consider diversifying.' });
      }
    }
  }

  const lastUpload = dbGet(db, 'SELECT MAX(upload_date) as last FROM uploads') as { last: string | null };
  if (lastUpload?.last) {
    const daysSince = Math.floor((Date.now() - new Date(lastUpload.last as string).getTime()) / 86400000);
    if (daysSince > 30) {
      recs.push({ id: 'R7', severity: 'info', title: `Statements not updated in ${daysSince} days`, detail: 'Upload recent statements.', action: 'Go to Uploads.' });
    }
  }

  const goals = dbAll(db, 'SELECT * FROM goals WHERE target_date IS NOT NULL') as any[];
  for (const goal of goals) {
    if (Number(goal.current_amount) >= Number(goal.target_amount)) continue;
    const remaining = Number(goal.target_amount) - Number(goal.current_amount);
    const targetDate = new Date(goal.target_date as string);
    const now = new Date();
    const monthsLeft = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()));
    if (monthsLeft > 0) {
      const needed = remaining / monthsLeft;
      recs.push({ id: `R8_${goal.id}`, severity: 'info', title: `${goal.name}: save $${needed.toFixed(0)}/month`, detail: `${monthsLeft} months remaining. $${remaining.toFixed(0)} left.` });
    }
  }

  recs.push({ id: 'R9', severity: 'warning', title: 'Check your 401K contribution %', detail: 'If below 6%, you may be missing employer match.', action: 'Log in to your 401K portal.' });

  return recs;
}
