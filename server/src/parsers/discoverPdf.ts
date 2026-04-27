import { ParsedTransaction } from '../../../shared/types';

/**
 * Discover It — PDF statement
 * Transaction lines under PURCHASES: MM/DD  MERCHANT NAME CITY STATE  Category  $amount
 * Payments under PAYMENTS AND CREDITS: MM/DD  DESCRIPTION  -$amount
 */
export function parseDiscoverPdf(text: string): { transactions: ParsedTransaction[]; endingBalance: number | null; creditLimit: number | null; ficoScore: number | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let newBalance: number | null = null;
  let creditLimit: number | null = null;
  let ficoScore: number | null = null;
  const results: ParsedTransaction[] = [];

  for (const line of lines) {
    // New Balance
    const nbMatch = line.match(/new\s*balance[:\s$]*([\d,]+\.\d{2})/i);
    if (nbMatch) newBalance = parseFloat(nbMatch[1].replace(/,/g, ''));

    // Credit limit
    const clMatch = line.match(/credit\s+line\s+([\d,]+)/i);
    if (clMatch) creditLimit = parseFloat(clMatch[1].replace(/,/g, ''));

    // FICO score
    const ficoMatch = line.match(/fico.*?score.*?(\d{3})/i);
    if (ficoMatch) ficoScore = parseInt(ficoMatch[1]);
  }

  let section: 'none' | 'payments' | 'purchases' = 'none';

  for (const line of lines) {
    if (/payments\s+and\s+credits/i.test(line)) { section = 'payments'; continue; }
    if (/^purchases$/i.test(line)) { section = 'purchases'; continue; }
    if (/fees\s+and\s+interest|interest\s+charge/i.test(line)) { section = 'none'; continue; }

    if (section === 'none') continue;

    // Transaction line starts with MM/DD
    const txMatch = line.match(/^(\d{2}\/\d{2})\s+(.+?)\s+([\d,]+\.\d{2})$/);
    if (!txMatch) continue;

    const date = parseMD(txMatch[1]);
    const desc = txMatch[2].trim();
    const amount = parseFloat(txMatch[3].replace(/,/g, ''));
    if (!date || isNaN(amount)) continue;

    // Skip Google Pay wallet lines and reward lines
    if (/google pay|ending in|cashback|rewards/i.test(desc)) continue;

    results.push({
      date,
      description: desc,
      amount,
      type: section === 'payments' ? 'credit' : 'debit',
    });
  }

  return { transactions: results, endingBalance: newBalance, creditLimit, ficoScore };
}

function parseMD(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const year = new Date().getFullYear();
  return `${year}-${m[1]}-${m[2]}`;
}
