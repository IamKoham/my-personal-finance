import { ParsedTransaction } from '../../../shared/types';
import { parseBofaCSV } from './bofa';
import { parseChaseCSV, parseChaseSapphireCSV } from './chase';
import { parseDiscoverCSV } from './discover';

export type BankFormat = 'bofa' | 'chase' | 'chase_sapphire' | 'discover' | 'unknown';

export interface ParseResult {
  transactions: ParsedTransaction[];
  bank: BankFormat;
  endingBalance: number | null;
  error?: string;
  sample?: string;
}

export function detectBank(text: string, filename: string): BankFormat {
  const fname      = filename.toLowerCase();
  const first600   = text.slice(0, 600).toLowerCase();

  // Find first non-empty line; normalize tabs → commas for header matching
  const firstLine  = (text.split('\n').find(l => l.trim().length > 0) || '').replace(/\t/g, ',');

  // Column header detection — content wins over filename
  if (/Transaction Date.*Post Date.*Description.*Category.*Type.*Amount/i.test(firstLine)) return 'chase_sapphire';
  if (/Trans\.?\s*Date.*Post Date.*Description.*Amount.*Category/i.test(firstLine))        return 'discover';
  if (/Details.*Posting Date.*Description.*Amount/i.test(firstLine))                       return 'chase';
  if (/^Date[,\t]Description[,\t]Amount/i.test(firstLine.trimStart()))                     return 'bofa';

  // Summary block content hints (BofA has "Ending balance as of")
  if (first600.includes('ending balance as of') || first600.includes('bank of america'))   return 'bofa';
  if (first600.includes('discover'))                                                        return 'discover';
  if (first600.includes('chase'))                                                           return 'chase';

  // Filename fallback only if content detection failed
  if (fname.includes('sapphire'))                                                           return 'chase_sapphire';
  if (fname.includes('discover'))                                                           return 'discover';
  if (fname.includes('bofa') || fname.includes('boa'))                                     return 'bofa';
  if (fname.includes('chase'))                                                              return 'chase';

  return 'unknown';
}

export function parseStatement(text: string, filename: string): ParseResult {
  const bank = detectBank(text, filename);
  try {
    switch (bank) {
      case 'bofa': {
        const { transactions, endingBalance } = parseBofaCSV(text);
        return { transactions, bank, endingBalance };
      }
      case 'chase': {
        const { transactions, endingBalance } = parseChaseCSV(text);
        return { transactions, bank, endingBalance };
      }
      case 'chase_sapphire': {
        const { transactions, endingBalance } = parseChaseSapphireCSV(text);
        return { transactions, bank, endingBalance };
      }
      case 'discover': {
        const { transactions, endingBalance } = parseDiscoverCSV(text);
        return { transactions, bank, endingBalance };
      }
      default:
        return {
          transactions: [], bank: 'unknown', endingBalance: null,
          error: 'Unknown bank format. Supported: BofA, Chase, Chase Sapphire, Discover CSV.',
          sample: text.split('\n').slice(0, 3).join('\n'),
        };
    }
  } catch (err: any) {
    return {
      transactions: [], bank, endingBalance: null,
      error: err.message,
      sample: text.split('\n').slice(0, 3).join('\n'),
    };
  }
}
