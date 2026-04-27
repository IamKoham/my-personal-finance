export const SCHEMA = `
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  source_file TEXT,
  upload_id INTEGER,
  hash TEXT UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  balance REAL DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  institution TEXT,
  fico_score INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0,
  target_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  account_name TEXT NOT NULL,
  upload_date TEXT DEFAULT (datetime('now')),
  transaction_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success'
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Investment holdings (Robinhood, Fidelity, Etrade positions)
CREATE TABLE IF NOT EXISTS investment_holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT,
  qty REAL DEFAULT 0,
  price REAL DEFAULT 0,
  market_value REAL DEFAULT 0,
  pct_of_portfolio REAL DEFAULT 0,
  holding_type TEXT DEFAULT 'stock', -- 'stock'|'etf'|'fund'|'rsu'|'espp'|'cash'
  upload_id INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ESPP lots (from Etrade)
CREATE TABLE IF NOT EXISTS espp_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  purchase_date TEXT NOT NULL,
  purchase_price REAL NOT NULL,
  purchased_qty REAL DEFAULT 0,
  net_shares REAL DEFAULT 0,
  sellable_qty REAL DEFAULT 0,
  market_value REAL DEFAULT 0,
  expected_gain_loss REAL DEFAULT 0,
  discount_pct REAL DEFAULT 0,
  cost_basis_per_share REAL DEFAULT 0,
  taxable_gain_per_share REAL DEFAULT 0,
  tax_status TEXT,
  first_sellable_date TEXT,
  upload_id INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- RSU grants (from Etrade)
CREATE TABLE IF NOT EXISTS rsu_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  grant_date TEXT NOT NULL,
  granted_qty REAL DEFAULT 0,
  vested_qty REAL DEFAULT 0,
  unvested_qty REAL DEFAULT 0,
  sellable_qty REAL DEFAULT 0,
  market_value REAL DEFAULT 0,
  vest_date TEXT,
  total_taxes_paid REAL DEFAULT 0,
  effective_tax_rate REAL DEFAULT 0,
  taxable_gain REAL DEFAULT 0,
  cost_basis_per_share REAL DEFAULT 0,
  upload_id INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Fidelity 401k snapshots
CREATE TABLE IF NOT EXISTS fidelity_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_name TEXT,
  ending_balance REAL DEFAULT 0,
  vested_balance REAL DEFAULT 0,
  employee_contributions REAL DEFAULT 0,
  employer_contributions REAL DEFAULT 0,
  change_in_market_value REAL DEFAULT 0,
  rate_of_return REAL DEFAULT 0,
  funds_json TEXT,
  upload_id INTEGER,
  statement_date TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Card rewards rates
CREATE TABLE IF NOT EXISTS card_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_name TEXT NOT NULL,
  category TEXT NOT NULL,
  earn_rate REAL NOT NULL,
  earn_type TEXT DEFAULT 'pct', -- 'pct' | 'points'
  notes TEXT,
  quarter INTEGER, -- 1-4, NULL means applies all year
  year INTEGER     -- NULL means applies all years
);

INSERT OR IGNORE INTO settings VALUES ('emergency_fund_months', '6');
INSERT OR IGNORE INTO settings VALUES ('monthly_income_estimate', '0');
INSERT OR IGNORE INTO settings VALUES ('401k_annual_limit', '23500');
INSERT OR IGNORE INTO settings VALUES ('discover_5pct_category_q1', 'Grocery stores, drugstores');
INSERT OR IGNORE INTO settings VALUES ('discover_5pct_category_q2', 'Gas stations, EV charging, home improvement');
INSERT OR IGNORE INTO settings VALUES ('discover_5pct_category_q3', 'Restaurants, PayPal');
INSERT OR IGNORE INTO settings VALUES ('discover_5pct_category_q4', 'Amazon, digital wallets, Target');
`;

export const CARD_REWARDS_SEED = `
INSERT OR IGNORE INTO card_rewards (card_name, category, earn_rate, earn_type, notes) VALUES
  ('Chase Sapphire Preferred', 'Dining', 3.0, 'points', 'Restaurants, delivery, takeout'),
  ('Chase Sapphire Preferred', 'Online Groceries', 3.0, 'points', 'Excludes Target, Walmart, wholesale'),
  ('Chase Sapphire Preferred', 'Streaming', 3.0, 'points', 'Select streaming services'),
  ('Chase Sapphire Preferred', 'Lyft', 3.0, 'points', NULL),
  ('Chase Sapphire Preferred', 'Travel', 2.0, 'points', 'Worldwide travel'),
  ('Chase Sapphire Preferred', 'Chase Travel Portal', 5.0, 'points', 'Booked through Chase Travel'),
  ('Chase Sapphire Preferred', 'Other', 1.0, 'points', 'All other purchases'),
  ('Discover It', 'Rotating Q1', 5.0, 'pct', 'Grocery stores, drugstores'),
  ('Discover It', 'Rotating Q2', 5.0, 'pct', 'Gas stations, EV charging, home improvement'),
  ('Discover It', 'Rotating Q3', 5.0, 'pct', 'Restaurants, PayPal'),
  ('Discover It', 'Rotating Q4', 5.0, 'pct', 'Amazon, digital wallets, Target'),
  ('Discover It', 'Other', 1.0, 'pct', 'All other purchases');
`;
