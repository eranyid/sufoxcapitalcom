

# Fundamental Analysis — Switch to Finnhub API

## Problem
The current edge function uses AI to generate financial numbers, which are inaccurate. The Finnhub API key is already configured (`FINNHUB_API_KEY`).

## Solution
Rewrite the `analyze-fundamental` edge function to pull real data from Finnhub, and use AI only for qualitative text (summary, strengths, risks).

## Finnhub Endpoints Used

| Endpoint | Data |
|---|---|
| `/stock/profile2?symbol=X` | Company name, sector, industry, country, currency, market cap, IPO date |
| `/stock/metric?symbol=X&metric=all` | P/E, P/B, EV/EBITDA, margins, ROE, ROA, 52w high/low, dividend yield, debt/equity, current ratio, revenue growth, EPS, and more |
| `/quote?symbol=X` | Current price, change, day high/low |
| `/stock/financials-reported?symbol=X&freq=annual` | Historical income statement data (revenue, net income, EPS) for charts |

## Changes

### 1. Rewrite Edge Function (`supabase/functions/analyze-fundamental/index.ts`)

- Fetch all 4 Finnhub endpoints in parallel using the existing `FINNHUB_API_KEY`
- Map Finnhub response fields to the existing `FundamentalData` interface:
  - `profile2` provides: company_name, ticker, sector, industry, country, currency, market_cap_b
  - `metric.metric` provides: pe_ratio (peTTM), pb_ratio (pbAnnual), ps_ratio (psAnnual), ev_ebitda (evEbitdaTTM), gross_margin_pct (grossMarginTTM), operating_margin_pct (operatingMarginTTM), net_margin_pct (netProfitMarginTTM), roe_pct (roeTTM), roa_pct (roaTTM), roic_pct (roicTTM), debt_to_equity (totalDebtToEquityAnnual), current_ratio (currentRatioAnnual), dividend_yield_pct (dividendYieldIndicatedAnnual), eps_ttm (epsTTM), 52w high/low, revenue growth, etc.
  - `quote` provides: current_price
  - `financials-reported` provides: revenue_history and margin_history arrays for the charts
- Keep AI call (Lovable AI gateway) only for generating summary, strengths, and risks text -- passing the real numbers as context
- If AI call fails, return empty summary/strengths/risks (graceful degradation)

### 2. Minor Frontend Update (`src/pages/Market.tsx`)

- Change subtitle from "AI-powered" to "Finnhub-powered fundamental data"
- Add small "Source: Finnhub" badge
- No structural changes -- the data interface stays identical

### 3. Error Handling

- Invalid ticker (empty profile response) returns clear "Ticker not found" error
- Rate limiting (Finnhub free tier: 60 calls/min) handled with appropriate error message
- Missing fields from Finnhub returned as null (KPI tiles already handle null gracefully with "---")
- If `financials-reported` returns no data (some tickers), charts show empty state

