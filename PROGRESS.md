## Last Session: 2026-04-25

### Completed
- Phase 1: Full project scaffold (package.json workspaces, .gitignore, shared/types.ts, DB schema/migrate/db)
- Phase 2: All 4 parsers (BofA CSV, Chase CSV, Chase Sapphire CSV, Discover CSV) + dispatcher
- Phase 3: All API routes (transactions, summary, accounts, goals, emergency-fund, recommendations, settings, uploads, upload)
- Phase 3: categorizer, deduplicator, recommender (9 rules), recurringDetector
- Phase 4: Frontend shell (Vite+React+Tailwind, Sidebar, TopBar, DateRangeFilter, Zustand stores, lib/api.ts)
- Phase 5: All 8 pages + charts (SpendingBarChart, CategoryDonut, PortfolioPie)
- Swapped better-sqlite3 → sql.js (pure JS, no build tools needed)
- Upgraded multer to v2
- Auto-detect ending balance from CSV on upload → auto-sets account balance
- Parser detection rewritten to use column headers (content-based), not filename
- Uploads page: account name dropdown (existing accounts + "Other" for new)

### Files Created/Modified
- server/package.json (sql.js, multer v2)
- server/src/db/db.ts (sql.js wrapper with dbRun/dbAll/dbGet/dbExec)
- server/src/db/migrate.ts
- server/src/index.ts (async startup)
- server/src/parsers/bofa.ts, chase.ts, discover.ts, index.ts (return endingBalance)
- server/src/routes/upload.ts (auto-set account balance from ending balance)
- server/src/routes/transactions.ts, summary.ts, accounts.ts, goals.ts, settings.ts, uploads.ts, emergencyFund.ts, recommendations.ts
- server/src/services/recommender.ts, deduplicator.ts, recurringDetector.ts (accept db param)
- client/src/pages/Uploads.tsx (account dropdown)

### Next
- Bug fix session: user to describe all bugs/broken workflows
- Phase 6: Polish (mobile responsive, error states, loading skeletons)

### Blockers
- User to list bugs observed after initial testing
- Git remote URL needed to push
