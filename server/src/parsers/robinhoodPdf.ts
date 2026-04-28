import { ParsedTransaction } from '../../../shared/types';

export interface RobinhoodPortfolio {
  portfolioValue: number | null;
  cashBalance: number | null;
  securitiesValue: number | null;
  holdings: Array<{ symbol: string; name: string; qty: number; price: number; marketValue: number; pctOfPortfolio: number }>;
  transactions: ParsedTransaction[];
}

// Actual pdf-parse format (verified from real statement):
// Account summary lines: label on one line, "$open$close" on next line
//   "Portfolio Value" → "$2,920.38$5,415.95"  (take second = closing)
//   "Net Account Balance" → "$849.49$2,349.49"  (take second = closing cash)
//
// Holdings header: "Securities Held in AccountSym/CusipAcct TypeQtyPriceMkt ValueEst. Dividend Yield% of Total Portfolio"
// Holdings: name on one line, "Estimated Yield: X%" on next, data line concatenated:
//   "NFLXMargin31.621411$96.15000$3,040.40$0.0056.14%"
//   Format: SYMBOL + "Margin" + qty + $price + $mktval + $dividend(2dp) + pct%
//
// Activity header: "DescriptionSymbolAcct TypeTransactionDateQtyPriceDebitCredit"
// Buy/Sell: name, CUSIP, type lines then data:
//   "NFLXMarginBuy03/02/20262.57918$96.93000$250.00"
// ACH: "ACH DepositMarginACH03/24/2026$2,500.00"

export function parseRobinhoodPdf(text: string): RobinhoodPortfolio {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let portfolioValue: number | null = null;
  let cashBalance: number | null = null;
  let securitiesValue: number | null = null;
  const holdings: RobinhoodPortfolio['holdings'] = [];
  const transactions: ParsedTransaction[] = [];

  // --- Account Summary: label on line N, "$X$Y" on line N+1 ---
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    if (/^Portfolio Value$/i.test(line)) {
      const vals = extractDollarValues(next);
      if (vals.length >= 2) portfolioValue = vals[1];
      else if (vals.length === 1) portfolioValue = vals[0];
    }
    if (/^Net Account Balance$/i.test(line)) {
      const vals = extractDollarValues(next);
      if (vals.length >= 2) cashBalance = vals[1];
      else if (vals.length === 1) cashBalance = vals[0];
    }
    if (/^Total Securities$/i.test(line)) {
      const vals = extractDollarValues(next);
      if (vals.length >= 2) securitiesValue = vals[1];
      else if (vals.length === 1) securitiesValue = vals[0];
    }
    // Also catch inline format: "Brokerage Cash Balance$2,349.4943.38%"
    if (/^Brokerage Cash Balance/i.test(line)) {
      const m = line.match(/Brokerage Cash Balance\$([\d,]+\.\d{2})/);
      if (m) cashBalance = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  // --- Holdings ---
  // Data line: SYMBOL + Margin + qty + $price + $mktval + $0.00(dividend, exactly 2dp) + pct%
  // e.g. "NFLXMargin31.621411$96.15000$3,040.40$0.0056.14%"
  const holdingRegex = /^([A-Z]{1,6})Margin([\d.]+)\$([\d,.]+)\$([\d,.]+)\$(\d+\.\d{2})([\d.]+)%/;
  let pendingName = '';

  for (const line of lines) {
    if (holdingRegex.test(line)) {
      const m = line.match(holdingRegex)!;
      holdings.push({
        name: pendingName || m[1],
        symbol: m[1],
        qty: parseFloat(m[2]),
        price: parseFloat(m[3].replace(/,/g, '')),
        marketValue: parseFloat(m[4].replace(/,/g, '')),
        pctOfPortfolio: parseFloat(m[6]),
      });
      pendingName = '';
    } else if (/^[A-Z][a-z]/.test(line) && !/^(Page|Robinhood|Estimated|CUSIP|Securities|Brokerage|Total|Account|Portfolio|Income|This|The|If|Short|Interest|Opening|Closing|Margin)/i.test(line)) {
      // Likely a stock name (starts with capital, not a known header)
      pendingName = line;
    } else {
      // Reset pending name on non-name lines (yield lines, etc.)
      if (!/^Estimated Yield/i.test(line)) pendingName = '';
    }
  }

  // --- Transactions ---
  // Buy/Sell: "NFLXMarginBuy03/02/20262.57918$96.93000$250.00"
  const buyRegex = /^([A-Z]{1,6})Margin(Buy|Sell)(\d{2}\/\d{2}\/\d{4})([\d.]+)\$([\d.]+)\$([\d,.]+)$/i;
  // ACH: "ACH DepositMarginACH03/24/2026$2,500.00"
  const achRegex = /^ACH DepositMarginACH(\d{2}\/\d{2}\/\d{4})\$([\d,.]+)$/i;

  for (const line of lines) {
    const buy = line.match(buyRegex);
    if (buy) {
      const date = parseMDY(buy[3]);
      const amount = parseFloat(buy[6].replace(/,/g, ''));
      if (date && !isNaN(amount)) {
        const action = buy[2].toLowerCase();
        transactions.push({
          date,
          description: `${action === 'buy' ? 'Buy' : 'Sell'} ${buy[1]}`,
          amount,
          type: action === 'sell' ? 'credit' : 'debit',
          category: 'Investments',
        });
      }
      continue;
    }

    const ach = line.match(achRegex);
    if (ach) {
      const date = parseMDY(ach[1]);
      const amount = parseFloat(ach[2].replace(/,/g, ''));
      if (date && !isNaN(amount)) {
        transactions.push({ date, description: 'ACH Deposit', amount, type: 'credit', category: 'Income' });
      }
    }
  }

  return { portfolioValue, cashBalance, securitiesValue, holdings, transactions };
}

function extractDollarValues(text: string): number[] {
  return [...text.matchAll(/\$([\d,]+\.\d{2})/g)].map(m => parseFloat(m[1].replace(/,/g, '')));
}

function parseMDY(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[1]}-${m[2]}`;
}
