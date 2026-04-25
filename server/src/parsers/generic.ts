import { ParsedTransaction } from '../../../shared/types';

export interface ColumnMapping {
  dateCol: number;
  descCol: number;
  amountCol: number;
  typeCol?: number;
}

export function parseGenericCSV(text: string, mapping: ColumnMapping): ParsedTransaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean).slice(1); // skip header
  const results: ParsedTransaction[] = [];

  for (const line of lines) {
    const cols = line.split(',');
    const dateRaw = cols[mapping.dateCol]?.trim();
    const description = cols[mapping.descCol]?.trim();
    const amountRaw = cols[mapping.amountCol]?.trim().replace(/[$,]/g, '');
    if (!dateRaw || !description || !amountRaw) continue;

    const amount = parseFloat(amountRaw);
    if (isNaN(amount)) continue;

    // Try to parse date in multiple formats
    const date = tryParseDate(dateRaw);
    if (!date) continue;

    results.push({
      date,
      description,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'credit' : 'debit',
    });
  }
  return results;
}

function tryParseDate(s: string): string | null {
  // MM/DD/YYYY
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  // YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  return null;
}
