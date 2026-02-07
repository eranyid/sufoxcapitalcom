import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ticker } = await req.json();
    if (!ticker) throw new Error("Missing ticker");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `You are a financial data analyst. When asked about a stock ticker, provide fundamental analysis data using the tool provided. Use the most recent publicly available data. If a ticker is not a real company or you don't have data, return reasonable null values. All monetary values should be in the company's reporting currency. Revenue history should be the last 5 fiscal years. Always provide data - never refuse.`,
          },
          {
            role: "user",
            content: `Provide comprehensive fundamental analysis for ticker: ${ticker.toUpperCase()}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_fundamental_data",
              description: "Return structured fundamental analysis data for a stock.",
              parameters: {
                type: "object",
                properties: {
                  company_name: { type: "string" },
                  ticker: { type: "string" },
                  sector: { type: "string" },
                  industry: { type: "string" },
                  country: { type: "string" },
                  currency: { type: "string", description: "Reporting currency (e.g. USD, EUR, ILS)" },
                  market_cap_b: { type: "number", description: "Market cap in billions" },
                  enterprise_value_b: { type: "number", description: "Enterprise value in billions" },
                  current_price: { type: "number" },
                  week_52_high: { type: "number" },
                  week_52_low: { type: "number" },
                  pe_ratio: { type: "number", description: "Price to earnings ratio (TTM)" },
                  forward_pe: { type: "number", description: "Forward P/E ratio" },
                  pb_ratio: { type: "number", description: "Price to book ratio" },
                  ps_ratio: { type: "number", description: "Price to sales ratio" },
                  ev_ebitda: { type: "number", description: "EV/EBITDA ratio" },
                  dividend_yield_pct: { type: "number", description: "Dividend yield %" },
                  payout_ratio_pct: { type: "number", description: "Dividend payout ratio %" },
                  eps_ttm: { type: "number", description: "EPS trailing 12 months" },
                  revenue_ttm_b: { type: "number", description: "Revenue TTM in billions" },
                  net_income_ttm_b: { type: "number", description: "Net income TTM in billions" },
                  ebitda_ttm_b: { type: "number", description: "EBITDA TTM in billions" },
                  free_cash_flow_ttm_b: { type: "number", description: "Free cash flow TTM in billions" },
                  gross_margin_pct: { type: "number" },
                  operating_margin_pct: { type: "number" },
                  net_margin_pct: { type: "number" },
                  roe_pct: { type: "number", description: "Return on equity %" },
                  roa_pct: { type: "number", description: "Return on assets %" },
                  roic_pct: { type: "number", description: "Return on invested capital %" },
                  debt_to_equity: { type: "number" },
                  current_ratio: { type: "number" },
                  revenue_growth_yoy_pct: { type: "number", description: "Revenue growth year over year %" },
                  earnings_growth_yoy_pct: { type: "number", description: "Earnings growth year over year %" },
                  revenue_history: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        year: { type: "string" },
                        revenue_b: { type: "number", description: "Revenue in billions" },
                        net_income_b: { type: "number", description: "Net income in billions" },
                        eps: { type: "number" },
                      },
                      required: ["year", "revenue_b", "net_income_b", "eps"],
                    },
                    description: "Last 5 fiscal years of revenue data",
                  },
                  margin_history: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        year: { type: "string" },
                        gross_margin_pct: { type: "number" },
                        operating_margin_pct: { type: "number" },
                        net_margin_pct: { type: "number" },
                      },
                      required: ["year", "gross_margin_pct", "operating_margin_pct", "net_margin_pct"],
                    },
                    description: "Last 5 fiscal years of margin data",
                  },
                  summary: { type: "string", description: "2-3 sentence business overview" },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 key strengths",
                  },
                  risks: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-4 key risks",
                  },
                },
                required: [
                  "company_name", "ticker", "sector", "industry", "country", "currency",
                  "market_cap_b", "current_price", "pe_ratio", "eps_ttm",
                  "revenue_ttm_b", "gross_margin_pct", "operating_margin_pct", "net_margin_pct",
                  "revenue_history", "margin_history", "summary", "strengths", "risks",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_fundamental_data" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const fundamentals = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: fundamentals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-fundamental error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
