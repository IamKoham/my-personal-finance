import { ParsedTransaction } from '../../../shared/types';

/**
 * Chase CSV (Checking & Savings)
 * Columns: Details, Posting Date, Description, Amount, Type, Balance, Check or Slip #
 * Ending balance = Balance column of the first row (most recent transaction).
 */
export function parseChaseCSV(text: string): { transactions: ParsedTransaction[]; endingBalance: number | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const headerIdx = lines.findIndex(l => /Details.*Posting Date.*Description.*Amount/i.test(l));
  if (headerIdx === -1) throw new Error('Chase: cannot find header row');

  const headers = splitCSV(lines[headerIdx]).map(h => h.trim().toLowerCase());
  const dateCol    = headers.indexOf('posting date');
  const descCol    = headers.indexOf('description');
  const amtCol     = headers.indexOf('amount');
  const balanceCol = headers.indexOf('balance');

  let endingBalance: number | null = null;
  const results: ParsedTransaction[] = [];

  for (const line of lines.slice(headerIdx + 1)) {
    const cols = splitCSV(line);
    if (cols.length <= Math.max(dateCol, descCol, amtCol)) continue;
    const dateRaw    = cols[dateCol]?.trim();
    const description = cols[descCol]?.trim();
    const amountRaw  = cols[amtCol]?.trim().replace(/[$,]/g, '');
    if (!dateRaw || !description || !amountRaw) continue;
    const amount = parseFloat(amountRaw);
    if (isNaN(amount)) continue;
    const date = parseMDY(dateRaw);
    if (!date) continue;

    // First data row = most recent = ending balance
    if (endingBalance === null && balanceCol >= 0) {
      const bal = parseFloat((cols[balanceCol] || '').replace(/[$,]/g, ''));
      if (!isNaN(bal)) endingBalance = bal;
    }

    results.push({ date, description, amount: Math.abs(amount), type: amount >= 0 ? 'credit' : 'debit' });
  }

  return { transactions: results, endingBalance };
}

/**
 * Chase Sapphire CC CSV
 * Columns: Transaction Date, Post Date, Description, Category, Type, Amount, Memo
 * No balance column — ending balance must be set manually or from account balance field.
 * We'll use the running sum of debits minus credits as the statement balance.
 */
export function parseChaseSapphireCSV(text: string): { transactions: ParsedTransaction[]; endingBalance: number | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const headerIdx = lines.findIndex(l => /Transaction Date.*Post Date.*Description.*Category.*Type.*Amount/i.test(l));
  if (headerIdx === -1) throw new Error('Chase Sapphire: cannot find header row');

  const headers     = splitCSV(lines[headerIdx]).map(h => h.trim().toLowerCase());
  const dateCol     = headers.indexOf('transaction date');
  const descCol     = headers.indexOf('description');
  const amtCol      = headers.indexOf('amount');
  const categoryCol = headers.indexOf('category');

  const results: ParsedTransaction[] = [];
  let statementBalance = 0;

  for (const line of lines.slice(headerIdx + 1)) {
    const cols = splitCSV(line);
    if (cols.length <= Math.max(dateCol, descCol, amtCol)) continue;
    const dateRaw      = cols[dateCol]?.trim();
    const description  = cols[descCol]?.trim();
    const amountRaw    = cols[amtCol]?.trim().replace(/[$,]/g, '');
    const bankCategory = categoryCol >= 0 ? cols[categoryCol]?.trim() : undefined;
    if (!dateRaw || !description || !amountRaw) continue;
    const amount = parseFloat(amountRaw);
    if (isNaN(amount)) continue;
    const date = parseMDY(dateRaw);
    if (!date) continue;

    // Negative = charge (debit), positive = payment (credit)
    statementBalance += amount <= 0 ? Math.abs(amount) : -Math.abs(amount);
    results.push({ date, description, amount: Math.abs(amount), type: amount <= 0 ? 'debit' : 'credit', category: bankCategory });
  }

  // For CC: ending balance = total owed (sum of charges minus payments)
  return { transactions: results, endingBalance: Math.max(0, statementBalance) };
}

function parseMDY(s: string): string | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
}

function splitCSV(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}
