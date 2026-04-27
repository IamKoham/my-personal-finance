import { ParsedTransaction } from '../../../shared/types';

export interface FidelityStatement {
  planName: string | null;
  endingBalance: number | null;
  vestedBalance: number | null;
  employeeContributions: number | null;
  employerContributions: number | null;
  changeInMarketValue: number | null;
  beginningBalance: number | null;
  rateOfReturn: number | null;
  funds: Array<{ name: string; allocation: { stocks: number; bonds: number; shortTerm: number } }>;
  transactions: ParsedTransaction[];
}

/**
 * Fidelity NetBenefits 401k PDF statement
 */
export function parseFidelityPdf(text: string): FidelityStatement {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let planName: string | null = null;
  let endingBalance: number | null = null;
  let vestedBalance: number | null = null;
  let employeeContributions: number | null = null;
  let employerContributions: number | null = null;
  let changeInMarketValue: number | null = null;
  let beginningBalance: number | null = null;
  let rateOfReturn: number | null = null;
  const funds: FidelityStatement['funds'] = [];
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] || '';
    const combined = line + ' ' + next;

    if (/401\(k\)\s+plan/i.test(line) && !planName) planName = line.trim();

    if (/beginning\s+balance/i.test(line)) {
      const m = combined.match(/\$([\d,]+\.\d{2})/);
      if (m) beginningBalance = parseFloat(m[1].replace(/,/g, ''));
    }
    if (/ending\s+balance/i.test(line)) {
      const m = combined.match(/\$([\d,]+\.\d{2})/);
      if (m) endingBalance = parseFloat(m[1].replace(/,/g, ''));
    }
    if (/vested\s+balance/i.test(line)) {
      const m = combined.match(/\$([\d,]+\.\d{2})/);
      if (m) vestedBalance = parseFloat(m[1].replace(/,/g, ''));
    }
    if (/employee\s+contributions?/i.test(line)) {
      const m = combined.match(/\$([\d,]+\.\d{2})/);
      if (m) employeeContributions = parseFloat(m[1].replace(/,/g, ''));
    }
    if (/employer\s+contributions?/i.test(line)) {
      const m = combined.match(/\$([\d,]+\.\d{2})/);
      if (m) employerContributions = parseFloat(m[1].replace(/,/g, ''));
    }
    if (/change\s+in\s+market\s+value/i.test(line)) {
      const m = combined.match(/-?\$?([\d,]+\.\d{2})/);
      if (m) changeInMarketValue = combined.includes('-') ? -parseFloat(m[1].replace(/,/g, '')) : parseFloat(m[1].replace(/,/g, ''));
    }
    if (/personal\s+rate\s+of\s+return/i.test(line)) {
      const m = combined.match(/-?([\d.]+)%/);
      if (m) rateOfReturn = combined.includes('-') ? -parseFloat(m[1]) : parseFloat(m[1]);
    }

    // Fund allocation line: "Vanguard Target 2060 88% 9% 3%"
    const fundMatch = line.match(/^(.+?)\s+(\d+)%\s+(\d+)%\s+(\d+)%$/);
    if (fundMatch && !funds.find(f => f.name === fundMatch[1].trim())) {
      funds.push({
        name: fundMatch[1].trim(),
        allocation: { stocks: parseInt(fundMatch[2]), bonds: parseInt(fundMatch[3]), shortTerm: parseInt(fundMatch[4]) },
      });
    }
  }

  // Generate synthetic transactions for contributions
  const today = new Date().toISOString().slice(0, 10);
  if (employeeContributions && employeeContributions > 0) {
    transactions.push({ date: today, description: '401k Employee Contribution', amount: employeeContributions, type: 'debit' });
  }
  if (employerContributions && employerContributions > 0) {
    transactions.push({ date: today, description: '401k Employer Contribution', amount: employerContributions, type: 'credit' });
  }

  return { planName, endingBalance, vestedBalance, employeeContributions, employerContributions, changeInMarketValue, beginningBalance, rateOfReturn, funds, transactions };
}
