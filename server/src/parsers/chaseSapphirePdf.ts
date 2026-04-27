import { ParsedTransaction } from '../../../shared/types';

/**
 * Chase Sapphire Preferred — PDF statement
 * Transaction lines: MM/DD  MERCHANT NAME ...  $amount
 * Payments are negative credits. Purchases are positive debits.
 */
export function parseChaseSapphirePdf(text: string): { transactions: ParsedTransaction[]; endingBalance: number | null } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let newBalance: number | null = null;
  const results: ParsedTransaction[] = [];

  // Extract New Balance
  for (const line of lines) {
    const m = line.match(/new\s+balance[\s$]+([\d,]+\.?\d*)/i);
    if (m) { newBalance = parseFloat(m[1].replace(/,/g, '')); break; }
  }

  // Find ACCOUNT ACTIVITY section
  let inActivity = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/account\s+activity/i.test(line)) { inActivity = true; continue; }
    if (!inActivity) continue;

    // Stop at interest / fees section
    if (/interest\s+charged|fees\s+charged/i.test(line)) break;

    // Payment line: MM/DD ... -amount or "AUTOMATIC PAYMENT"
    const paymentMatch = line.match(/^(\d{2}\/\d{2})\s+(.+?)\s+([\d,]+\.\d{2})$/);
    if (paymentMatch) {
      const date = parseMD(paymentMatch[1]);
      const desc = paymentMatch[2].trim();
      const amount = parseFloat(paymentMatch[3].replace(/,/g, ''));
      if (!date || isNaN(amount)) continue;

      // Payments and credits
      if (/payment|credit|refund/i.test(desc)) {
        results.push({ date, description: desc, amount, type: 'credit' });
      } else {
        results.push({ date, description: desc, amount, type: 'debit' });
      }
    }
  }

  return { transactions: results, endingBalance: newBalance };
}

function parseMD(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const year = new Date().getFullYear();
  return `${year}-${m[1]}-${m[2]}`;
}
