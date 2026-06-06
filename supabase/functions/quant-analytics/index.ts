import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    // Verify caller is authenticated
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, params } = await req.json();

    // Check cache first
    const cacheKey = JSON.stringify({ action, params });
    const { data: cached } = await supabase
      .from("quant_analytics_cache")
      .select("result, valid_until")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (cached && new Date(cached.valid_until) > new Date()) {
      return new Response(JSON.stringify(cached.result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: unknown;

    switch (action) {
      case "rolling_metrics":
        result = await computeRollingMetrics(supabase, params);
        break;
      case "ewma_volatility":
        result = await computeEWMA(supabase, params);
        break;
      case "factor_regression":
        result = await computeFactorRegression(supabase, params);
        break;
      case "factor_heatmap":
        result = await computeFactorHeatmap(supabase, params);
        break;
      case "correlation_matrix":
        result = await computeCorrelationMatrix(supabase, params);
        break;
      case "pair_analysis":
        result = await computePairAnalysis(supabase, params);
        break;
      case "cointegration_screen":
        result = await computeCointegrationScreen(supabase, params);
        break;
      case "intraday_momentum":
        result = await computeIntradayMomentum(supabase, params);
        break;
      case "moc_pressure":
        result = await computeMOCPressure(supabase, params);
        break;
      case "portfolio_stats":
        result = await computePortfolioStats(supabase, params);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Cache result (valid until end of current trading day)
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setUTCHours(21, 0, 0, 0);
    if (validUntil < now) validUntil.setDate(validUntil.getDate() + 1);

    await supabase.from("quant_analytics_cache").upsert({
      cache_key: cacheKey,
      result,
      computed_at: now.toISOString(),
      valid_until: validUntil.toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// =====================================================
// CANONICAL DATA LAYER
// All functions consume log returns from quant_daily_returns RPC
// r_t = ln(P_t / P_{t-1})
// =====================================================

interface ReturnRow {
  symbol: string;
  trade_date: string;
  daily_return: number;
  close_price: number;
  sector?: string;
  market_cap?: number;
  market_cap_rank?: number;
  company_name?: string;
}

async function fetchDailyReturns(
  supabase: any,
  from: string,
  to: string,
  symbols?: string[] | null
): Promise<ReturnRow[]> {
  const { data, error } = await supabase.rpc("quant_daily_returns", {
    p_from: from,
    p_to: to,
    p_symbols: symbols || null,
  });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    ...r,
    daily_return: r.daily_return != null ? Number(r.daily_return) : null,
    close_price: Number(r.close_price),
    market_cap: r.market_cap ? Number(r.market_cap) : 0,
  })).filter((r: any) => r.daily_return !== null);
}

async function fetchDailyCloses(
  supabase: any,
  from: string,
  to: string,
  symbols: string[]
) {
  const { data, error } = await supabase.rpc("quant_daily_closes", {
    p_from: from,
    p_to: to,
    p_symbols: symbols,
  });
  if (error) throw error;
  return data || [];
}

async function fetchUniverseReturns(supabase: any, from: string, to: string) {
  const { data, error } = await supabase.rpc("quant_universe_returns", {
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return data || [];
}

function buildValidationMeta(returns: ReturnRow[], symbols?: string[]) {
  const dates = [...new Set(returns.map((r) => r.trade_date))].sort();
  const uniqueSymbols = [...new Set(returns.map((r) => r.symbol))];
  const warnings: string[] = [];
  if (dates.length < 20) warnings.push("Sample too small for stable statistics (< 20 trading days)");
  if (dates.length < 5) warnings.push("Critically insufficient data (< 5 trading days)");
  return {
    observations: returns.length,
    trading_days: dates.length,
    start_date: dates[0] || null,
    end_date: dates[dates.length - 1] || null,
    symbols_count: uniqueSymbols.length,
    warnings,
  };
}

// =====================================================
// OLS Regression helper
// =====================================================
function olsRegression(y: number[], X: number[][]) {
  const n = y.length;
  const k = X[0]?.length || 0;
  if (n < k + 2) return null;

  const Xa = X.map((row) => [1, ...row]);
  const kk = k + 1;

  const XtX: number[][] = Array.from({ length: kk }, () => Array(kk).fill(0));
  const Xty: number[] = Array(kk).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < kk; j++) {
      Xty[j] += Xa[i][j] * y[i];
      for (let l = 0; l < kk; l++) {
        XtX[j][l] += Xa[i][j] * Xa[i][l];
      }
    }
  }

  const aug: number[][] = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < kk; col++) {
    let maxRow = col;
    for (let row = col + 1; row < kk; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-12) return null;
    for (let row = 0; row < kk; row++) {
      if (row === col) continue;
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= kk; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  const betas = aug.map((row, i) => row[kk] / row[i]);

  let ssTot = 0, ssRes = 0;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) {
    let yHat = 0;
    for (let j = 0; j < kk; j++) yHat += Xa[i][j] * betas[j];
    ssRes += (y[i] - yHat) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }

  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const adjR2 = n > kk ? 1 - ((1 - r2) * (n - 1)) / (n - kk) : r2;

  const mse = ssRes / (n - kk);
  const XtXinv = invertMatrix(XtX);
  const stdErrors = XtXinv
    ? betas.map((_, i) => Math.sqrt(Math.max(0, mse * XtXinv[i][i])))
    : betas.map(() => 0);
  const tStats = betas.map((b, i) => (stdErrors[i] > 0 ? b / stdErrors[i] : 0));

  return {
    intercept: betas[0],
    coefficients: betas.slice(1),
    stdErrors: stdErrors.slice(1),
    tStats: tStats.slice(1),
    r2,
    adjR2,
    n,
  };
}

function invertMatrix(m: number[][]): number[][] | null {
  const n = m.length;
  const aug = m.map((row, i) => {
    const r = [...row];
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-12) return null;
    const pivot = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let cov = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) {
    cov += (x[i] - mx) * (y[i] - my);
    sx += (x[i] - mx) ** 2;
    sy += (y[i] - my) ** 2;
  }
  const denom = Math.sqrt(sx * sy);
  return denom > 0 ? cov / denom : 0;
}

function getRanks(arr: number[]): number[] {
  const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  sorted.forEach((s, rank) => (ranks[s.i] = rank + 1));
  return ranks;
}

// Simple t-distribution CDF approximation
function tDistCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(x, df / 2, 0.5);
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lnGamma(a) - lnGamma(b) + lnGamma(a + b));
  if (x < (a + 1) / (a + b + 2)) return (bt * betaCF(x, a, b)) / a;
  return 1 - (bt * betaCF(1 - x, b, a)) / b;
}

function betaCF(x: number, a: number, b: number): number {
  const maxIter = 100, eps = 1e-10;
  let qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c; h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function lnGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// =====================================================
// Statistical helpers (operate on log returns)
// =====================================================
function computeMaxDrawdown(returns: number[]): number {
  if (returns.length === 0) return 0;
  let cumLogReturn = 0;
  let peak = 1;
  let maxDD = 0;
  for (const r of returns) {
    cumLogReturn += r;
    const cumVal = Math.exp(cumLogReturn);
    if (cumVal > peak) peak = cumVal;
    const dd = (cumVal / peak) - 1;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD;
}

function computeSkewness(values: number[]): number | null {
  const n = values.length;
  if (n < 3) return null;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  if (std === 0) return null;
  const m3 = values.reduce((a, v) => a + ((v - mean) / std) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * m3;
}

function computeKurtosis(values: number[]): number | null {
  const n = values.length;
  if (n < 4) return null;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  if (std === 0) return null;
  const m4 = values.reduce((a, v) => a + ((v - mean) / std) ** 4, 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * m4 - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}

// =====================================================
// Rolling Metrics (vol, sharpe, beta)
// =====================================================
async function computeRollingMetrics(
  supabase: any,
  params: { symbol: string; from: string; to: string; window?: number }
) {
  const window = params.window || 20;
  const returns = await fetchDailyReturns(supabase, params.from, params.to, [params.symbol]);
  const mktReturns = await fetchUniverseReturns(supabase, params.from, params.to);
  const meta = buildValidationMeta(returns, [params.symbol]);

  const mktMap = new Map(mktReturns.map((m: any) => [m.trade_date, Number(m.market_return)]));

  const rollingVol: { date: string; value: number }[] = [];
  const rollingSharpe: { date: string; value: number }[] = [];
  const rollingBeta: { date: string; value: number }[] = [];

  for (let i = window - 1; i < returns.length; i++) {
    const windowData = returns.slice(i - window + 1, i + 1);
    const rets = windowData.map((d) => d.daily_return);
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const std = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1));
    const annVol = std * Math.sqrt(252);
    // Sharpe: (annualized mean log return) / annualized vol, rf=0 for simplicity
    const annSharpe = std > 0 ? (mean * 252) / annVol : 0;

    rollingVol.push({ date: returns[i].trade_date, value: annVol });
    rollingSharpe.push({ date: returns[i].trade_date, value: annSharpe });

    // Beta vs market
    const mktRets = windowData.map((d) => mktMap.get(d.trade_date) || 0);
    const mktMean = mktRets.reduce((a, b) => a + b, 0) / mktRets.length;
    let cov = 0, varMkt = 0;
    for (let j = 0; j < rets.length; j++) {
      cov += (rets[j] - mean) * (mktRets[j] - mktMean);
      varMkt += (mktRets[j] - mktMean) ** 2;
    }
    const beta = varMkt > 0 ? cov / varMkt : 0;
    rollingBeta.push({ date: returns[i].trade_date, value: beta });
  }

  return { rollingVol, rollingSharpe, rollingBeta, _meta: meta };
}

// =====================================================
// EWMA Volatility
// =====================================================
async function computeEWMA(
  supabase: any,
  params: { symbol: string; from: string; to: string; lambda?: number }
) {
  const lambda = params.lambda || 0.94;
  const returns = await fetchDailyReturns(supabase, params.from, params.to, [params.symbol]);
  const meta = buildValidationMeta(returns, [params.symbol]);

  if (returns.length < 20) return { ewma: [], realized: [], _meta: { ...meta, warnings: ["Need 20+ trading days for EWMA"] } };

  const initRets = returns.slice(0, 20).map((r) => r.daily_return);
  const initMean = initRets.reduce((a, b) => a + b, 0) / initRets.length;
  let variance = initRets.reduce((a, b) => a + (b - initMean) ** 2, 0) / (initRets.length - 1);

  const ewma: { date: string; value: number }[] = [];
  const realized: { date: string; value: number }[] = [];

  for (let i = 20; i < returns.length; i++) {
    variance = lambda * variance + (1 - lambda) * returns[i].daily_return ** 2;
    ewma.push({ date: returns[i].trade_date, value: Math.sqrt(variance * 252) });

    const window = returns.slice(i - 19, i + 1).map((r) => r.daily_return);
    const wMean = window.reduce((a, b) => a + b, 0) / window.length;
    const wStd = Math.sqrt(window.reduce((a, b) => a + (b - wMean) ** 2, 0) / (window.length - 1));
    realized.push({ date: returns[i].trade_date, value: wStd * Math.sqrt(252) });
  }

  return { ewma, realized, _meta: meta };
}

// =====================================================
// Factor Regression
// =====================================================
async function computeFactorRegression(
  supabase: any,
  params: { symbol: string; from: string; to: string }
) {
  const allReturns = await fetchDailyReturns(supabase, params.from, params.to, null);
  const symbolReturns = allReturns.filter((r) => r.symbol === params.symbol);
  const meta = buildValidationMeta(symbolReturns, [params.symbol]);

  if (symbolReturns.length < 20) return { error: "insufficient_data", min: 30, _meta: meta };

  const dateMap = new Map<string, ReturnRow[]>();
  allReturns.forEach((r) => {
    if (!dateMap.has(r.trade_date)) dateMap.set(r.trade_date, []);
    dateMap.get(r.trade_date)!.push(r);
  });

  const symbolDates = new Set(symbolReturns.map((r) => r.trade_date));
  const symbolSector = symbolReturns[0]?.sector;

  const factorData: { date: string; market: number; smb: number; lowVol: number; techSector: number; ownSector: number }[] = [];

  for (const [date, items] of dateMap.entries()) {
    if (!symbolDates.has(date)) continue;

    const rets = items.map((r) => ({ ret: r.daily_return, mcap: r.market_cap || 0, sector: r.sector }));
    const marketRet = rets.reduce((a, b) => a + b.ret, 0) / rets.length;

    const sorted = [...rets].sort((a, b) => a.mcap - b.mcap);
    const q = Math.floor(sorted.length / 5);
    const smallAvg = q > 0 ? sorted.slice(0, q).reduce((a, b) => a + b.ret, 0) / q : 0;
    const bigAvg = q > 0 ? sorted.slice(-q).reduce((a, b) => a + b.ret, 0) / q : 0;

    const volSorted = [...rets].sort((a, b) => Math.abs(a.ret) - Math.abs(b.ret));
    const lowVolAvg = q > 0 ? volSorted.slice(0, q).reduce((a, b) => a + b.ret, 0) / q : 0;
    const highVolAvg = q > 0 ? volSorted.slice(-q).reduce((a, b) => a + b.ret, 0) / q : 0;

    const techItems = rets.filter((r) => r.sector === "Technology");
    const techRet = techItems.length > 0 ? techItems.reduce((a, b) => a + b.ret, 0) / techItems.length : 0;

    const ownItems = rets.filter((r) => r.sector === symbolSector);
    const ownRet = ownItems.length > 0 ? ownItems.reduce((a, b) => a + b.ret, 0) / ownItems.length : 0;

    factorData.push({
      date,
      market: marketRet,
      smb: smallAvg - bigAvg,
      lowVol: lowVolAvg - highVolAvg,
      techSector: techRet,
      ownSector: ownRet,
    });
  }

  const symbolMap = new Map(symbolReturns.map((r) => [r.trade_date, r.daily_return]));
  const aligned = factorData.filter((f) => symbolMap.has(f.date));
  const y = aligned.map((f) => symbolMap.get(f.date)!);
  const X = aligned.map((f) => [f.market, f.smb, f.lowVol, f.techSector, f.ownSector]);

  const factorNames = ["Market Beta", "SMB", "Low Volatility", "Tech/NASDAQ", `Sector (${symbolSector || "Own"})`];

  const reg = olsRegression(y, X);
  if (!reg) return { error: "regression_failed", _meta: meta };

  const factors = factorNames.map((name, i) => ({
    name,
    beta: reg.coefficients[i],
    stdError: reg.stdErrors[i],
    tStat: reg.tStats[i],
    pValue: 2 * (1 - tDistCDF(Math.abs(reg.tStats[i]), reg.n - X[0].length - 1)),
    significant: Math.abs(reg.tStats[i]) > 2,
  }));

  return {
    factors,
    alpha: reg.intercept * 252, // annualized
    r2: reg.r2,
    adjR2: reg.adjR2,
    n: reg.n,
    _meta: meta,
    externalFactors: [
      { name: "Duration (10Y)", status: "external_required" },
      { name: "USD Index", status: "external_required" },
      { name: "Inflation (CPI)", status: "external_required" },
      { name: "Credit Spread", status: "external_required" },
    ],
  };
}

// =====================================================
// Factor Heatmap
// =====================================================
async function computeFactorHeatmap(
  supabase: any,
  params: { from: string; to: string; topN?: number }
) {
  const topN = params.topN || 50;
  const { data: universe } = await supabase
    .from("quant_universe")
    .select("symbol")
    .eq("is_active", true)
    .order("market_cap_rank", { ascending: true })
    .limit(topN);

  if (!universe || universe.length === 0) return { rows: [] };

  const symbols = universe.map((u: any) => u.symbol);
  const allReturns = await fetchDailyReturns(supabase, params.from, params.to, null);

  const mktReturns = new Map<string, number>();
  const dateMap = new Map<string, ReturnRow[]>();
  allReturns.forEach((r) => {
    if (!dateMap.has(r.trade_date)) dateMap.set(r.trade_date, []);
    dateMap.get(r.trade_date)!.push(r);
  });
  for (const [date, items] of dateMap.entries()) {
    mktReturns.set(date, items.reduce((a, b) => a + b.daily_return, 0) / items.length);
  }

  const rows = symbols.map((sym: string) => {
    const symRets = allReturns.filter((r) => r.symbol === sym);
    if (symRets.length < 10) return { symbol: sym, marketBeta: null, sector: symRets[0]?.sector };

    const y = symRets.map((r) => r.daily_return);
    const x = symRets.map((r) => [mktReturns.get(r.trade_date) || 0]);
    const reg = olsRegression(y, x);

    return {
      symbol: sym,
      sector: symRets[0]?.sector,
      marketBeta: reg?.coefficients[0] ?? null,
    };
  });

  return { rows };
}

// =====================================================
// Correlation Matrix
// =====================================================
async function computeCorrelationMatrix(
  supabase: any,
  params: { symbols: string[]; from: string; to: string }
) {
  const returns = await fetchDailyReturns(supabase, params.from, params.to, params.symbols);
  const meta = buildValidationMeta(returns, params.symbols);

  const symbolDates = new Map<string, Map<string, number>>();
  returns.forEach((r) => {
    if (!symbolDates.has(r.symbol)) symbolDates.set(r.symbol, new Map());
    symbolDates.get(r.symbol)!.set(r.trade_date, r.daily_return);
  });

  const symbols = params.symbols.filter((s) => symbolDates.has(s));
  const allDates = new Set<string>();
  symbolDates.forEach((dates) => dates.forEach((_, d) => allDates.add(d)));
  const sortedDates = [...allDates].sort();

  const matrix: { symbolA: string; symbolB: string; correlation: number }[] = [];
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i; j < symbols.length; j++) {
      const aMap = symbolDates.get(symbols[i])!;
      const bMap = symbolDates.get(symbols[j])!;
      const commonDates = sortedDates.filter((d) => aMap.has(d) && bMap.has(d));
      if (commonDates.length < 5) {
        matrix.push({ symbolA: symbols[i], symbolB: symbols[j], correlation: i === j ? 1 : 0 });
        continue;
      }
      const aRets = commonDates.map((d) => aMap.get(d)!);
      const bRets = commonDates.map((d) => bMap.get(d)!);
      const corr = pearsonCorrelation(aRets, bRets);
      matrix.push({ symbolA: symbols[i], symbolB: symbols[j], correlation: corr });
      if (i !== j) matrix.push({ symbolA: symbols[j], symbolB: symbols[i], correlation: corr });
    }
  }

  // Covariance matrix (annualized)
  const covMatrix: { symbolA: string; symbolB: string; covariance: number }[] = [];
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i; j < symbols.length; j++) {
      const aMap = symbolDates.get(symbols[i])!;
      const bMap = symbolDates.get(symbols[j])!;
      const commonDates = sortedDates.filter((d) => aMap.has(d) && bMap.has(d));
      if (commonDates.length < 2) continue;
      const aRets = commonDates.map((d) => aMap.get(d)!);
      const bRets = commonDates.map((d) => bMap.get(d)!);
      const ma = aRets.reduce((a, b) => a + b, 0) / aRets.length;
      const mb = bRets.reduce((a, b) => a + b, 0) / bRets.length;
      const cov = aRets.reduce((s, a, idx) => s + (a - ma) * (bRets[idx] - mb), 0) / (aRets.length - 1) * 252;
      covMatrix.push({ symbolA: symbols[i], symbolB: symbols[j], covariance: cov });
      if (i !== j) covMatrix.push({ symbolA: symbols[j], symbolB: symbols[i], covariance: cov });
    }
  }

  return { symbols, matrix, covMatrix, _meta: meta };
}

// =====================================================
// Pair Analysis
// =====================================================
async function computePairAnalysis(
  supabase: any,
  params: { symbolA: string; symbolB: string; from: string; to: string }
) {
  const closesA = await fetchDailyCloses(supabase, params.from, params.to, [params.symbolA]);
  const closesB = await fetchDailyCloses(supabase, params.from, params.to, [params.symbolB]);

  if (!closesA?.length || !closesB?.length) return { error: "insufficient_data" };

  const aMap = new Map(closesA.map((c: any) => [c.trade_date, Number(c.close_price)]));
  const bMap = new Map(closesB.map((c: any) => [c.trade_date, Number(c.close_price)]));
  const commonDates = [...aMap.keys()].filter((d: string) => bMap.has(d)).sort();

  if (commonDates.length < 30) return { error: "insufficient_data", min: 60, actual: commonDates.length };

  const pricesA = commonDates.map((d: string) => aMap.get(d)!);
  const pricesB = commonDates.map((d: string) => bMap.get(d)!);

  // Log returns for correlation
  const retsA: number[] = [], retsB: number[] = [];
  for (let i = 1; i < pricesA.length; i++) {
    if (pricesA[i] > 0 && pricesA[i - 1] > 0) retsA.push(Math.log(pricesA[i] / pricesA[i - 1]));
    else retsA.push(0);
    if (pricesB[i] > 0 && pricesB[i - 1] > 0) retsB.push(Math.log(pricesB[i] / pricesB[i - 1]));
    else retsB.push(0);
  }

  const pearson = pearsonCorrelation(retsA, retsB);
  const spearman = pearsonCorrelation(getRanks(retsA), getRanks(retsB));

  const reg = olsRegression(pricesA, pricesB.map((b) => [b]));
  const hedgeRatio = reg?.coefficients[0] || 0;

  const spread = commonDates.map((d: string, i: number) => ({
    date: d,
    spread: pricesA[i] - hedgeRatio * pricesB[i],
  }));
  const spreadValues = spread.map((s) => s.spread);
  const spreadMean = spreadValues.reduce((a, b) => a + b, 0) / spreadValues.length;
  const spreadStd = Math.sqrt(spreadValues.reduce((a, b) => a + (b - spreadMean) ** 2, 0) / (spreadValues.length - 1));

  const zScores = spread.map((s) => ({
    date: s.date,
    spread: s.spread,
    zScore: spreadStd > 0 ? (s.spread - spreadMean) / spreadStd : 0,
  }));

  // ADF test
  const spreadLag = spreadValues.slice(0, -1);
  const spreadCurrent = spreadValues.slice(1);
  const diffSpread = spreadCurrent.map((c, i) => c - spreadLag[i]);
  const arReg = olsRegression(diffSpread, spreadLag.map((l) => [l]));
  const adfStat = arReg ? arReg.tStats[0] : 0;
  const adfPValue = adfStat < -3.45 ? 0.01 : adfStat < -2.87 ? 0.05 : adfStat < -2.57 ? 0.1 : 0.5;

  const lambda = arReg?.coefficients[0] || 0;
  const halfLife = lambda < 0 ? -Math.log(2) / lambda : null;

  // Signal log
  const signals: { date: string; event: string; zScore: number; action: string }[] = [];
  let inPosition = false;
  for (const z of zScores) {
    if (!inPosition && Math.abs(z.zScore) >= 2) {
      inPosition = true;
      signals.push({
        date: z.date,
        event: "Entry signal",
        zScore: Math.round(z.zScore * 100) / 100,
        action: z.zScore > 0 ? `Long ${params.symbolB}, Short ${params.symbolA}` : `Long ${params.symbolA}, Short ${params.symbolB}`,
      });
    } else if (inPosition && Math.abs(z.zScore) <= 0.5) {
      inPosition = false;
      signals.push({ date: z.date, event: "Exit signal", zScore: Math.round(z.zScore * 100) / 100, action: "Close positions" });
    }
  }

  return { pearson, spearman, hedgeRatio, spreadMean, spreadStd, adfStat, adfPValue, halfLife, zScores, signals };
}

// =====================================================
// Cointegration Screen
// =====================================================
async function computeCointegrationScreen(
  supabase: any,
  params: { from: string; to: string; topN?: number }
) {
  const topN = params.topN || 50;
  const { data: universe } = await supabase
    .from("quant_universe")
    .select("symbol")
    .eq("is_active", true)
    .order("market_cap_rank", { ascending: true })
    .limit(topN);

  if (!universe || universe.length < 2) return { pairs: [] };

  const symbols = universe.map((u: any) => u.symbol);
  const returns = await fetchDailyReturns(supabase, params.from, params.to, symbols);

  const symbolDates = new Map<string, Map<string, number>>();
  returns.forEach((r) => {
    if (!symbolDates.has(r.symbol)) symbolDates.set(r.symbol, new Map());
    symbolDates.get(r.symbol)!.set(r.trade_date, r.daily_return);
  });

  const availableSymbols = symbols.filter((s: string) => symbolDates.has(s));
  const pairs: { symbolA: string; symbolB: string; correlation: number }[] = [];

  for (let i = 0; i < availableSymbols.length; i++) {
    for (let j = i + 1; j < availableSymbols.length; j++) {
      const aMap = symbolDates.get(availableSymbols[i])!;
      const bMap = symbolDates.get(availableSymbols[j])!;
      const common = [...aMap.keys()].filter((d) => bMap.has(d));
      if (common.length < 10) continue;
      const aRets = common.map((d) => aMap.get(d)!);
      const bRets = common.map((d) => bMap.get(d)!);
      pairs.push({ symbolA: availableSymbols[i], symbolB: availableSymbols[j], correlation: pearsonCorrelation(aRets, bRets) });
    }
  }

  pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  return { pairs: pairs.slice(0, 20) };
}

// =====================================================
// Intraday Momentum
// =====================================================
async function computeIntradayMomentum(
  supabase: any,
  params: { from: string; to: string }
) {
  const { data: quotes } = await supabase
    .from("quant_quotes")
    .select("symbol, timestamp_minute, price")
    .gte("timestamp_minute", `${params.from}T00:00:00Z`)
    .lte("timestamp_minute", `${params.to}T23:59:59Z`)
    .order("timestamp_minute", { ascending: true })
    .limit(100000);

  if (!quotes || quotes.length === 0) return { correlation: 0, dataPoints: [], _meta: { observations: 0, warnings: ["No intraday data"] } };

  const groups = new Map<string, { time: Date; price: number }[]>();
  quotes.forEach((q: any) => {
    const dt = new Date(q.timestamp_minute);
    const dateKey = `${q.symbol}|${dt.toISOString().slice(0, 10)}`;
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey)!.push({ time: dt, price: Number(q.price) });
  });

  const dataPoints: { firstHour: number; lastHour: number }[] = [];
  for (const [, prices] of groups.entries()) {
    if (prices.length < 10) continue;
    prices.sort((a, b) => a.time.getTime() - b.time.getTime());

    const first = prices[0];
    const afterHour = prices.find((p) => p.time.getTime() - first.time.getTime() >= 3600000);
    if (!afterHour || first.price === 0) continue;
    // Use log return
    const firstHourReturn = Math.log(afterHour.price / first.price);

    const last = prices[prices.length - 1];
    const beforeLastHour = prices.find(
      (p) => last.time.getTime() - p.time.getTime() >= 3600000 && last.time.getTime() - p.time.getTime() <= 7200000
    );
    if (!beforeLastHour || beforeLastHour.price === 0) continue;
    const lastHourReturn = Math.log(last.price / beforeLastHour.price);

    dataPoints.push({ firstHour: firstHourReturn, lastHour: lastHourReturn });
  }

  const corr = dataPoints.length > 5
    ? pearsonCorrelation(dataPoints.map((d) => d.firstHour), dataPoints.map((d) => d.lastHour))
    : 0;

  return { correlation: corr, dataPoints: dataPoints.slice(0, 500), _meta: { observations: dataPoints.length } };
}

// =====================================================
// MOC Pressure
// =====================================================
async function computeMOCPressure(
  supabase: any,
  params: { from: string; to: string }
) {
  const { data: quotes } = await supabase
    .from("quant_quotes")
    .select("symbol, timestamp_minute, price")
    .gte("timestamp_minute", `${params.from}T00:00:00Z`)
    .lte("timestamp_minute", `${params.to}T23:59:59Z`)
    .order("symbol")
    .order("timestamp_minute", { ascending: true })
    .limit(100000);

  if (!quotes || quotes.length === 0) return { symbols: [] };

  const bySymbol = new Map<string, { time: Date; price: number }[]>();
  quotes.forEach((q: any) => {
    if (!bySymbol.has(q.symbol)) bySymbol.set(q.symbol, []);
    bySymbol.get(q.symbol)!.push({ time: new Date(q.timestamp_minute), price: Number(q.price) });
  });

  const results: { symbol: string; lateVol: number; earlyVol: number; volRatio: number }[] = [];

  for (const [symbol, prices] of bySymbol.entries()) {
    prices.sort((a, b) => a.time.getTime() - b.time.getTime());
    const lateReturns: number[] = [];
    const earlyReturns: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1].price <= 0 || prices[i].price <= 0) continue;
      const ret = Math.abs(Math.log(prices[i].price / prices[i - 1].price));
      const etHour = new Date(prices[i].time.toLocaleString("en-US", { timeZone: "America/New_York" })).getHours();
      const etMin = new Date(prices[i].time.toLocaleString("en-US", { timeZone: "America/New_York" })).getMinutes();

      if (etHour === 15 && etMin >= 45) {
        lateReturns.push(ret);
      } else {
        earlyReturns.push(ret);
      }
    }

    const lateVol = lateReturns.length > 0 ? lateReturns.reduce((a, b) => a + b, 0) / lateReturns.length : 0;
    const earlyVol = earlyReturns.length > 0 ? earlyReturns.reduce((a, b) => a + b, 0) / earlyReturns.length : 0;

    results.push({ symbol, lateVol, earlyVol, volRatio: earlyVol > 0 ? lateVol / earlyVol : 0 });
  }

  results.sort((a, b) => b.volRatio - a.volRatio);
  return { symbols: results.slice(0, 100) };
}

// =====================================================
// PORTFOLIO MODE (NEW)
// Equal-weight portfolio from selected symbols
// =====================================================
async function computePortfolioStats(
  supabase: any,
  params: { symbols: string[]; from: string; to: string }
) {
  if (!params.symbols || params.symbols.length < 2) {
    return { error: "Need at least 2 symbols for portfolio mode" };
  }

  const returns = await fetchDailyReturns(supabase, params.from, params.to, params.symbols);
  const meta = buildValidationMeta(returns, params.symbols);

  // Build date-aligned return matrix
  const symbolReturns = new Map<string, Map<string, number>>();
  returns.forEach((r) => {
    if (!symbolReturns.has(r.symbol)) symbolReturns.set(r.symbol, new Map());
    symbolReturns.get(r.symbol)!.set(r.trade_date, r.daily_return);
  });

  const symbols = params.symbols.filter((s) => symbolReturns.has(s));
  if (symbols.length < 2) return { error: "Insufficient data for portfolio", _meta: meta };

  const n = symbols.length;
  const w = 1 / n; // equal weight

  // Get all dates where ALL symbols have data
  const allDates = new Set<string>();
  symbolReturns.forEach((dates) => dates.forEach((_, d) => allDates.add(d)));
  const commonDates = [...allDates]
    .filter((d) => symbols.every((s) => symbolReturns.get(s)?.has(d)))
    .sort();

  if (commonDates.length < 2) return { error: "Not enough common trading days", _meta: meta };

  // Equal-weight portfolio log returns (approximate: sum of weighted log returns)
  const portfolioReturns = commonDates.map((d) => {
    const dayRets = symbols.map((s) => symbolReturns.get(s)!.get(d)!);
    // For equal-weight: portfolio simple return ≈ avg of simple returns
    // Convert log to simple, average, convert back to log
    const simpleRets = dayRets.map((lr) => Math.exp(lr) - 1);
    const portfolioSimple = simpleRets.reduce((a, b) => a + b, 0) / n;
    return { date: d, logReturn: Math.log(1 + portfolioSimple) };
  });

  const logRets = portfolioReturns.map((p) => p.logReturn);
  const meanDaily = logRets.reduce((a, b) => a + b, 0) / logRets.length;
  const stdDaily = Math.sqrt(logRets.reduce((a, b) => a + (b - meanDaily) ** 2, 0) / (logRets.length - 1));

  const cumReturn = Math.exp(logRets.reduce((a, b) => a + b, 0)) - 1;
  const annReturn = Math.exp(meanDaily * 252) - 1;
  const annVol = stdDaily * Math.sqrt(252);
  const sharpe = annVol > 0 ? annReturn / annVol : null;
  const maxDD = computeMaxDrawdown(logRets);
  const skew = computeSkewness(logRets);
  const kurt = computeKurtosis(logRets);

  // Validate: portfolio variance = w' Σ w
  // Build covariance matrix
  const covMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const iMap = symbolReturns.get(symbols[i])!;
      const jMap = symbolReturns.get(symbols[j])!;
      const iRets = commonDates.map((d) => iMap.get(d)!);
      const jRets = commonDates.map((d) => jMap.get(d)!);
      const mi = iRets.reduce((a, b) => a + b, 0) / iRets.length;
      const mj = jRets.reduce((a, b) => a + b, 0) / jRets.length;
      const cov = iRets.reduce((s, a, idx) => s + (a - mi) * (jRets[idx] - mj), 0) / (iRets.length - 1);
      covMatrix[i][j] = cov;
      covMatrix[j][i] = cov;
    }
  }

  // w' Σ w
  let portfolioVariance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      portfolioVariance += w * w * covMatrix[i][j];
    }
  }
  const portfolioVolFromCov = Math.sqrt(portfolioVariance * 252);

  // Cumulative curve
  const cumulativeCurve = portfolioReturns.reduce((acc: { date: string; cumReturn: number }[], p, idx) => {
    const prev = idx > 0 ? acc[idx - 1].cumReturn : 0;
    acc.push({ date: p.date, cumReturn: prev + p.logReturn });
    return acc;
  }, []).map((c) => ({ date: c.date, cumReturn: Math.exp(c.cumReturn) - 1 }));

  return {
    symbols,
    weights: symbols.map((s) => ({ symbol: s, weight: w })),
    tradingDays: commonDates.length,
    cumReturn,
    annReturn,
    annVol,
    annVolFromCov: portfolioVolFromCov,
    sharpe,
    maxDrawdown: maxDD,
    skewness: skew,
    kurtosis: kurt,
    cumulativeCurve,
    _meta: meta,
    _validation: {
      vol_empirical: annVol,
      vol_from_covariance: portfolioVolFromCov,
      vol_difference_pct: annVol > 0 ? Math.abs(annVol - portfolioVolFromCov) / annVol * 100 : 0,
    },
  };
}
