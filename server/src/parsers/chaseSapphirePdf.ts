import { ParsedTransaction } from '../../../shared/types';

// Actual pdf-parse format (from diagnostic run):
// Section header "PURCHASES" on its own line (line ~343 in 418-line doc)
// Transaction: "03/03     UBER   *TRIP HELP.UBER.COM CA18.89"  (MM/DD + spaces + merchant + amount, NO $ prefix)
// Payment:     "03/26     AUTOMATIC PAYMENT - THANK YOU-40.00" (negative amount, no $)
// "PAYMENTS AND OTHER CREDITS" section header
// Balance line: "New Balance $X,XXX.XX" or "New Balance$X,XXX.XX"

export function parseChaseSapphirePdf(text: string): {
  transactions: ParsedTransaction[];
  endingBalance: number | null;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let newBalance: number | null = null;
  const results: ParsedTransaction[] = [];

  // Extract New Balance
  for (const line of lines) {
    const m = line.match(/new\s*balance[:\s$]*([\d,]+\.?\d*)/i);
    if (m) { newBalance = parseFloat(m[1].replace(/,/g, '')); break; }
  }

  // Section parsing
  let section: 'none' | 'payments' | 'purchases' = 'none';

  for (const line of lines) {
    // Section headers
    if (/^payments\s+and\s+other\s+credits$/i.test(line) || /^payments$/i.test(line)) {
      section = 'payments';
      continue;
    }
    if (/^purchases$/i.test(line)) {
      section = 'purchases';
      continue;
    }
    if (/^interest\s+charged|^fees\s+charged|^account\s+summary/i.test(line)) {
      section = 'none';
      continue;
    }

    if (section === 'none') continue;

    // Transaction format: MM/DD   MERCHANT NAME...   amount
    // amount may be negative (payments), no $ prefix
    // e.g. "03/03     UBER   *TRIP HELP.UBER.COM CA18.89"
    // e.g. "03/26     AUTOMATIC PAYMENT - THANK YOU-40.00"
    const txMatch = line.match(/^(\d{2}\/\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})$/);
    if (!txMatch) continue;

    const date = parseMD(txMatch[1]);
    const desc = txMatch[2].trim();
    const rawAmount = parseFloat(txMatch[3].replace(/,/g, ''));
    if (!date || isNaN(rawAmount)) continue;

    const amount = Math.abs(rawAmount);
    if (amount === 0) continue;

    // Negative amount = payment/credit; positive = debit
    const isPayment = rawAmount < 0 || /payment|credit|refund|return/i.test(desc);
    const type = isPayment ? 'credit' : 'debit';

    // Section overrides description-based detection
    const finalType = section === 'payments' ? 'credit' : (section === 'purchases' ? 'debit' : type);

    results.push({ date, description: desc, amount, type: finalType });
  }

  return { transactions: results, endingBalance: newBalance };
}

function parseMD(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const now = new Date();
  const month = parseInt(m[1]);
  const year = month > now.getMonth() + 1 + 1 ? now.getFullYear() - 1 : now.getFullYear();
  return `${year}-${m[1]}-${m[2]}`;
}
