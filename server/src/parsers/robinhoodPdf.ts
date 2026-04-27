import { ParsedTransaction } from '../../../shared/types';

export interface RobinhoodPortfolio {
  portfolioValue: number | null;
  cashBalance: number | null;
  securitiesValue: number | null;
  holdings: Array<{ symbol: string; name: string; qty: number; price: number; marketValue: number; pctOfPortfolio: number }>;
  transactions: ParsedTransaction[];
}

/**
 * Robinhood monthly PDF statement
 * Page 1: Account Summary (Net Account Balance, Total Securities, Portfolio Value)
 * Page 2: Portfolio Summary (holdings table)
 * Page 3: Account Activity (buy/sell transactions)
 */
export function parseRobinhoodPdf(text: string): RobinhoodPortfolio {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let portfolioValue: number | null = null;
  let cashBalance: number | null = null;
  let securitiesValue: number | null = null;
  const holdings: RobinhoodPortfolio['holdings'] = [];
  const transactions: ParsedTransaction[] = [];

  // --- Account Summary ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] || '';

    if (/portfolio\s+value/i.test(line)) {
      const vals = extractDollarPair(line + ' ' + next);
      if (vals.length >= 2) portfolioValue = vals[1]; // closing balance
      else if (vals.length === 1) portfolioValue = vals[0];
    }
    if (/total\s+securities/i.test(line)) {
      const vals = extractDollarPair(line + ' ' + next);
      if (vals.length >= 2) securitiesValue = vals[1];
    }
    if (/brokerage\s+cash\s+balance/i.test(line)) {
      const m = (line + ' ' + next).match(/\$([\d,]+\.\d{2})/);
      if (m) cashBalance = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  // --- Holdings ---
  // Lines like: "Netflix NFLX Margin 31.621411 $96.15000 $3,040.40 $0.00 56.14%"
  for (const line of lines) {
    const hMatch = line.match(/^(\w+)\s+(\w+)\s+\w+\s+([\d.]+)\s+\$([\d,.]+)\s+\$([\d,.]+)\s+\$[\d,.]+\s+([\d.]+)%/);
    if (hMatch) {
      holdings.push({
        name: hMatch[1],
        symbol: hMatch[2],
        qty: parseFloat(hMatch[3]),
        price: parseFloat(hMatch[4].replace(/,/g, '')),
        marketValue: parseFloat(hMatch[5].replace(/,/g, '')),
        pctOfPortfolio: parseFloat(hMatch[6]),
      });
    }
  }

  // --- Transactions ---
  // Lines like: "Netflix CUSIP: 64110L106 NFLX Margin Buy 03/02/2026 2.57918 $96.93000 $250.00"
  for (const line of lines) {
    const txMatch = line.match(/(\w+)\s+Margin\s+(Buy|Sell|ACH)\s+(\d{2}\/\d{2}\/\d{4})\s+[\d.]+\s+\$[\d,.]+\s+\$([\d,.]+)/i);
    if (txMatch) {
      const symbol = txMatch[1];
      const action = txMatch[2].toLowerCase();
      const date = parseMDY(txMatch[3]);
      const amount = parseFloat(txMatch[4].replace(/,/g, ''));
      if (!date || isNaN(amount)) continue;
      transactions.push({
        date,
        description: `${action === 'buy' ? 'Buy' : 'Sell'} ${symbol}`,
        amount,
        type: action === 'sell' ? 'credit' : 'debit',
      });
    }

    // ACH Deposit
    const achMatch = line.match(/ACH\s+Deposit\s+\w+\s+ACH\s+(\d{2}\/\d{2}\/\d{4})\s+\$([\d,.]+)/i);
    if (achMatch) {
      const date = parseMDY(achMatch[1]);
      const amount = parseFloat(achMatch[2].replace(/,/g, ''));
      if (date && !isNaN(amount)) {
        transactions.push({ date, description: 'ACH Deposit', amount, type: 'credit' });
      }
    }
  }

  return { portfolioValue, cashBalance, securitiesValue, holdings, transactions };
}

function extractDollarPair(text: string): number[] {
  const matches = [...text.matchAll(/\$([\d,]+\.\d{2})/g)];
  return matches.map(m => parseFloat(m[1].replace(/,/g, '')));
}

function parseMDY(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1]}-${m[2]}`;
}
