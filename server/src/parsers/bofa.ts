import { ParsedTransaction } from '../../../shared/types';

/**
 * BofA CSV (Checking & Savings)
 * Summary block rows 1-6:
 *   "Ending balance as of MM/DD/YYYY","1,234.00"
 * Data starts at row 7 header: Date, Description, Amount, Running Bal.
 */
export function parseBofaCSV(text: string): { transactions: ParsedTransaction[]; endingBalance: number | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract ending balance from summary block (before header row)
  let endingBalance: number | null = null;
  for (const line of lines) {
    const cols = splitCSV(line);
    if (cols[0]?.toLowerCase().includes('ending balance')) {
      const val = cols[2]?.replace(/[$,]/g, '').trim() || cols[1]?.replace(/[$,]/g, '').trim();
      const parsed = parseFloat(val || '');
      if (!isNaN(parsed)) { endingBalance = parsed; break; }
    }
  }

  // Find header row
  const headerIdx = lines.findIndex(l => /^Date,Description,Amount/i.test(l.replace(/\s/g, '')));
  if (headerIdx === -1) throw new Error('BofA: cannot find header row');

  const results: ParsedTransaction[] = [];
  for (const line of lines.slice(headerIdx + 1)) {
    const cols = splitCSV(line);
    if (cols.length < 3) continue;
    const dateRaw    = cols[0].trim();
    const description = cols[1].trim();
    const amountRaw  = cols[2].trim().replace(/[$,]/g, '');
    if (!dateRaw || !description || !amountRaw) continue;
    if (description.toLowerCase().includes('beginning balance')) continue;
    const amount = parseFloat(amountRaw);
    if (isNaN(amount)) continue;
    const date = parseMDY(dateRaw);
    if (!date) continue;
    results.push({ date, description, amount: Math.abs(amount), type: amount >= 0 ? 'credit' : 'debit' });
  }

  return { transactions: results, endingBalance };
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
