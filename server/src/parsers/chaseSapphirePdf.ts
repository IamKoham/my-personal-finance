import { ParsedTransaction } from '../../../shared/types';

// Actual pdf-parse format (verified from real statement):
// Section header "PURCHASES" on its own line (line ~343)
// Transaction lines: "03/03     UBER   *TRIP HELP.UBER.COM CA18.89"  (amount appended to last word, NO space, NO $)
// Payment lines:     "03/26     AUTOMATIC PAYMENT - THANK YOU-40.00" (negative, appended to last word)
// Interest lines:    "04/01     PURCHASE INTEREST CHARGE18.93"        (skip these)
// Payments section:  "PAYMENTS AND OTHER CREDITS" (line ~397)
// Balance lines:     "Payment, Credits-$40.00", "Purchases+$1,074.56"

export function parseChaseSapphirePdf(text: string): {
  transactions: ParsedTransaction[];
  endingBalance: number | null;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let newBalance: number | null = null;
  const results: ParsedTransaction[] = [];

  // Extract balance from summary line: "Credit Access Line$24,500" and "Available Credit$22,796"
  // New balance = credit access - available credit
  let creditLine: number | null = null;
  let availableCredit: number | null = null;

  for (const line of lines) {
    const clMatch = line.match(/^Credit Access Line\$([\d,]+)/i);
    if (clMatch) creditLine = parseFloat(clMatch[1].replace(/,/g, ''));
    const acMatch = line.match(/^Available Credit\$([\d,]+)/i);
    if (acMatch) availableCredit = parseFloat(acMatch[1].replace(/,/g, ''));
    // Also try explicit "New Balance" pattern
    const nbMatch = line.match(/new\s*balance[:\s$]*([\d,]+\.?\d*)/i);
    if (nbMatch) newBalance = parseFloat(nbMatch[1].replace(/,/g, ''));
  }
  // Derive balance from credit line - available
  if (newBalance === null && creditLine !== null && availableCredit !== null) {
    newBalance = creditLine - availableCredit;
  }

  // Parse transactions — no section tracking, use amount sign
  // Pattern: MM/DD + spaces + description + amount (amount may be negative, NO $ prefix, appended to last word)
  const txRegex = /^(\d{2}\/\d{2})\s+(.+?)(-?[\d,]+\.\d{2})$/;

  for (const line of lines) {
    const m = line.match(txRegex);
    if (!m) continue;

    const date = parseMD(m[1]);
    const desc = m[2].trim();
    const rawAmount = parseFloat(m[3].replace(/,/g, ''));
    if (!date || isNaN(rawAmount) || rawAmount === 0) continue;

    // Skip interest charges
    if (/interest charge|interest charged/i.test(desc)) continue;

    const amount = Math.abs(rawAmount);
    // Negative amount = payment/credit
    const isCredit = rawAmount < 0 || /automatic payment|payment - thank you/i.test(desc);

    results.push({ date, description: desc, amount, type: isCredit ? 'credit' : 'debit' });
  }

  return { transactions: results, endingBalance: newBalance };
}

function parseMD(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const now = new Date();
  const month = parseInt(m[1]);
  const year = month > now.getMonth() + 2 ? now.getFullYear() - 1 : now.getFullYear();
  return `${year}-${m[1]}-${m[2]}`;
}
