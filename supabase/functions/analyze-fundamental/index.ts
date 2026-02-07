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

function extractFinancials(financialsData: any) {
  const revenue_history: any[] = [];
  const margin_history: any[] = [];

  const reports = financialsData?.data;
  if (!Array.isArray(reports)) return { revenue_history, margin_history };

  // Get up to 5 annual reports, sorted by year ascending
  const annualReports = reports
    .filter((r: any) => r.form === "10-K" || r.form === "20-F" || r.form === "40-F")
    .slice(0, 5)
    .reverse();

  for (const report of annualReports) {
    const ic = report.report?.ic;
    if (!Array.isArray(ic)) continue;

    const findConcept = (concepts: string[]) => {
      for (const c of concepts) {
        const item = ic.find((row: any) => row.concept === c);
        if (item?.value != null) return Number(item.value);
      }
      return null;
    };

    const revenue = findConcept([
      "us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax",
      "us-gaap_Revenues",
      "us-gaap_SalesRevenueNet",
      "us-gaap_RevenueFromContractWithCustomerIncludingAssessedTax",
    ]);
    const netIncome = findConcept([
      "us-gaap_NetIncomeLoss",
      "us-gaap_ProfitLoss",
    ]);
    const grossProfit = findConcept(["us-gaap_GrossProfit"]);
    const operatingIncome = findConcept([
      "us-gaap_OperatingIncomeLoss",
    ]);
    const eps = findConcept([
      "us-gaap_EarningsPerShareDiluted",
      "us-gaap_EarningsPerShareBasic",
    ]);

    const year = String(report.year || report.filedDate?.substring(0, 4) || "");

    if (revenue != null) {
      const revB = revenue / 1e9;
      const niB = netIncome != null ? netIncome / 1e9 : 0;
      revenue_history.push({ year, revenue_b: revB, net_income_b: niB, eps: eps ?? 0 });

      const gm = grossProfit != null && revenue > 0 ? (grossProfit / revenue) * 100 : null;
      const om = operatingIncome != null && revenue > 0 ? (operatingIncome / revenue) * 100 : null;
      const nm = netIncome != null && revenue > 0 ? (netIncome / revenue) * 100 : null;
      margin_history.push({
        year,
        gross_margin_pct: gm != null ? Math.round(gm * 10) / 10 : 0,
        operating_margin_pct: om != null ? Math.round(om * 10) / 10 : 0,
        net_margin_pct: nm != null ? Math.round(nm * 10) / 10 : 0,
      });
    }
  }

  return { revenue_history, margin_history };
}

async function getAIQualitative(ticker: string, profile: any, metrics: any): Promise<{
  summary: string;
  strengths: string[];
  risks: string[];
}> {
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return { summary: "", strengths: [], risks: [] };

    const context = `Company: ${profile.name || ticker}, Sector: ${profile.finnhubIndustry || "N/A"}, Country: ${profile.country || "N/A"}, Market Cap: $${((profile.marketCapitalization || 0) / 1000).toFixed(1)}B, P/E: ${metrics?.metric?.peTTM ?? "N/A"}, ROE: ${metrics?.metric?.roeTTM ?? "N/A"}%, Net Margin: ${metrics?.metric?.netProfitMarginTTM ?? "N/A"}%, Revenue Growth: ${metrics?.metric?.revenueGrowthTTMYoy ?? "N/A"}%, Debt/Equity: ${metrics?.metric?.totalDebtToEquityAnnual ?? "N/A"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a concise equity analyst. Given real financial data, provide a brief business summary, key strengths, and key risks. Use the tool provided.",
          },
          {
            role: "user",
            content: `Provide qualitative analysis for: ${context}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_qualitative",
              description: "Return qualitative analysis",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "2-3 sentence business overview" },
                  strengths: { type: "array", items: { type: "string" }, description: "3-4 key strengths" },
                  risks: { type: "array", items: { type: "string" }, description: "3-4 key risks" },
                },
                required: ["summary", "strengths", "risks"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_qualitative" } },
      }),
    });

    if (!response.ok) {
      console.error(`AI qualitative call failed: ${response.status}`);
      return { summary: "", strengths: [], risks: [] };
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return { summary: "", strengths: [], risks: [] };

    return JSON.parse(toolCall.function.arguments);
  } catch (e) {
    console.error("AI qualitative error:", e);
    return { summary: "", strengths: [], risks: [] };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticker } = await req.json();
    if (!ticker) throw new Error("Missing ticker");

    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) throw new Error("FINNHUB_API_KEY is not configured");

    const sym = ticker.toUpperCase();

    // Fetch all Finnhub endpoints in parallel
    const [profile, metrics, quote, financials] = await Promise.all([
      fetchFinnhub(`/stock/profile2?symbol=${sym}`, FINNHUB_API_KEY),
      fetchFinnhub(`/stock/metric?symbol=${sym}&metric=all`, FINNHUB_API_KEY),
      fetchFinnhub(`/quote?symbol=${sym}`, FINNHUB_API_KEY),
      fetchFinnhub(`/stock/financials-reported?symbol=${sym}&freq=annual`, FINNHUB_API_KEY),
    ]);

    console.log("Profile keys:", Object.keys(profile || {}));
    console.log("Metric keys:", Object.keys(metrics?.metric || {}).slice(0, 10));

    // Validate ticker exists
    if (!profile || !profile.name) {
      return new Response(
        JSON.stringify({ error: `Ticker "${sym}" not found on Finnhub. Try a US-listed stock symbol.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const m = metrics?.metric || {};
    const { revenue_history, margin_history } = extractFinancials(financials);

    // Get AI qualitative analysis (non-blocking)
    const qualitative = await getAIQualitative(sym, profile, metrics);

    const fundamentals = {
      company_name: profile.name || sym,
      ticker: profile.ticker || sym,
      sector: profile.finnhubIndustry || "N/A",
      industry: profile.finnhubIndustry || "N/A",
      country: profile.country || "N/A",
      currency: profile.currency || "USD",
      market_cap_b: safeNum(profile.marketCapitalization ? profile.marketCapitalization / 1000 : null),
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
      revenue_ttm_b: safeNum(m.revenuePerShareTTM && m.marketCapitalization 
        ? null : null), // Finnhub doesn't directly give revenue TTM in metric
      net_income_ttm_b: null,
      ebitda_ttm_b: null,
      free_cash_flow_ttm_b: safeNum(m.freeCashFlowPerShareTTM && profile.shareOutstanding
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
      summary: qualitative.summary,
      strengths: qualitative.strengths,
      risks: qualitative.risks,
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
