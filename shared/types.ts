export type AccountType = 'checking' | 'savings' | 'credit' | 'investment';
export type TransactionType = 'debit' | 'credit';

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  account_name: string;
  account_type: AccountType;
  source_file?: string;
  upload_id?: number;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  institution?: string;
  credit_limit?: number;
  updated_at: string;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
}

export interface Upload {
  id: number;
  filename: string;
  account_name: string;
  upload_date: string;
  transaction_count: number;
  status: string;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
  by_category: Record<string, number>;
}

export interface Recommendation {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
  action?: string;
}

export interface EmergencyFundStatus {
  current: number;
  target: number;
  months_covered: number;
  target_months: number;
  percent: number;
  status: 'red' | 'yellow' | 'green';
  available_to_invest: number;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
}
