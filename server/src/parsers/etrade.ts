import { ParsedTransaction } from '../../../shared/types';

export interface EsppLot {
  symbol: string;
  purchaseDate: string;
  purchasePrice: number;
  purchasedQty: number;
  netShares: number;
  sellableQty: number;
  marketValue: number;
  expectedGainLoss: number;
  discountPct: number;
  costBasisPerShare: number;
  taxableGainPerShare: number;
  taxStatus: string;
  firstSellableDate: string | null;
}

export interface RsuGrant {
  symbol: string;
  grantDate: string;
  grantedQty: number;
  vestedQty: number;
  unvestedQty: number;
  sellableQty: number;
  marketValue: number;
  vestDate: string | null;
  totalTaxesPaid: number;
  effectiveTaxRate: number;
  taxableGain: number;
  costBasisPerShare: number;
}

export interface EtradeData {
  esppLots: EsppLot[];
  rsuGrants: RsuGrant[];
  totalEsppValue: number;
  totalRsuValue: number;
  transactions: ParsedTransaction[];
}

export function parseEtradeXlsx(text: string): EtradeData {
  const esppLots: EsppLot[] = [];
  const rsuGrants: RsuGrant[] = [];
  const transactions: ParsedTransaction[] = [];

  let parsed: any;
  try { parsed = JSON.parse(text); } catch {
    return { esppLots, rsuGrants, totalEsppValue: 0, totalRsuValue: 0, transactions };
  }
  if (!parsed.__xlsx) return { esppLots, rsuGrants, totalEsppValue: 0, totalRsuValue: 0, transactions };

  const sheets = parsed.sheets as Record<string, any[][]>;
  const sheetNames = Object.keys(sheets);

  // Find sheets by case-insensitive partial match
  const esppSheetName = sheetNames.find(n => n.toLowerCase().includes('espp'));
  const rsuSheetName  = sheetNames.find(n => n.toLowerCase().includes('restricted') || n.toLowerCase().includes('rsu'));

  // --- ESPP Sheet ---
  const esppRows = esppSheetName ? sheets[esppSheetName] : null;
  if (esppRows && esppRows.length > 1) {
    const headers: string[] = (esppRows[0] || []).map((h: any) =>
      String(h || '').trim().toLowerCase().replace(/[:\s]+$/, '') // strip trailing colon/space
    );

    // Precise column finder: exact → startsWith → includes (avoids "grant date" matching "original grant date")
    const col = (patterns: string[]): number => {
      for (const p of patterns) {
        const lp = p.toLowerCase();
        let idx = headers.findIndex(h => h === lp);
        if (idx >= 0) return idx;
        idx = headers.findIndex(h => h.startsWith(lp));
        if (idx >= 0) return idx;
        idx = headers.findIndex(h => h.includes(lp));
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const symCol       = col(['symbol']);
    const purDateCol   = col(['purchase date']);
    const purPriceCol  = col(['purchase price']);
    const purQtyCol    = col(['purchased qty']);
    const netSharesCol = col(['net shares']);
    const sellQtyCol   = col(['sellable qty']);
    const mktValCol    = col(['est. market value', 'market value']);
    const gainCol      = col(['expected gain/loss', 'expected gain']);
    const discCol      = col(['discount percent']);
    const cbCol        = col(['est. cost basis (per share)', 'cost basis (per share)']);
    const tgCol        = col(['est. taxable gain/loss (per share)', 'taxable gain/loss (per share)']);
    const taxStatCol   = col(['tax status']);
    const firstSellCol = col(['first sellable date', 'first sellable']);

    for (let i = 1; i < esppRows.length; i++) {
      const row = esppRows[i];
      if (!row || symCol < 0 || !row[symCol]) continue;
      const symbol = String(row[symCol] || '').trim();
      const purchaseDate = excelDateToISO(row[purDateCol]);
      const purchasePrice = toNum(row[purPriceCol]);
      if (!symbol || !purchaseDate || isNaN(purchasePrice)) continue;

      const lot: EsppLot = {
        symbol,
        purchaseDate,
        purchasePrice,
        purchasedQty: toNum(row[purQtyCol]),
        netShares: toNum(row[netSharesCol]),
        sellableQty: toNum(row[sellQtyCol]),
        marketValue: toNum(row[mktValCol]),
        expectedGainLoss: toNum(row[gainCol]),
        discountPct: toNum(row[discCol]),
        costBasisPerShare: toNum(row[cbCol]),
        taxableGainPerShare: toNum(row[tgCol]),
        taxStatus: String(row[taxStatCol] || 'Unknown').trim(),
        firstSellableDate: firstSellCol >= 0 ? excelDateToISO(row[firstSellCol]) : null,
      };
      esppLots.push(lot);

      if (lot.marketValue > 0) {
        transactions.push({
          date: purchaseDate,
          description: `ESPP Purchase ${symbol}`,
          amount: lot.marketValue,
          type: 'debit',
          category: 'Investments',
        });
      }
    }
  }

  // --- RSU Sheet ---
  const rsuRows = rsuSheetName ? sheets[rsuSheetName] : null;
  if (rsuRows && rsuRows.length > 1) {
    const headers: string[] = (rsuRows[0] || []).map((h: any) =>
      String(h || '').trim().toLowerCase().replace(/[:\s]+$/, '')
    );

    const col = (patterns: string[]): number => {
      for (const p of patterns) {
        const lp = p.toLowerCase();
        // Exact match first
        let idx = headers.findIndex(h => h === lp);
        if (idx >= 0) return idx;
        // startsWith (avoids "original grant date" matching "grant date")
        idx = headers.findIndex(h => h.startsWith(lp) && (h.length === lp.length || h[lp.length] === ' ' || h[lp.length] === '.'));
        if (idx >= 0) return idx;
        // includes fallback
        idx = headers.findIndex(h => h.includes(lp));
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const symCol       = col(['symbol']);
    const grantDateCol = col(['grant date']);       // must NOT match "original grant date"
    const grantedCol   = col(['granted qty']);
    const vestedCol    = col(['vested qty']);
    const unvestedCol  = col(['unvested qty']);
    const sellableCol  = col(['sellable qty']);
    const mktValCol    = col(['est. market value', 'market value']);
    const vestDateCol  = col(['vest date']);
    const taxPaidCol   = col(['total taxes paid']);
    const taxRateCol   = col(['effective tax rate']);
    const taxGainCol   = col(['taxable gain']);
    const cbCol        = col(['est. cost basis (per share)', 'cost basis (per share)']);

    const seen = new Set<string>();
    for (let i = 1; i < rsuRows.length; i++) {
      const row = rsuRows[i];
      if (!row || symCol < 0 || !row[symCol]) continue;
      const symbol = String(row[symCol] || '').trim();
      if (!symbol) continue;

      const grantDate = grantDateCol >= 0 ? excelDateToISO(row[grantDateCol]) : null;
      // Use vest date as fallback key if no grant date
      const vestDate = vestDateCol >= 0 ? excelDateToISO(row[vestDateCol]) : null;
      const keyDate = grantDate || vestDate;
      if (!keyDate) continue;

      const key = `${symbol}-${keyDate}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const grant: RsuGrant = {
        symbol,
        grantDate: grantDate || keyDate,
        grantedQty: toNum(row[grantedCol]),
        vestedQty: toNum(row[vestedCol]),
        unvestedQty: toNum(row[unvestedCol]),
        sellableQty: toNum(row[sellableCol]),
        marketValue: toNum(row[mktValCol]),
        vestDate,
        totalTaxesPaid: toNum(row[taxPaidCol]),
        effectiveTaxRate: toNum(row[taxRateCol]),
        taxableGain: toNum(row[taxGainCol]),
        costBasisPerShare: toNum(row[cbCol]),
      };
      rsuGrants.push(grant);
    }
  }

  const totalEsppValue = esppLots.reduce((s, l) => s + l.marketValue, 0);
  const totalRsuValue  = rsuGrants.reduce((s, g) => s + g.marketValue, 0);

  return { esppLots, rsuGrants, totalEsppValue, totalRsuValue, transactions };
}

function toNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseFloat(String(val).replace(/[$,%]/g, '').trim());
  return isNaN(n) ? 0 : n;
}

const MONTH_MAP: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

function excelDateToISO(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  // DD-MMM-YYYY (e.g. "15-JUN-2025") — Etrade's actual format
  let m = s.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
  if (m) {
    const month = MONTH_MAP[m[2].toUpperCase()];
    if (month) return `${m[3]}-${month}-${m[1].padStart(2, '0')}`;
  }
  // MM/DD/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  // YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  // Excel serial date
  const num = parseFloat(s);
  if (!isNaN(num) && num > 1000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().slice(0, 10);
  }
  return null;
}
