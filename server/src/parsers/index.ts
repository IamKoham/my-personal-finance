import { ParsedTransaction } from '../../../shared/types';
import { parseBofaCSV } from './bofa';
import { parseChaseCSV, parseChaseSapphireCSV } from './chase';
import { parseDiscoverCSV } from './discover';
import { parseChaseSapphirePdf } from './chaseSapphirePdf';
import { parseDiscoverPdf } from './discoverPdf';
import { parseRobinhoodPdf } from './robinhoodPdf';
import { parseFidelityPdf } from './fidelityPdf';
import { parseEtradeXlsx } from './etrade';

export type BankFormat =
  | 'bofa' | 'chase' | 'chase_sapphire' | 'discover'
  | 'chase_sapphire_pdf' | 'discover_pdf'
  | 'robinhood_pdf' | 'fidelity_pdf' | 'etrade_xlsx'
  | 'unknown';

export interface ParseResult {
  transactions: ParsedTransaction[];
  bank: BankFormat;
  endingBalance: number | null;
  error?: string;
  sample?: string;
  // investment-specific extras passed through as JSON in a side-channel field
  meta?: any;
}

function isXlsx(text: string): boolean {
  try { const p = JSON.parse(text); return p.__xlsx === true; } catch { return false; }
}

export function detectBank(text: string, filename: string): BankFormat {
  const fname    = filename.toLowerCase();
  const ext      = fname.split('.').pop() || '';

  // XLSX — Etrade
  if (isXlsx(text)) return 'etrade_xlsx';

  // PDF formats — detect by content keywords
  if (ext === 'pdf') {
    const sample = text.slice(0, 800).toLowerCase();
    if (sample.includes('robinhood')) return 'robinhood_pdf';
    if (sample.includes('fidelity') || sample.includes('netbenefits') || sample.includes('401(k)')) return 'fidelity_pdf';
    if (sample.includes('discover it') || sample.includes('discover card')) return 'discover_pdf';
    if (sample.includes('sapphire') || sample.includes('ultimate rewards') || sample.includes('chase')) return 'chase_sapphire_pdf';
  }

  // CSV formats — detect by column headers
  const firstLine = (text.split('\n').find(l => l.trim().length > 0) || '').replace(/\t/g, ',');
  if (/Transaction Date.*Post Date.*Description.*Category.*Type.*Amount/i.test(firstLine)) return 'chase_sapphire';
  if (/Trans\.?\s*Date.*Post Date.*Description.*Amount.*Category/i.test(firstLine))        return 'discover';
  if (/Details.*Posting Date.*Description.*Amount/i.test(firstLine))                       return 'chase';
  if (/^Date[,\t]Description[,\t]Amount/i.test(firstLine.trimStart()))                     return 'bofa';

  // Content hints
  const first600 = text.slice(0, 600).toLowerCase();
  if (first600.includes('ending balance as of') || first600.includes('bank of america')) return 'bofa';
  if (first600.includes('discover'))   return 'discover';
  if (first600.includes('chase'))      return 'chase';

  // Filename fallback
  if (fname.includes('sapphire'))      return 'chase_sapphire';
  if (fname.includes('discover'))      return 'discover';
  if (fname.includes('robinhood'))     return 'robinhood_pdf';
  if (fname.includes('fidelity'))      return 'fidelity_pdf';
  if (fname.includes('etrade'))        return 'etrade_xlsx';
  if (fname.includes('bofa') || fname.includes('boa')) return 'bofa';
  if (fname.includes('chase'))         return 'chase';

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
      case 'chase_sapphire_pdf': {
        const { transactions, endingBalance } = parseChaseSapphirePdf(text);
        return { transactions, bank, endingBalance };
      }
      case 'discover_pdf': {
        const { transactions, endingBalance, creditLimit, ficoScore } = parseDiscoverPdf(text);
        return { transactions, bank, endingBalance, meta: { creditLimit, ficoScore } };
      }
      case 'robinhood_pdf': {
        const result = parseRobinhoodPdf(text);
        return {
          transactions: result.transactions,
          bank,
          endingBalance: result.portfolioValue,
          meta: { holdings: result.holdings, cashBalance: result.cashBalance, securitiesValue: result.securitiesValue },
        };
      }
      case 'fidelity_pdf': {
        const result = parseFidelityPdf(text);
        return {
          transactions: result.transactions,
          bank,
          endingBalance: result.endingBalance,
          meta: {
            endingBalance: result.endingBalance,
            planName: result.planName,
            vestedBalance: result.vestedBalance,
            employeeContributions: result.employeeContributions,
            employerContributions: result.employerContributions,
            changeInMarketValue: result.changeInMarketValue,
            rateOfReturn: result.rateOfReturn,
            funds: result.funds,
          },
        };
      }
      case 'etrade_xlsx': {
        const result = parseEtradeXlsx(text);
        return {
          transactions: result.transactions,
          bank,
          endingBalance: result.totalEsppValue + result.totalRsuValue,
          meta: { esppLots: result.esppLots, rsuGrants: result.rsuGrants },
        };
      }
      default:
        return {
          transactions: [], bank: 'unknown', endingBalance: null,
          error: 'Unknown format. Supported: BofA, Chase, Chase Sapphire, Discover (CSV/PDF), Robinhood PDF, Fidelity PDF, Etrade XLSX.',
          sample: text.split('\n').slice(0, 3).join('\n'),
        };
    }
  } catch (err: any) {
    return { transactions: [], bank, endingBalance: null, error: err.message, sample: text.split('\n').slice(0, 3).join('\n') };
  }
}
