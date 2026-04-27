import { Router } from "express";
import { dbAll, dbGet } from "../db/db";

const router = Router();

const IRS_401K_LIMIT = 23500;

router.get("/", (req, res) => {
  const db = req.app.locals.db;

  // ESPP tax data
  const esppLots = dbAll(db, "SELECT * FROM espp_lots ORDER BY purchase_date DESC") as any[];
  const esppSummary = esppLots.map(lot => ({
    ...lot,
    totalGainLoss: Number(lot.expected_gain_loss),
    isQualifying: String(lot.tax_status || "").toLowerCase().includes("qualifying"),
    daysToQualifying: lot.first_sellable_date ? Math.ceil((new Date(lot.first_sellable_date).getTime() - Date.now()) / 86400000) : null,
  }));

  // RSU tax data
  const rsuGrants = dbAll(db, "SELECT * FROM rsu_grants ORDER BY vest_date ASC") as any[];
  const totalRsuTaxableGain = rsuGrants.reduce((s, g) => s + Number(g.taxable_gain), 0);
  const totalRsuTaxesPaid = rsuGrants.reduce((s, g) => s + Number(g.total_taxes_paid), 0);
  const avgEffectiveTaxRate = rsuGrants.length > 0
    ? rsuGrants.reduce((s, g) => s + Number(g.effective_tax_rate), 0) / rsuGrants.length
    : 0;

  // 401k status
  const fidelity = dbGet(db, "SELECT * FROM fidelity_snapshots ORDER BY id DESC LIMIT 1") as any;
  const ytdEmployeeContrib = fidelity ? Number(fidelity.employee_contributions) : 0;
  const ytdEmployerContrib = fidelity ? Number(fidelity.employer_contributions) : 0;
  // Annualize based on current month
  const currentMonth = new Date().getMonth() + 1;
  const annualizedContrib = currentMonth > 0 ? (ytdEmployeeContrib / currentMonth) * 12 : 0;
  const remainingRoom = Math.max(0, IRS_401K_LIMIT - annualizedContrib);
  const isMaxing401k = annualizedContrib >= IRS_401K_LIMIT * 0.95;

  // Capital gains from Robinhood holdings (unrealized)
  const holdings = dbAll(db, "SELECT * FROM investment_holdings WHERE holding_type='stock'") as any[];
  // We don't have cost basis for Robinhood in this version — placeholder
  const unrealizedGains = holdings.map(h => ({
    symbol: h.symbol,
    marketValue: Number(h.market_value),
    qty: Number(h.qty),
    price: Number(h.price),
  }));

  // Upcoming RSU vests (next 90 days)
  const today = new Date().toISOString().slice(0, 10);
  const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const upcomingVests = rsuGrants.filter(g => g.vest_date && g.vest_date >= today && g.vest_date <= in90);

  // Actions
  const actions: Array<{ priority: "high" | "medium" | "low"; title: string; detail: string }> = [];

  if (!isMaxing401k && remainingRoom > 0) {
    actions.push({ priority: "high", title: "Increase 401k contribution", detail: `You could contribute ~$${remainingRoom.toFixed(0)} more before year end to maximize your $${IRS_401K_LIMIT.toLocaleString()} limit.` });
  }

  for (const lot of esppSummary) {
    if (!lot.isQualifying && lot.daysToQualifying !== null && lot.daysToQualifying > 0 && lot.daysToQualifying < 180) {
      actions.push({ priority: "medium", title: `Hold ESPP lot (${lot.symbol}) ${lot.daysToQualifying} more days`, detail: `Selling after qualifying disposition date saves on taxes. Current gain: $${lot.totalGainLoss.toFixed(0)}.` });
    }
  }

  if (upcomingVests.length > 0) {
    const vestValue = upcomingVests.reduce((s, g) => s + Number(g.market_value), 0);
    actions.push({ priority: "medium", title: `${upcomingVests.length} RSU grant(s) vesting in 90 days`, detail: `Estimated value: $${vestValue.toFixed(0)}. Check withholding rate vs. your tax bracket.` });
  }

  res.json({
    espp: { lots: esppSummary, totalGain: esppSummary.reduce((s, l) => s + l.totalGainLoss, 0) },
    rsu: { grants: rsuGrants, totalTaxableGain: totalRsuTaxableGain, totalTaxesPaid: totalRsuTaxesPaid, avgEffectiveTaxRate },
    retirement: { ytdEmployeeContrib, ytdEmployerContrib, annualizedContrib, remainingRoom, isMaxing401k, limit: IRS_401K_LIMIT },
    holdings: unrealizedGains,
    upcomingVests,
    actions,
  });
});

export default router;
