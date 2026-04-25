import { ParsedTransaction } from '../../../shared/types';

/**
 * Discover CC CSV
 * Columns: Trans. Date, Post Date, Description, Amount, Category
 * Amount: positive = charge (debit), negative = payment (credit)
 * Ending balance = sum of all positive amounts minus payments (statement balance owed)
 */
export function parseDiscoverCSV(text: string): { transactions: ParsedTransaction[]; endingBalance: number | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const headerIdx = lines.findIndex(l => /Trans\. Date.*Post Date.*Description.*Amount.*Category/i.test(l));
  if (headerIdx === -1) throw new Error('Discover: cannot find header row');

  const headers     = splitCSV(lines[headerIdx]).map(h => h.trim().toLowerCase());
  const dateCol     = headers.findIndex(h => h.includes('trans'));
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

    statementBalance += amount; // positive = charge, negative = payment
    results.push({ date, description, amount: Math.abs(amount), type: amount >= 0 ? 'debit' : 'credit', category: bankCategory });
  }

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
