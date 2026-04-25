import crypto from 'crypto';

export interface TxForHash {
  date: string;
  description: string;
  amount: number;
}

export function hashTransaction(t: TxForHash, accountName: string): string {
  const raw = `${t.date}|${t.description.trim().toLowerCase()}|${t.amount.toFixed(2)}|${accountName.toLowerCase()}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
