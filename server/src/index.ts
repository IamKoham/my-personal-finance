import express from "express";
import cors from "cors";
import path from "path";
import { getDb } from "./db/db";
import { migrate } from "./db/migrate";

const PORT = 3001;

async function main() {
  const db = await getDb();
  migrate(db);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.locals.db = db;

  const uploadRouter          = (await import("./routes/upload")).default;
  const transactionsRouter    = (await import("./routes/transactions")).default;
  const summaryRouter         = (await import("./routes/summary")).default;
  const accountsRouter        = (await import("./routes/accounts")).default;
  const goalsRouter           = (await import("./routes/goals")).default;
  const recommendationsRouter = (await import("./routes/recommendations")).default;
  const emergencyFundRouter   = (await import("./routes/emergencyFund")).default;
  const settingsRouter        = (await import("./routes/settings")).default;
  const uploadsRouter         = (await import("./routes/uploads")).default;
  const investmentsRouter     = (await import("./routes/investments")).default;
  const taxRouter             = (await import("./routes/tax")).default;

  app.use("/api/upload",          uploadRouter);
  app.use("/api/transactions",    transactionsRouter);
  app.use("/api/summary",         summaryRouter);
  app.use("/api/accounts",        accountsRouter);
  app.use("/api/goals",           goalsRouter);
  app.use("/api/recommendations", recommendationsRouter);
  app.use("/api/emergency-fund",  emergencyFundRouter);
  app.use("/api/settings",        settingsRouter);
  app.use("/api/uploads",         uploadsRouter);
  app.use("/api/investments",     investmentsRouter);
  app.use("/api/tax",             taxRouter);

  const CLIENT_DIST = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(CLIENT_DIST));
  app.get("*", (_req, res) => res.sendFile(path.join(CLIENT_DIST, "index.html")));

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

main().catch(err => { console.error("Failed to start server:", err); process.exit(1); });
