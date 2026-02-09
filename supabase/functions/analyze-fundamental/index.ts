import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";

async function fetchFinnhub(path: string, token: string) {
  const url = `${FINNHUB_BASE}${path}${path.includes("?") ? "&" : "?"}token=${token}`;
  console.log(`Finnhub fetch: ${path}`);
  const res = await fetch(url);
  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (!res.ok) {
    const t = await res.text();
    console.error(`Finnhub error ${res.status}: ${t}`);
    throw new Error(`Finnhub error: ${res.status}`);
  }
  return res.json();
}

function safeNum(v: unknown): number | null {
  if (v == null || v === 0 || v === "") return null;
  const n = Number(v);
  return isFinite(n) ? n : null;
}

interface FinancialPeriod {
  period: string; // "2024" or "Q3 2024"
  revenue: number | null;
  cost_of_revenue: number | null;
  gross_profit: number | null;
  operating_expenses: number | null;
  operating_income: number | null;
  net_income: number | null;
  eps: number | null;
  // Balance sheet
  total_assets: number | null;
  current_assets: number | null;
  total_liabilities: number | null;
  current_liabilities: number | null;
  total_equity: number | null;
  cash_and_equivalents: number | null;
  total_debt: number | null;
  // Cash flow
  operating_cash_flow: number | null;
  capital_expenditures: number | null;
  free_cash_flow: number | null;
  investing_cash_flow: number | null;
  financing_cash_flow: number | null;
}

function findConcept(section: any[], concepts: string[]): number | null {
  if (!Array.isArray(section)) return null;
  for (const c of concepts) {
    const item = section.find((row: any) => row.concept === c);
    if (item?.value != null) return Number(item.value);
  }
  return null;
}

function extractReportData(report: any): Omit<FinancialPeriod, "period"> {
  const ic = report.report?.ic || [];
  const bs = report.report?.bs || [];
  const cf = report.report?.cf || [];

  const revenue = findConcept(ic, [
    "us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax",
    "us-gaap_Revenues",
    "us-gaap_SalesRevenueNet",
    "us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax",
  ]);
  const costOfRevenue = findConcept(ic, ["us-gaap_CostOfGoodsAndServicesSold", "us-gaap_CostOfRevenue", "us-gaap_CostOfGoodsSold"]);
  const grossProfit = findConcept(ic, ["us-gaap_GrossProfit"]);
  const operatingExpenses = findConcept(ic, ["us-gaap_OperatingExpenses"]);
  const operatingIncome = findConcept(ic, ["us-gaap_OperatingIncomeLoss"]);
  const netIncome = findConcept(ic, ["us-gaap_NetIncomeLoss", "us-gaap_ProfitLoss"]);
  const eps = findConcept(ic, ["us-gaap_EarningsPerShareDiluted", "us-gaap_EarningsPerShareBasic"]);

  const totalAssets = findConcept(bs, ["us-gaap_Assets"]);
  const currentAssets = findConcept(bs, ["us-gaap_AssetsCurrent"]);
  const totalLiabilities = findConcept(bs, ["us-gaap_Liabilities"]);
  const currentLiabilities = findConcept(bs, ["us-gaap_LiabilitiesCurrent"]);
  const totalEquity = findConcept(bs, ["us-gaap_StockholdersEquity", "us-gaap_StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest"]);
  const cash = findConcept(bs, ["us-gaap_CashAndCashEquivalentsAtCarryingValue", "us-gaap_CashCashEquivalentsAndShortTermInvestments"]);
  const totalDebt = findConcept(bs, ["us-gaap_LongTermDebt", "us-gaap_LongTermDebtNoncurrent"]);

  // Cash flow
  const operatingCashFlow = findConcept(cf, [
    "us-gaap_NetCashProvidedByUsedInOperatingActivities",
    "us-gaap_NetCashProvidedByOperatingActivities",
  ]);
  const capex = findConcept(cf, [
    "us-gaap_PaymentsToAcquirePropertyPlantAndEquipment",
    "us-gaap_PaymentsToAcquireProductiveAssets",
  ]);
  const investingCashFlow = findConcept(cf, [
    "us-gaap_NetCashProvidedByUsedInInvestingActivities",
    "us-gaap_NetCashProvidedByInvestingActivities",
  ]);
  const financingCashFlow = findConcept(cf, [
    "us-gaap_NetCashProvidedByUsedInFinancingActivities",
    "us-gaap_NetCashProvidedByFinancingActivities",
  ]);

  const fcf = operatingCashFlow != null && capex != null
    ? operatingCashFlow - Math.abs(capex)
    : null;

  return {
    revenue, cost_of_revenue: costOfRevenue, gross_profit: grossProfit,
    operating_expenses: operatingExpenses, operating_income: operatingIncome,
    net_income: netIncome, eps,
    total_assets: totalAssets, current_assets: currentAssets,
    total_liabilities: totalLiabilities, current_liabilities: currentLiabilities,
    total_equity: totalEquity, cash_and_equivalents: cash, total_debt: totalDebt,
    operating_cash_flow: operatingCashFlow, capital_expenditures: capex,
    free_cash_flow: fcf, investing_cash_flow: investingCashFlow,
    financing_cash_flow: financingCashFlow,
  };
}

function extractAllFinancials(annualData: any, quarterlyData: any) {
  const revenue_history: any[] = [];
  const margin_history: any[] = [];
  const annual_statements: FinancialPeriod[] = [];
  const quarterly_statements: FinancialPeriod[] = [];

  // Annual
  const annualReports = (annualData?.data || [])
    .filter((r: any) => r.form === "10-K" || r.form === "20-F" || r.form === "40-F")
    .slice(0, 5)
    .reverse();

  for (const report of annualReports) {
    const d = extractReportData(report);
    const year = String(report.year || report.filedDate?.substring(0, 4) || "");

    if (d.revenue != null) {
      const revB = d.revenue / 1e9;
      const niB = d.net_income != null ? d.net_income / 1e9 : 0;
      revenue_history.push({ year, revenue_b: revB, net_income_b: niB, eps: d.eps ?? 0 });

      const gm = d.gross_profit != null && d.revenue > 0 ? (d.gross_profit / d.revenue) * 100 : null;
      const om = d.operating_income != null && d.revenue > 0 ? (d.operating_income / d.revenue) * 100 : null;
      const nm = d.net_income != null && d.revenue > 0 ? (d.net_income / d.revenue) * 100 : null;
      margin_history.push({
        year,
        gross_margin_pct: gm != null ? Math.round(gm * 10) / 10 : 0,
        operating_margin_pct: om != null ? Math.round(om * 10) / 10 : 0,
        net_margin_pct: nm != null ? Math.round(nm * 10) / 10 : 0,
      });
    }

    annual_statements.push({ period: year, ...d });
  }

  // Quarterly
  const quarterlyReports = (quarterlyData?.data || [])
    .filter((r: any) => r.form === "10-Q")
    .slice(0, 8)
    .reverse();

  for (const report of quarterlyReports) {
    const d = extractReportData(report);
    const quarter = report.quarter || "";
    const year = report.year || report.filedDate?.substring(0, 4) || "";
    const period = quarter ? `Q${quarter} ${year}` : String(year);
    quarterly_statements.push({ period, ...d });
  }

  return { revenue_history, margin_history, annual_statements, quarterly_statements };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticker } = await req.json();
    if (!ticker) throw new Error("Missing ticker");

    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) throw new Error("FINNHUB_API_KEY is not configured");

    const sym = ticker.toUpperCase();

    // Date range for news: last 30 days
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const toStr = now.toISOString().split('T')[0];
    const fromStr = from.toISOString().split('T')[0];

    // Fetch all Finnhub endpoints in parallel (including quarterly + news)
    const [profile, metrics, quote, annualFinancials, quarterlyFinancials, companyNews] = await Promise.all([
      fetchFinnhub(`/stock/profile2?symbol=${sym}`, FINNHUB_API_KEY),
      fetchFinnhub(`/stock/metric?symbol=${sym}&metric=all`, FINNHUB_API_KEY),
      fetchFinnhub(`/quote?symbol=${sym}`, FINNHUB_API_KEY),
      fetchFinnhub(`/stock/financials-reported?symbol=${sym}&freq=annual`, FINNHUB_API_KEY),
      fetchFinnhub(`/stock/financials-reported?symbol=${sym}&freq=quarterly`, FINNHUB_API_KEY),
      fetchFinnhub(`/company-news?symbol=${sym}&from=${fromStr}&to=${toStr}`, FINNHUB_API_KEY).catch(() => []),
    ]);

    console.log("Profile keys:", Object.keys(profile || {}));

    // For ETFs (e.g. SPY, QQQ) profile2 returns empty — fallback gracefully
    const hasProfile = profile && profile.name;
    if (!hasProfile && (!quote || quote.c == null || quote.c === 0)) {
      return new Response(
        JSON.stringify({ error: `Ticker "${sym}" not found on Finnhub. Try a US-listed stock symbol.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const m = metrics?.metric || {};
    const { revenue_history, margin_history, annual_statements, quarterly_statements } =
      extractAllFinancials(annualFinancials, quarterlyFinancials);

    // Process company news (limit to 20 most recent)
    const news = Array.isArray(companyNews)
      ? companyNews.slice(0, 20).map((n: any) => ({
          headline: n.headline || '',
          summary: n.summary || '',
          source: n.source || '',
          url: n.url || '',
          datetime: n.datetime ? n.datetime * 1000 : null, // convert to ms
          related: n.related || sym,
          image: n.image || '',
          category: n.category || '',
        }))
      : [];

    const fundamentals = {
      company_name: profile?.name || sym,
      ticker: profile?.ticker || sym,
      sector: profile?.finnhubIndustry || "N/A",
      industry: profile?.finnhubIndustry || "N/A",
      country: profile?.country || "N/A",
      currency: profile?.currency || "USD",
      market_cap_b: safeNum(profile?.marketCapitalization ? profile.marketCapitalization / 1000 : null),
      enterprise_value_b: safeNum(m.enterpriseValueTTM ? m.enterpriseValueTTM / 1e6 : null),
      current_price: safeNum(quote?.c),
      week_52_high: safeNum(m["52WeekHigh"]),
      week_52_low: safeNum(m["52WeekLow"]),
      pe_ratio: safeNum(m.peTTM),
      forward_pe: safeNum(m.peAnnual),
      pb_ratio: safeNum(m.pbAnnual),
      ps_ratio: safeNum(m.psAnnual),
      ev_ebitda: safeNum(m.currentEv ? m.currentEv / (m.ebitdaTTM || 1) : m.evEbitdaTTM),
      dividend_yield_pct: safeNum(m.dividendYieldIndicatedAnnual),
      payout_ratio_pct: safeNum(m.payoutRatioAnnual),
      eps_ttm: safeNum(m.epsTTM),
      revenue_ttm_b: null,
      net_income_ttm_b: null,
      ebitda_ttm_b: null,
      free_cash_flow_ttm_b: safeNum(m.freeCashFlowPerShareTTM && profile?.shareOutstanding
        ? (m.freeCashFlowPerShareTTM * profile.shareOutstanding) / 1e9 : null),
      gross_margin_pct: safeNum(m.grossMarginTTM),
      operating_margin_pct: safeNum(m.operatingMarginTTM),
      net_margin_pct: safeNum(m.netProfitMarginTTM),
      roe_pct: safeNum(m.roeTTM),
      roa_pct: safeNum(m.roaTTM),
      roic_pct: safeNum(m.roicTTM),
      debt_to_equity: safeNum(m.totalDebtToEquityAnnual),
      current_ratio: safeNum(m.currentRatioAnnual),
      revenue_growth_yoy_pct: safeNum(m.revenueGrowthTTMYoy),
      earnings_growth_yoy_pct: safeNum(m.epsGrowthTTMYoy),
      revenue_history,
      margin_history,
      annual_statements,
      quarterly_statements,
      news,
    };

    return new Response(JSON.stringify({ data: fundamentals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-fundamental error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Finnhub rate limit reached (60 calls/min). Please wait and try again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
