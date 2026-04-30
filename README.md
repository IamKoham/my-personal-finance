# Personal Finance Dashboard

A fully local personal finance dashboard. No cloud, no auth tokens, no third-party data sharing. All data stays on your machine.

Upload bank and investment statements manually — the app parses them, categorizes transactions, and gives you a clear picture of your finances.

---

## Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via sql.js (no native binaries — works on any OS)
- **Charts**: Recharts

---

## Setup

**Requirements**: Node.js 18+

```bash
git clone git@github.com:IamKoham/my-personal-finance.git
cd my-personal-finance/finance-dashboard
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

The database is created automatically on first run. No environment variables or API keys needed.

---

## Supported Statement Formats

| Institution | Account Type | Format |
|---|---|---|
| Bank of America | Checking, Savings | CSV |
| Chase | Checking, Savings | CSV |
| Chase Sapphire Preferred | Credit Card | PDF |
| Discover It | Credit Card | PDF |
| Robinhood | Investment | PDF |
| Fidelity | Investment | PDF |
| E*Trade | Investment | XLSX |

---

## Pages

- **Overview** — net worth, liquid cash, income vs. expenses, savings rate
- **Accounts** — balances, credit utilization
- **Spending** — category breakdown, transaction list, monthly trends
- **Investments** — Robinhood, Fidelity 401k, E*Trade RSU/ESPP
- **Goals** — savings goals with projected completion
- **Emergency Fund** — months covered, available to invest
- **Tax** — 401k contributions, RSU vesting, ESPP optimizer
- **Recommendations** — savings rate, card routing, concentration risk
- **Uploads** — statement history, re-upload, delete

---

## Notes

- Your financial data (`data/finance.db`) is gitignored and never leaves your machine
- Uploading the same statement twice is safe — transactions are deduplicated
- After any categorizer change, run the recategorize script to update existing transactions:
  ```bash
  cd server && npx ts-node --transpile-only src/scripts/recategorize.ts
  ```
