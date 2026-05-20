// Demo mode mock data — used when VITE_DEMO_MODE=true (GitHub Pages build)

export const mockAccounts = [
  { id: 1, name: 'Chase Checking',      type: 'checking',   balance: 4218.52,  institution: 'Chase',     updated_at: '2026-05-01', credit_limit: 0,     due_day: null },
  { id: 2, name: 'Chase Savings',       type: 'savings',    balance: 8540.00,  institution: 'Chase',     updated_at: '2026-05-01', credit_limit: 0,     due_day: null },
  { id: 3, name: 'BofA High-Yield',     type: 'savings',    balance: 15200.00, institution: 'BofA',      updated_at: '2026-05-01', credit_limit: 0,     due_day: null },
  { id: 4, name: 'Discover It',         type: 'credit',     balance: 1243.78,  institution: 'Discover',  updated_at: '2026-05-01', credit_limit: 8000,  due_day: 15  },
  { id: 5, name: 'Chase Sapphire',      type: 'credit',     balance: 892.40,   institution: 'Chase',     updated_at: '2026-05-01', credit_limit: 12000, due_day: 22  },
  { id: 6, name: 'Robinhood',           type: 'investment', balance: 12485.60, institution: 'Robinhood', updated_at: '2026-05-01', credit_limit: 0,     due_day: null },
  { id: 7, name: 'Fidelity 401k',       type: 'investment', balance: 47320.00, institution: 'Fidelity',  updated_at: '2026-05-01', credit_limit: 0,     due_day: null },
  { id: 8, name: 'E*Trade ESPP',        type: 'investment', balance: 8210.00,  institution: 'E*Trade',   updated_at: '2026-05-01', credit_limit: 0,     due_day: null },
];

export const mockGoals = [
  { id: 1, name: 'Emergency Fund',    target_amount: 18000, current_amount: 12400, target_date: '2026-12-31' },
  { id: 2, name: 'House Down Payment',target_amount: 60000, current_amount: 23500, target_date: '2028-06-01' },
  { id: 3, name: 'Japan Vacation',    target_amount: 4500,  current_amount: 1800,  target_date: '2026-10-01' },
  { id: 4, name: 'New MacBook Pro',   target_amount: 3200,  current_amount: 3200,  target_date: null         },
];

export const mockEmergencyFund = {
  current: 12400,
  target: 18000,
  months_covered: 2.1,
  target_months: 3,
  percent: 68.9,
  status: 'yellow',
  available_to_invest: 0,
};

export const mockRecommendations = [
  { id: 'R1',  severity: 'warning',  title: 'Build emergency fund first',           detail: '69% funded. Need $5,600 more.',                             action: 'Save before investing.'         },
  { id: 'R3',  severity: 'info',     title: 'Savings rate 22% — great job!',        detail: 'You\'re above the 20% target. Keep it up!'                                                           },
  { id: 'R7',  severity: 'info',     title: 'Statements not updated in 18 days',    detail: 'Upload recent statements.',                                 action: 'Go to Uploads.'                 },
  { id: 'R8_1',severity: 'info',     title: 'Japan Vacation: save $508/month',      detail: '5 months remaining. $2,700 left.'                                                                    },
  { id: 'R9',  severity: 'warning',  title: 'Check your 401K contribution %',       detail: 'If below 6%, you may be missing employer match.',           action: 'Log in to your 401K portal.'    },
  { id: 'R10_Discover It', severity: 'warning', title: 'Discover It: payment due May 15', detail: 'Balance $1,243.78 · Min payment ~$24.88 · 14 days away'                                        },
  { id: 'R10_Chase Sapphire', severity: 'info', title: 'Chase Sapphire: payment due May 22', detail: 'Balance $892.40 · Min payment ~$25.00 · 21 days away'                                       },
];

export const mockUploads = [
  { id: 1, filename: 'chase_checking_apr2026.csv',   account_name: 'Chase Checking',  upload_date: '2026-04-30', transaction_count: 38, status: 'success' },
  { id: 2, filename: 'discover_mar2026.pdf',          account_name: 'Discover It',     upload_date: '2026-04-01', transaction_count: 24, status: 'success' },
  { id: 3, filename: 'bofa_savings_mar2026.csv',      account_name: 'BofA High-Yield', upload_date: '2026-03-28', transaction_count: 6,  status: 'success' },
  { id: 4, filename: 'chase_sapphire_feb2026.pdf',    account_name: 'Chase Sapphire',  upload_date: '2026-03-05', transaction_count: 19, status: 'success' },
];

export const mockSettings: Record<string, string> = {
  emergency_fund_months: '3',
  monthly_income_estimate: '7000',
};

// Monthly summary for last 6 months
export const mockSummary = [
  { month: '2025-11', income: 7040, expenses: 5620, net: 1420, by_category: { Rent: 2100, Groceries: 380, Restaurants: 290, Transport: 140, Subscriptions: 65, Utilities: 120, Health: 80,  Shopping: 310, Travel: 0,    Gasoline: 85, Misc: 50 } },
  { month: '2025-12', income: 7040, expenses: 6210, net: 830,  by_category: { Rent: 2100, Groceries: 420, Restaurants: 480, Transport: 160, Subscriptions: 65, Utilities: 130, Health: 0,   Shopping: 890, Travel: 320,  Gasoline: 90, Misc: 155} },
  { month: '2026-01', income: 7040, expenses: 5480, net: 1560, by_category: { Rent: 2100, Groceries: 395, Restaurants: 210, Transport: 130, Subscriptions: 65, Utilities: 145, Health: 240, Shopping: 140, Travel: 0,    Gasoline: 80, Misc: 25 } },
  { month: '2026-02', income: 7040, expenses: 5390, net: 1650, by_category: { Rent: 2100, Groceries: 360, Restaurants: 275, Transport: 120, Subscriptions: 65, Utilities: 110, Health: 0,   Shopping: 220, Travel: 0,    Gasoline: 75, Misc: 65 } },
  { month: '2026-03', income: 7040, expenses: 5720, net: 1320, by_category: { Rent: 2100, Groceries: 410, Restaurants: 340, Transport: 155, Subscriptions: 65, Utilities: 125, Health: 120, Shopping: 280, Travel: 420,  Gasoline: 88, Misc: 17 } },
  { month: '2026-04', income: 7040, expenses: 5540, net: 1500, by_category: { Rent: 2100, Groceries: 390, Restaurants: 310, Transport: 145, Subscriptions: 65, Utilities: 118, Health: 60,  Shopping: 195, Travel: 0,    Gasoline: 82, Misc: 75 } },
];

// Recent transactions (last 30 days)
export const mockTransactions = [
  { id: 1,  date: '2026-04-30', description: 'TRADER JOES #123',           amount: 68.42,  type: 'debit',  category: 'Groceries',     account_name: 'Chase Checking', account_type: 'checking' },
  { id: 2,  date: '2026-04-30', description: 'PAYROLL DIRECT DEPOSIT',     amount: 3520.00,type: 'credit', category: 'Income',        account_name: 'Chase Checking', account_type: 'checking' },
  { id: 3,  date: '2026-04-29', description: 'CHIPOTLE 0842',              amount: 14.75,  type: 'debit',  category: 'Restaurants',   account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 4,  date: '2026-04-28', description: 'LYFT *RIDE',                 amount: 18.50,  type: 'debit',  category: 'Transport',     account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 5,  date: '2026-04-27', description: 'AMAZON.COM',                 amount: 47.99,  type: 'debit',  category: 'Shopping',      account_name: 'Discover It',    account_type: 'credit'   },
  { id: 6,  date: '2026-04-26', description: 'STARBUCKS #4421',            amount: 6.85,   type: 'debit',  category: 'Restaurants',   account_name: 'Chase Checking', account_type: 'checking' },
  { id: 7,  date: '2026-04-25', description: 'WHOLE FOODS MARKET',         amount: 92.14,  type: 'debit',  category: 'Groceries',     account_name: 'Discover It',    account_type: 'credit'   },
  { id: 8,  date: '2026-04-24', description: 'NETFLIX.COM',                amount: 15.99,  type: 'debit',  category: 'Subscriptions', account_name: 'Discover It',    account_type: 'credit'   },
  { id: 9,  date: '2026-04-23', description: 'PG&E UTILITY BILL',          amount: 118.40, type: 'debit',  category: 'Utilities',     account_name: 'Chase Checking', account_type: 'checking' },
  { id: 10, date: '2026-04-22', description: 'ZELLE RENT APR',             amount: 2100.00,type: 'debit',  category: 'Rent',          account_name: 'Chase Checking', account_type: 'checking' },
  { id: 11, date: '2026-04-21', description: 'DOORDASH ORDER',             amount: 32.80,  type: 'debit',  category: 'Restaurants',   account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 12, date: '2026-04-20', description: 'SHELL GAS STATION',          amount: 52.10,  type: 'debit',  category: 'Gasoline',      account_name: 'Chase Checking', account_type: 'checking' },
  { id: 13, date: '2026-04-19', description: 'APPLE.COM/BILL',             amount: 9.99,   type: 'debit',  category: 'Subscriptions', account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 14, date: '2026-04-18', description: 'WALGREENS #2841',            amount: 28.60,  type: 'debit',  category: 'Health',        account_name: 'Discover It',    account_type: 'credit'   },
  { id: 15, date: '2026-04-17', description: 'TARGET 0294',                amount: 84.35,  type: 'debit',  category: 'Shopping',      account_name: 'Discover It',    account_type: 'credit'   },
  { id: 16, date: '2026-04-16', description: 'PAYROLL DIRECT DEPOSIT',     amount: 3520.00,type: 'credit', category: 'Income',        account_name: 'Chase Checking', account_type: 'checking' },
  { id: 17, date: '2026-04-15', description: 'SPOTIFY USA',                amount: 11.99,  type: 'debit',  category: 'Subscriptions', account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 18, date: '2026-04-14', description: 'SAFEWAY #0912',              amount: 74.20,  type: 'debit',  category: 'Groceries',     account_name: 'Chase Checking', account_type: 'checking' },
  { id: 19, date: '2026-04-13', description: 'UBER *TRIP',                 amount: 22.40,  type: 'debit',  category: 'Transport',     account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 20, date: '2026-04-12', description: 'OPENAI *CHATGPT',            amount: 20.00,  type: 'debit',  category: 'Subscriptions', account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 21, date: '2026-04-11', description: 'SWEETGREEN',                 amount: 16.50,  type: 'debit',  category: 'Restaurants',   account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 22, date: '2026-04-10', description: 'AT&T WIRELESS',              amount: 85.00,  type: 'debit',  category: 'Utilities',     account_name: 'Chase Checking', account_type: 'checking' },
  { id: 23, date: '2026-04-08', description: 'COSTCO WHOLESALE',           amount: 156.90, type: 'debit',  category: 'Groceries',     account_name: 'Discover It',    account_type: 'credit'   },
  { id: 24, date: '2026-04-06', description: 'NIKE.COM',                   amount: 110.00, type: 'debit',  category: 'Shopping',      account_name: 'Discover It',    account_type: 'credit'   },
  { id: 25, date: '2026-04-05', description: 'YOUTUBE PREMIUM',            amount: 13.99,  type: 'debit',  category: 'Subscriptions', account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 26, date: '2026-04-03', description: 'RAMEN NAGI SF',              amount: 24.00,  type: 'debit',  category: 'Restaurants',   account_name: 'Chase Sapphire', account_type: 'credit'   },
  { id: 27, date: '2026-04-02', description: 'BART CLIPPER RELOAD',        amount: 40.00,  type: 'debit',  category: 'Transport',     account_name: 'Chase Checking', account_type: 'checking' },
  { id: 28, date: '2026-04-01', description: 'GOOGLE ONE',                 amount: 2.99,   type: 'debit',  category: 'Subscriptions', account_name: 'Chase Sapphire', account_type: 'credit'   },
];

export const mockInvestmentSummary = {
  total: 67015.60,
  robinhoodTotal: 12485.60,
  fidelityValue: 47320.00,
  esppValue: 8210.00,
  rsuValue: 0,
  holdings: [
    { symbol: 'AAPL', name: 'Apple Inc.',        quantity: 8,   avgCost: 178.50, currentPrice: 210.25, marketValue: 1682.00, gainLoss: 254.00, gainLossPct: 17.8 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.',       quantity: 5,   avgCost: 420.00, currentPrice: 875.40, marketValue: 4377.00, gainLoss: 2277.00,gainLossPct:108.4 },
    { symbol: 'VTI',  name: 'Vanguard Total Mkt', quantity: 18,  avgCost: 210.00, currentPrice: 248.60, marketValue: 4474.80, gainLoss: 694.80, gainLossPct: 18.4 },
    { symbol: 'QQQ',  name: 'Invesco QQQ ETF',    quantity: 4,   avgCost: 380.00, currentPrice: 448.30, marketValue: 1793.20, gainLoss: 273.20, gainLossPct: 18.0 },
    { symbol: 'MSFT', name: 'Microsoft Corp.',    quantity: 2,   avgCost: 340.00, currentPrice: 412.80, marketValue: 825.60,  gainLoss: 145.60, gainLossPct: 21.4 },
    { symbol: 'VOO',  name: 'Vanguard S&P 500',   quantity: 6,   avgCost: 395.00, currentPrice: 488.20, marketValue: 2929.20, gainLoss: 559.20, gainLossPct: 23.6 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.',    quantity: 5,   avgCost: 155.00, currentPrice: 190.40, marketValue: 952.00,  gainLoss: 177.00, gainLossPct: 22.9 },
    { symbol: 'CASH', name: 'Cash & Money Mkt',   quantity: 1,   avgCost: 451.80, currentPrice: 451.80, marketValue: 451.80,  gainLoss: 0,      gainLossPct: 0    },
  ],
};
