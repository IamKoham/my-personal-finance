# Finance Dashboard — Project Context

_Last updated: 2026-04-27_

---

## What This App Does

A fully local personal finance dashboard. No cloud, no auth tokens, no third-party data sharing. All data stays on the machine. Statements are uploaded manually as CSV or PDF.

---

## Owner

Samruddhi Kulkarni — San Diego, CA

---

## Accounts & Institutions

| Institution | Account Types | Format |
|---|---|---|
| Bank of America | Checking, Savings | CSV |
| Chase | Checking, Savings | CSV |
| Chase Sapphire Preferred | Credit Card | CSV |
| Discover | Credit Card | CSV |
| Robinhood | Brokerage (taxable) | PDF (monthly statement) |
| Fidelity NetBenefits | 401k (Intuit Inc. plan) | PDF (statement details) |
| Etrade | RSU + ESPP | XLSX (ByBenefitType_expanded.xlsx) |

---

## Etrade XLSX Format

Two sheets:

**ESPP sheet** — key columns:
- Symbol, Purchase Date, Purchase Price, Purchased Qty., Net Shares, Sellable Qty.
- Expected Gain/Loss, Est. Market Value
- Discount Percent, Grant Date FMV, Purchase Date FMV
- Est. Cost Basis (per share), Est. Taxable Gain/Loss (per share)
- Tax Status (qualifying vs. disqualifying), First Sellable Date

**Restricted Stock sheet** — key columns:
- Symbol, Grant Date, Granted Qty., Withheld Qty., Vested Qty., Unvested Qty., Sellable Qty.
- Est. Market Value, Vest Period, Vest Date
- Total Taxes Paid, Effective Tax Rate, Withholding Amount, Taxable Gain
- Est. Cost Basis (per share), Est. Taxable Gain/Loss (per share)

---

## Robinhood PDF Format (5 pages)

- Page 1: Account summary — opening/closing balance, net account balance, cash, total securities, portfolio value
- Page 2: Portfolio summary — holdings table (symbol, qty, price, market value, % of total portfolio), cash balance
- Page 3: Account activity — transactions (symbol, type, date, qty, price, debit, credit)

Note: Netflix (NFLX) is ~56% of portfolio as of March 2026 — concentration warning should fire.

---

## Fidelity PDF Format (3 pages — 401k only)

- Page 1: Account summary — beginning balance, ending balance, employee contributions, employer contributions, change in market value, vested balance, personal rate of return
- Page 3: Holdings (Vanguard Target 2060), activity summary, fund asset allocation (88% stocks, 9% bonds, 3% short-term)

Note: Employer contributions are visible → can verify employer match capture rate.

---

## Design Decisions

- **Mode**: Dark (default), with a toggle for light
- **Palette**: Slate + Emerald — dark slate backgrounds, emerald green for positive, red for negative, amber for warnings
- **Density**: Comfortable (breathing room, larger cards)
- **Reference feel**: Bloomberg/trading terminal aesthetic, not Mint-style pastels

---

## Full Page Structure

### 1. Overview
- Net worth (assets − liabilities), month-over-month trend
- Liquid money (checking + savings only)
- Total money (liquid + investments)
- Monthly income (auto-detected direct deposits)
- Monthly expenses
- Savings rate with red/yellow/green indicator
- Cash flow bar (income vs. expenses)
- Quick alerts (top 2-3 critical recommendations)

### 2. Accounts
- Account cards: name, type, balance, institution, last updated
- Net worth breakdown: assets vs. liabilities
- Credit utilization per card: balance / limit (green <10%, yellow <30%, red >30%)
- Add/edit account (manual balance entry)

### 3. Spending
- Monthly spending total with date range filter
- Category donut chart
- Spending bar chart (month over month per category)
- Recurring expenses (auto-detected: name, amount, frequency, last charged)
- Transaction list (filterable by account, category, date, amount)
- Budget vs. actual (set monthly budget per category → red/green status)
- Largest transactions this period

### 4. Investments
- Total portfolio value (Robinhood + Fidelity 401k + Etrade combined)
- Portfolio pie chart (by asset type)
- **Robinhood section**: holdings table, concentration warnings
- **Fidelity 401k section**:
  - Balance, vested balance
  - Employee vs. employer contributions (this month + YTD)
  - Employer match capture rate
  - Fund breakdown (Target 2060 → stocks/bonds/short-term %)
- **Etrade RSU section**:
  - Granted / vested / unvested / sellable per grant
  - Upcoming vest dates
  - Taxes already withheld
- **Etrade ESPP section**:
  - Lots: purchase date, discount %, gain/loss, tax status, sellable qty
  - First sellable date (qualifying disposition tracking)
- Employer stock concentration warning (RSU + ESPP + any single stock as % of total)
- Manual entry fallback if PDF parse fails

### 5. Goals
- Goal cards: name, target, current, target date, progress bar
- Projected completion date at current savings rate
- Monthly contribution needed to hit goal on time
- Surplus allocation: how much monthly surplus goes to each goal
- Add/edit/delete goal

### 6. Emergency Fund
- Status: Red (<3 months) / Yellow (3–5 months) / Green (6+ months)
- Current amount (savings accounts)
- Monthly expenses (auto-calculated: 3-month average)
- Target amount (monthly_expenses × target_months, user-configurable, default 6)
- Months covered
- Are you holding too much cash? (liquid > target → show surplus)
- Available to invest (surplus above target)

### 7. Tax _(new page)_
- **Capital gains summary**: short-term vs. long-term, realized vs. unrealized
- **Tax-loss harvesting**: holdings at a loss, estimated tax savings if sold to offset gains
- **ESPP optimizer**: lots approaching qualifying disposition, estimated tax difference (qualifying vs. disqualifying)
- **RSU check**: withholding rate vs. estimated bracket gap
- **401k status**: YTD contributions vs. $23,500 IRS limit, employer match capture %
- **Actions**: prioritized "do this before Dec 31 to save ~$X" list

### 8. Recommendations
- **Section 1 — Financial Health**: savings rate, emergency fund, debt payoff, subscription audit
- **Section 2 — Credit Optimization**:
  - Utilization per card with pay-before-statement-close tip + exact date + amount
  - "Pay $X on Chase Sapphire by [date] to report <10% utilization"
- **Section 3 — Card Routing** _(new)_:
  - "For groceries → use [card]", "For dining → use [card]", etc.
  - Table: your cards × categories × earn rates
- **Section 4 — Should You Get a New Card?** _(new)_:
  - Spending gap analysis (categories where current cards underperform)
  - Card suggestions from hardcoded DB (~25 popular cards)
  - "Getting [card] would earn ~$X/yr more based on your spending"
- **Section 5 — Investments**: concentration risk, 401k match check, available to invest

### 9. Uploads
- Drag-and-drop upload zone (CSV or PDF, select account + type)
- Upload history: filename, account, date, transaction count, status
- Delete upload (removes upload + all transactions)
- Parse errors: shows sample + asks for column mapping
- Supported formats: BofA, Chase, Discover, Robinhood, Fidelity, Etrade

---

## What's Already Built (as of 2026-04-25)

- Phase 1: Full project scaffold (package.json workspaces, shared/types.ts, DB schema, sql.js)
- Phase 2: Parsers for BofA CSV, Chase CSV, Chase Sapphire CSV, Discover CSV + dispatcher
- Phase 3: All API routes + services (categorizer, deduplicator, recommender 9 rules, recurringDetector)
- Phase 4: Frontend shell (Vite + React + Tailwind, Sidebar, TopBar, DateRangeFilter, Zustand, api.ts)
- Phase 5: All 8 pages + charts (SpendingBarChart, CategoryDonut, PortfolioPie)
- sql.js (pure JS SQLite, no native build needed)
- Multer v2
- Auto-detect ending balance from CSV → auto-sets account balance
- Content-based parser detection (column headers, not filename)
- Uploads page: account dropdown with existing + "Other"

---

## What Needs to Be Built Next

### New parsers
- [ ] Robinhood PDF parser
- [ ] Fidelity 401k PDF parser
- [ ] Etrade XLSX parser (RSU sheet + ESPP sheet)

### New page
- [ ] Tax page (capital gains, tax-loss harvesting, ESPP optimizer, RSU check, 401k status)

### Investments page upgrades
- [ ] Fidelity 401k section (contributions, match capture, fund breakdown)
- [ ] Etrade RSU section (vesting schedule, upcoming vest dates, taxes withheld)
- [ ] Etrade ESPP section (lots, discount, tax status, sellable dates)
- [ ] Employer stock concentration warning

### Recommendations page upgrades
- [ ] Credit utilization tracker + pay-before-close timing
- [ ] Card routing engine (which card for which category)
- [ ] Card upgrade advisor (hardcoded rewards DB + spending gap analysis)
- [ ] Subscription audit

### Overview upgrades
- [ ] Liquid vs. total money split
- [ ] Savings rate with color indicator

### Spending upgrades
- [ ] Budget vs. actual per category

### Accounts upgrades
- [ ] Credit utilization per card (balance / limit)

### DB additions needed
- [ ] investment_holdings table (for Robinhood/Etrade positions)
- [ ] tax_lots table (for ESPP/RSU cost basis tracking)
- [ ] card_rewards table (static: card name, category, earn rate)

---

## Key Questions Already Answered

- **Data ingestion**: manual CSV/PDF upload only (no Plaid, no cloud)
- **Theme**: dark mode, Slate + Emerald palette, comfortable density
- **Credit card features**: card routing + upgrade advisor both in Recommendations page
- **RSU/ESPP**: full tracking in Investments page + Tax page
- **Tax page**: feasible with existing data (not a stretch goal)
- **Card rewards DB**: hardcoded ~25 popular cards, user confirms their own card rates

---

## Card Reward Rates

### Chase Sapphire Preferred
| Category | Earn Rate |
|---|---|
| Dining (restaurants, delivery, takeout) | 3x |
| Online groceries (excl. Target/Walmart/wholesale clubs) | 3x |
| Select streaming services | 3x |
| Lyft | 3x |
| Travel worldwide | 2x |
| Chase Travel portal | 5x |
| Everything else | 1x |

Notes:
- AutoPay is set to minimum only ($40) — user is paying interest. Flag in Recommendations.
- Actual spending profile: heavy Uber/Lyft, Uber Eats, Amazon, HBO Max, Google Fi
- Points currency: Chase Ultimate Rewards

### Discover It Card (ending 0998)
| Category | Rate |
|---|---|
| Rotating 5% quarterly category | 5% cash back |
| Everything else | 1% cash back |

Quarterly rotating 5% categories (typical Discover It 2026):
- Q1 (Jan–Mar): Grocery stores, drugstores
- Q2 (Apr–Jun): Gas stations, EV charging, home improvement
- Q3 (Jul–Sep): Restaurants, PayPal
- Q4 (Oct–Dec): Amazon, digital wallets, Target

Notes:
- Credit limit: $5,100
- AutoPay: Full balance (no interest — healthy)
- FICO Score: 778 (surfaced monthly in statement — display in Accounts page)
- Actual spending: restaurants, Instacart, Uber One, misc services

### Card Routing Matrix (final)
| Category | Best Card | Earn Rate |
|---|---|---|
| Dining / restaurants | Chase Sapphire | 3x points (~3%) |
| Uber / Lyft | Chase Sapphire | 3x pts |
| Streaming | Chase Sapphire | 3x points |
| Online groceries (non-Walmart) | Chase Sapphire | 3x points |
| Travel | Chase Sapphire | 2x–5x points |
| Supermarkets (Q1 + whenever 5% active) | Discover | 5% cash back |
| Gas (Q2 when 5% active) | Discover | 5% cash back |
| Restaurants (Q3 when 5% active) | Discover | 5% (beats Sapphire's 3x) |
| Amazon (Q4 when 5% active) | Discover | 5% cash back |
| Everything else | Discover | 1% |

Routing engine must be quarter-aware — Discover 5% overrides Sapphire when active category matches.

---

## Chase Sapphire PDF Statement Format (4 pages)

- Page 1: Account summary (new balance, min payment, due date), Ultimate Rewards summary (points balance, points earned by category this period)
- Page 3: Account activity — Date | Merchant Name or Transaction Description | $ Amount
  - Payments listed as negative under "PAYMENTS AND OTHER CREDITS"
  - Purchases listed as positive under "PURCHASE"
  - Interest charges listed separately under "INTEREST CHARGED"
- Page 4: Rate/billing period info

Parser notes:
- Text has doubled characters in headers (PDF rendering artifact) — strip or regex around it
- Transaction section starts after "ACCOUNT ACTIVITY" header
- Date format: MM/DD

---

## Discover PDF Statement Format (8 pages)

- Page 1: Account summary (previous balance, payments, new balance, credit line, FICO score, AutoPay info)
- Page 3: Transactions — format per line: `MM/DD | MERCHANT NAME CITY STATE | MerchantCategory | $Amount`
  - Payments listed under "PAYMENTS AND CREDITS"
  - Purchases listed under "PURCHASES" with merchant category inline
  - Cashback rewards summary (previous balance, earned this period, redeemed, balance)
- Page 4: Interest charge calculation, APR info

Parser notes:
- PDF format only (not CSV like original plan assumed)
- Merchant categories shown inline: Restaurants, Supermarkets, Travel/Entertainment, Merchandise, Services
- Some transactions have Google Pay wallet info on subsequent lines — skip those lines
- Amount column is rightmost, always prefixed with $

---

## Open Questions

- Whether to add PIN protection or data export (Phase 6)
