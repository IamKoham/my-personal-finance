import { ParsedTransaction } from '../../../shared/types';

// Actual pdf-parse format:
// Lines are concatenated: "03/22CAFFE D'ARTE CONCOURSE A SEATTLE WARestaurants$18.22"
// Section headers: "DATEPURCHASESMERCHANTCATEGORYAMOUNT", "DATEPAYMENTSANDCREDITSMERCHANTCATEGORYAMOUNT"
// Payments: "03/14AUTOMATIC STATEMENT CREDIT-$10.05", "04/08DIRECTPAY FULL BALANCE-$309.27"
// Category names embedded at end before $: Restaurants, Supermarkets, Services, Merchandise, Travel/Entertainment

const CATEGORIES = [
  'Restaurants', 'Supermarkets', 'Services', 'Merchandise',
  'Travel/Entertainment', 'Gas Stations', 'Home Improvement',
  'Drugstores', 'Entertainment', 'Education', 'Healthcare',
  'Automotive', 'Insurance', 'Utilities', 'Telecommunications',
];

export function parseDiscoverPdf(text: string): {
  transactions: ParsedTransaction[];
  endingBalance: number | null;
  creditLimit: number | null;
  ficoScore: number | null;
} {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let newBalance: number | null = null;
  let creditLimit: number | null = null;
  let ficoScore: number | null = null;
  const results: ParsedTransaction[] = [];

  // Pass 1: extract account meta — iterate all lines, last "New Balance" match wins
  // (avoids matching column headers that appear before the actual figure)
  for (const line of lines) {
    const nbm = line.match(/new\s*balance[:\s]*\$?([\d,]+\.\d{2})/i);
    if (nbm) newBalance = parseFloat(nbm[1].replace(/,/g, ''));
    if (!creditLimit) {
      const m = line.match(/credit\s+line\s+([\d,]+)/i);
      if (m) creditLimit = parseFloat(m[1].replace(/,/g, ''));
    }
    if (!ficoScore) {
      const m = line.match(/fico.*?(\d{3})/i);
      if (m) ficoScore = parseInt(m[1]);
    }
  }

  // Pass 2: parse transactions
  // Section detection on concatenated headers
  let section: 'none' | 'payments' | 'purchases' = 'none';

  for (const line of lines) {
    // Detect section headers (concatenated, case-insensitive)
    if (/DATEPAYMENTSANDCREDITS/i.test(line) || /payments\s+and\s+credits/i.test(line)) {
      section = 'payments';
      continue;
    }
    if (/DATEPURCHASES/i.test(line) || /^purchases$/i.test(line)) {
      section = 'purchases';
      continue;
    }
    if (/fees\s+charged|interest\s+charged/i.test(line)) {
      section = 'none';
      continue;
    }

    if (section === 'none') continue;

    // Payment line: MM/DD followed by description, ending with -$amount or -amount
    // e.g. "03/14AUTOMATIC STATEMENT CREDIT-$10.05" or "04/08DIRECTPAY FULL BALANCE-$309.27"
    const payMatch = line.match(/^(\d{2}\/\d{2})(.+?)-\$?([\d,]+\.\d{2})$/);
    if (payMatch && section === 'payments') {
      const date = parseMD(payMatch[1]);
      const desc = payMatch[2].trim();
      const amount = parseFloat(payMatch[3].replace(/,/g, ''));
      if (date && !isNaN(amount) && amount > 0) {
        // All payment-section items excluded from income/expense: DirectPay, cashback credits, statement credits
        results.push({ date, description: desc, amount, type: 'credit', category: 'CC Payment' } as any);
      }
      continue;
    }

    // Purchase line: MM/DD + merchant + optional category + $amount
    // e.g. "03/22CAFFE D'ARTE CONCOURSE A SEATTLE WARestaurants$18.22"
    const purchaseMatch = line.match(/^(\d{2}\/\d{2})(.+?)\$([\d,]+\.\d{2})$/);
    if (purchaseMatch && section === 'purchases') {
      const date = parseMD(purchaseMatch[1]);
      let desc = purchaseMatch[2].trim();
      const amount = parseFloat(purchaseMatch[3].replace(/,/g, ''));
      if (!date || isNaN(amount) || amount <= 0) continue;

      // Strip trailing category name if present
      for (const cat of CATEGORIES) {
        if (desc.endsWith(cat)) {
          desc = desc.slice(0, -cat.length).trim();
          break;
        }
      }

      // Skip wallet meta-lines
      if (/google pay|ending in|cashback bonus|rewards balance/i.test(desc)) continue;

      results.push({ date, description: desc, amount, type: 'debit' });
      continue;
    }
  }

  return { transactions: results, endingBalance: newBalance, creditLimit, ficoScore };
}

function parseMD(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const now = new Date();
  // If month is in the future assume prior year (statement period crossing year boundary)
  const month = parseInt(m[1]);
  const year = month > now.getMonth() + 1 + 1 ? now.getFullYear() - 1 : now.getFullYear();
  return `${year}-${m[1]}-${m[2]}`;
}
