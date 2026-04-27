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
  taxStatus: string; // 'Qualifying' | 'Disqualifying'
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

/**
 * Etrade ByBenefitType_expanded.xlsx
 * Two sheets: ESPP and Restricted Stock
 * Input: JSON.stringify({ __xlsx: true, sheets: { ESPP: [][], 'Restricted Stock': [][] } })
 */
export function parseEtradeXlsx(text: string): EtradeData {
  const esppLots: EsppLot[] = [];
  const rsuGrants: RsuGrant[] = [];
  const transactions: ParsedTransaction[] = [];

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { esppLots, rsuGrants, totalEsppValue: 0, totalRsuValue: 0, transactions };
  }

  if (!parsed.__xlsx) return { esppLots, rsuGrants, totalEsppValue: 0, totalRsuValue: 0, transactions };

  const sheets = parsed.sheets as Record<string, any[][]>;

  // --- ESPP Sheet ---
  const esppRows = sheets['ESPP'];
  if (esppRows && esppRows.length > 1) {
    const headers: string[] = (esppRows[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
    const col = (name: string) => headers.findIndex(h => h.includes(name.toLowerCase()));

    const symCol       = col('symbol');
    const purDateCol   = col('purchase date');
    const purPriceCol  = col('purchase price');
    const purQtyCol    = col('purchased qty');
    const netSharesCol = col('net shares');
    const sellQtyCol   = col('sellable qty');
    const mktValCol    = col('est. market value');
    const gainCol      = col('expected gain');
    const discCol      = col('discount percent');
    const cbCol        = col('cost basis (per share)');
    const tgCol        = col('taxable gain/loss (per share)');
    const taxStatCol   = col('tax status');
    const firstSellCol = col('first sellable');

    for (let i = 1; i < esppRows.length; i++) {
      const row = esppRows[i];
      if (!row || !row[symCol]) continue;
      const symbol = String(row[symCol] || '');
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
        taxStatus: String(row[taxStatCol] || 'Unknown'),
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

  // --- Restricted Stock Sheet ---
  const rsuRows = sheets['Restricted Stock'];
  if (rsuRows && rsuRows.length > 1) {
    const headers: string[] = (rsuRows[0] || []).map((h: any) => String(h || '').trim().toLowerCase());
    const col = (name: string) => headers.findIndex(h => h.includes(name.toLowerCase()));

    const symCol      = col('symbol');
    const grantDateCol = col('grant date');
    const grantedCol  = col('granted qty.');
    const vestedCol   = col('vested qty.');
    const unvestedCol = col('unvested qty.');
    const sellableCol = col('sellable qty.');
    const mktValCol   = col('est. market value');
    const vestDateCol = col('vest date');
    const taxPaidCol  = col('total taxes paid');
    const taxRateCol  = col('effective tax rate');
    const taxGainCol  = col('taxable gain');
    const cbCol       = col('cost basis (per share)');

    const seen = new Set<string>();
    for (let i = 1; i < rsuRows.length; i++) {
      const row = rsuRows[i];
      if (!row || !row[symCol]) continue;
      const symbol = String(row[symCol] || '');
      const grantDate = excelDateToISO(row[grantDateCol]);
      if (!symbol || !grantDate) continue;

      const key = `${symbol}-${grantDate}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const grant: RsuGrant = {
        symbol,
        grantDate,
        grantedQty: toNum(row[grantedCol]),
        vestedQty: toNum(row[vestedCol]),
        unvestedQty: toNum(row[unvestedCol]),
        sellableQty: toNum(row[sellableCol]),
        marketValue: toNum(row[mktValCol]),
        vestDate: vestDateCol >= 0 ? excelDateToISO(row[vestDateCol]) : null,
        totalTaxesPaid: toNum(row[taxPaidCol]),
        effectiveTaxRate: toNum(row[taxRateCol]),
        taxableGain: toNum(row[taxGainCol]),
        costBasisPerShare: toNum(row[cbCol]),
      };
      rsuGrants.push(grant);
    }
  }

  const totalEsppValue = esppLots.reduce((s, l) => s + l.marketValue, 0);
  const totalRsuValue = rsuGrants.reduce((s, g) => s + g.marketValue, 0);

  return { esppLots, rsuGrants, totalEsppValue, totalRsuValue, transactions };
}

function toNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseFloat(String(val).replace(/[$,%]/g, '').trim());
  return isNaN(n) ? 0 : n;
}

function excelDateToISO(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  // Already a date string MM/DD/YYYY or YYYY-MM-DD
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  // Excel serial number
  const num = parseFloat(s);
  if (!isNaN(num) && num > 1000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().slice(0, 10);
  }
  return null;
}
