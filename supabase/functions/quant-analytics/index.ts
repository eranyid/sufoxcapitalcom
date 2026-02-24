import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Cache result (valid until end of current trading day)
    const now = new Date();
    const validUntil = new Date(now);
    validUntil.setUTCHours(21, 0, 0, 0); // 4PM ET = 21:00 UTC
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
// Helper: fetch daily returns from RPC
// =====================================================
async function fetchDailyReturns(
  supabase: any,
  from: string,
  to: string,
  symbols?: string[]
) {
  const { data, error } = await supabase.rpc("quant_daily_returns", {
    p_from: from,
    p_to: to,
    p_symbols: symbols || null,
  });
  if (error) throw error;
  return data || [];
}

async function fetchUniverseReturns(
  supabase: any,
  from: string,
  to: string
) {
  const { data, error } = await supabase.rpc("quant_universe_returns", {
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return data || [];
}

// =====================================================
// OLS Regression helper
// =====================================================
function olsRegression(y: number[], X: number[][]) {
  const n = y.length;
  const k = X[0]?.length || 0;
  if (n < k + 2) return null;

  // Add intercept column
  const Xa = X.map((row) => [1, ...row]);
  const kk = k + 1;

  // X'X
  const XtX: number[][] = Array.from({ length: kk }, () =>
    Array(kk).fill(0)
  );
  const Xty: number[] = Array(kk).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < kk; j++) {
      Xty[j] += Xa[i][j] * y[i];
      for (let l = 0; l < kk; l++) {
        XtX[j][l] += Xa[i][j] * Xa[i][l];
      }
    }
  }

  // Solve via Gaussian elimination
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

  // Residuals and R²
  let ssTot = 0,
    ssRes = 0;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) {
    let yHat = 0;
    for (let j = 0; j < kk; j++) {
      yHat += Xa[i][j] * betas[j];
    }
    ssRes += (y[i] - yHat) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }

  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const adjR2 =
    n > kk ? 1 - ((1 - r2) * (n - 1)) / (n - kk) : r2;

  // Standard errors
  const mse = ssRes / (n - kk);
  // Compute (X'X)^-1 diagonal for SE
  const XtXinv = invertMatrix(XtX);
  const stdErrors = XtXinv
    ? betas.map((_, i) => Math.sqrt(Math.max(0, mse * XtXinv[i][i])))
    : betas.map(() => 0);
  const tStats = betas.map((b, i) =>
    stdErrors[i] > 0 ? b / stdErrors[i] : 0
  );

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

// =====================================================
// Rolling Metrics (vol, sharpe, beta)
// =====================================================
async function computeRollingMetrics(
  supabase: any,
  params: { symbol: string; from: string; to: string; window?: number }
) {
  const window = params.window || 20;
  const returns = await fetchDailyReturns(supabase, params.from, params.to, [
    params.symbol,
  ]);
  const mktReturns = await fetchUniverseReturns(
    supabase,
    params.from,
    params.to
  );

  const symbolReturns = returns
    .filter((r: any) => r.daily_return !== null)
    .map((r: any) => ({
      date: r.trade_date,
      ret: Number(r.daily_return),
    }));

  const mktMap = new Map(
    mktReturns.map((m: any) => [m.trade_date, Number(m.market_return)])
  );

  const rollingVol: { date: string; value: number }[] = [];
  const rollingSharpe: { date: string; value: number }[] = [];
  const rollingBeta: { date: string; value: number }[] = [];

  for (let i = window - 1; i < symbolReturns.length; i++) {
    const windowData = symbolReturns.slice(i - window + 1, i + 1);
    const rets = windowData.map((d: any) => d.ret);
    const mean = rets.reduce((a: number, b: number) => a + b, 0) / rets.length;
    const std = Math.sqrt(
      rets.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) /
        (rets.length - 1)
    );
    const annVol = std * Math.sqrt(252);
    const annSharpe = std > 0 ? (mean * 252 - 0.045) / annVol : 0;

    rollingVol.push({ date: symbolReturns[i].date, value: annVol });
    rollingSharpe.push({ date: symbolReturns[i].date, value: annSharpe });

    // Beta
    const mktRets = windowData.map((d: any) => mktMap.get(d.date) || 0);
    const mktMean =
      mktRets.reduce((a: number, b: number) => a + b, 0) / mktRets.length;
    let cov = 0,
      varMkt = 0;
    for (let j = 0; j < rets.length; j++) {
      cov += (rets[j] - mean) * (mktRets[j] - mktMean);
      varMkt += (mktRets[j] - mktMean) ** 2;
    }
    const beta = varMkt > 0 ? cov / varMkt : 0;
    rollingBeta.push({ date: symbolReturns[i].date, value: beta });
  }

  return { rollingVol, rollingSharpe, rollingBeta };
}

// =====================================================
// EWMA Volatility
// =====================================================
async function computeEWMA(
  supabase: any,
  params: { symbol: string; from: string; to: string; lambda?: number }
) {
  const lambda = params.lambda || 0.94;
  const returns = await fetchDailyReturns(supabase, params.from, params.to, [
    params.symbol,
  ]);
  const rets = returns
    .filter((r: any) => r.daily_return !== null)
    .map((r: any) => ({
      date: r.trade_date,
      ret: Number(r.daily_return),
    }));

  if (rets.length < 20) return { ewma: [], realized: [] };

  // Initialize with variance of first 20 returns
  const initRets = rets.slice(0, 20).map((r: any) => r.ret);
  const initMean =
    initRets.reduce((a: number, b: number) => a + b, 0) / initRets.length;
  let variance =
    initRets.reduce((a: number, b: number) => a + (b - initMean) ** 2, 0) /
    (initRets.length - 1);

  const ewma: { date: string; value: number }[] = [];
  const realized: { date: string; value: number }[] = [];

  for (let i = 20; i < rets.length; i++) {
    variance = lambda * variance + (1 - lambda) * rets[i].ret ** 2;
    ewma.push({ date: rets[i].date, value: Math.sqrt(variance * 252) });

    // Rolling 20-day realized vol
    const window = rets.slice(i - 19, i + 1).map((r: any) => r.ret);
    const wMean =
      window.reduce((a: number, b: number) => a + b, 0) / window.length;
    const wStd = Math.sqrt(
      window.reduce((a: number, b: number) => a + (b - wMean) ** 2, 0) /
        (window.length - 1)
    );
    realized.push({ date: rets[i].date, value: wStd * Math.sqrt(252) });
  }

  return { ewma, realized };
}

// =====================================================
// Factor Regression
// =====================================================
async function computeFactorRegression(
  supabase: any,
  params: { symbol: string; from: string; to: string }
) {
  const allReturns = await fetchDailyReturns(
    supabase,
    params.from,
    params.to,
    null
  );
  const symbolReturns = allReturns.filter(
    (r: any) => r.symbol === params.symbol && r.daily_return !== null
  );
  if (symbolReturns.length < 20) return { error: "insufficient_data", min: 30 };

  // Group by date
  const dateMap = new Map<string, any[]>();
  allReturns
    .filter((r: any) => r.daily_return !== null)
    .forEach((r: any) => {
      if (!dateMap.has(r.trade_date)) dateMap.set(r.trade_date, []);
      dateMap.get(r.trade_date)!.push(r);
    });

  // Build factor returns per date
  const symbolDates = new Set(symbolReturns.map((r: any) => r.trade_date));
  const factorData: {
    date: string;
    market: number;
    smb: number;
    momentum: number;
    lowVol: number;
    techSector: number;
    ownSector: number;
  }[] = [];

  const symbolSector = symbolReturns[0]?.sector;

  for (const [date, items] of dateMap.entries()) {
    if (!symbolDates.has(date)) continue;

    const rets = items.map((r: any) => ({
      ret: Number(r.daily_return),
      mcap: Number(r.market_cap || 0),
      sector: r.sector,
    }));

    // Market beta = equal-weight universe
    const marketRet =
      rets.reduce((a: number, b: any) => a + b.ret, 0) / rets.length;

    // SMB: sort by mcap, bottom quintile - top quintile
    const sorted = [...rets].sort((a, b) => a.mcap - b.mcap);
    const q = Math.floor(sorted.length / 5);
    const smallAvg =
      q > 0
        ? sorted.slice(0, q).reduce((a: number, b: any) => a + b.ret, 0) / q
        : 0;
    const bigAvg =
      q > 0
        ? sorted
            .slice(-q)
            .reduce((a: number, b: any) => a + b.ret, 0) / q
        : 0;
    const smb = smallAvg - bigAvg;

    // Momentum: use 1M return to rank (simplified: random factor here — in practice you'd need lagged returns)
    // For now, just use 0 as placeholder since we don't have lagged momentum in this query
    const momentum = 0;

    // Low Vol: sort by abs(ret), low quintile - high quintile
    const volSorted = [...rets].sort(
      (a, b) => Math.abs(a.ret) - Math.abs(b.ret)
    );
    const lowVolAvg =
      q > 0
        ? volSorted
            .slice(0, q)
            .reduce((a: number, b: any) => a + b.ret, 0) / q
        : 0;
    const highVolAvg =
      q > 0
        ? volSorted
            .slice(-q)
            .reduce((a: number, b: any) => a + b.ret, 0) / q
        : 0;
    const lowVol = lowVolAvg - highVolAvg;

    // Tech sector return
    const techItems = rets.filter((r) => r.sector === "Technology");
    const techRet =
      techItems.length > 0
        ? techItems.reduce((a: number, b: any) => a + b.ret, 0) /
          techItems.length
        : 0;

    // Own sector return
    const ownItems = rets.filter((r) => r.sector === symbolSector);
    const ownRet =
      ownItems.length > 0
        ? ownItems.reduce((a: number, b: any) => a + b.ret, 0) /
          ownItems.length
        : 0;

    factorData.push({
      date,
      market: marketRet,
      smb,
      momentum,
      lowVol,
      techSector: techRet,
      ownSector: ownRet,
    });
  }

  // Align symbol returns with factor data
  const symbolMap = new Map(
    symbolReturns.map((r: any) => [r.trade_date, Number(r.daily_return)])
  );
  const aligned = factorData.filter((f) => symbolMap.has(f.date));
  const y = aligned.map((f) => symbolMap.get(f.date)!);
  const X = aligned.map((f) => [
    f.market,
    f.smb,
    f.momentum,
    f.lowVol,
    f.techSector,
    f.ownSector,
  ]);

  const factorNames = [
    "Market Beta",
    "SMB",
    "Momentum",
    "Low Volatility",
    "Tech/NASDAQ",
    `Sector (${symbolSector || "Own"})`,
  ];

  const reg = olsRegression(y, X);
  if (!reg) return { error: "regression_failed" };

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
    alpha: reg.intercept * 252,
    r2: reg.r2,
    adjR2: reg.adjR2,
    n: reg.n,
    externalFactors: [
      { name: "Duration (10Y)", status: "external_required" },
      { name: "USD Index", status: "external_required" },
      { name: "Inflation (CPI)", status: "external_required" },
      { name: "Credit Spread", status: "external_required" },
    ],
  };
}

// Simple t-distribution CDF approximation
function tDistCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(x, df / 2, 0.5);
}

function incompleteBeta(x: number, a: number, b: number): number {
  // Simple approximation using continued fraction
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt =
    Math.exp(
      a * Math.log(x) +
        b * Math.log(1 - x) -
        lnGamma(a) -
        lnGamma(b) +
        lnGamma(a + b)
    );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaCF(x, a, b)) / a;
  }
  return 1 - (bt * betaCF(1 - x, b, a)) / b;
}

function betaCF(x: number, a: number, b: number): number {
  const maxIter = 100;
  const eps = 1e-10;
  let qab = a + b,
    qap = a + 1,
    qam = a - 1;
  let c = 1,
    d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function lnGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x,
    tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// =====================================================
// Factor Heatmap (top N symbols × factors)
// =====================================================
async function computeFactorHeatmap(
  supabase: any,
  params: { from: string; to: string; topN?: number }
) {
  const topN = params.topN || 50;
  // Get unique symbols sorted by market cap rank
  const { data: universe } = await supabase
    .from("quant_universe")
    .select("symbol")
    .eq("is_active", true)
    .order("market_cap_rank", { ascending: true })
    .limit(topN);
  
  if (!universe || universe.length === 0) return { rows: [] };
  
  const symbols = universe.map((u: any) => u.symbol);
  const allReturns = await fetchDailyReturns(supabase, params.from, params.to, null);
  
  // Build simplified factor betas per symbol
  const dateMap = new Map<string, any[]>();
  allReturns.filter((r: any) => r.daily_return !== null).forEach((r: any) => {
    if (!dateMap.has(r.trade_date)) dateMap.set(r.trade_date, []);
    dateMap.get(r.trade_date)!.push(r);
  });

  // Compute market return per date
  const mktReturns = new Map<string, number>();
  for (const [date, items] of dateMap.entries()) {
    mktReturns.set(date, items.reduce((a: number, b: any) => a + Number(b.daily_return), 0) / items.length);
  }

  const rows = symbols.map((sym: string) => {
    const symRets = allReturns.filter((r: any) => r.symbol === sym && r.daily_return !== null);
    if (symRets.length < 10) return { symbol: sym, marketBeta: null, sector: symRets[0]?.sector };
    
    const y = symRets.map((r: any) => Number(r.daily_return));
    const x = symRets.map((r: any) => [mktReturns.get(r.trade_date) || 0]);
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
  params: { symbols: string[]; from: string; to: string; rolling?: boolean }
) {
  const returns = await fetchDailyReturns(
    supabase,
    params.from,
    params.to,
    params.symbols
  );

  // Build date-aligned return matrix
  const symbolDates = new Map<string, Map<string, number>>();
  returns
    .filter((r: any) => r.daily_return !== null)
    .forEach((r: any) => {
      if (!symbolDates.has(r.symbol))
        symbolDates.set(r.symbol, new Map());
      symbolDates.get(r.symbol)!.set(r.trade_date, Number(r.daily_return));
    });

  const symbols = params.symbols.filter((s) => symbolDates.has(s));
  const allDates = new Set<string>();
  symbolDates.forEach((dates) => dates.forEach((_, d) => allDates.add(d)));
  const sortedDates = [...allDates].sort();

  // Compute pairwise correlations
  const matrix: { symbolA: string; symbolB: string; correlation: number }[] = [];
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i; j < symbols.length; j++) {
      const aMap = symbolDates.get(symbols[i])!;
      const bMap = symbolDates.get(symbols[j])!;
      const commonDates = sortedDates.filter(
        (d) => aMap.has(d) && bMap.has(d)
      );
      if (commonDates.length < 5) {
        matrix.push({
          symbolA: symbols[i],
          symbolB: symbols[j],
          correlation: i === j ? 1 : 0,
        });
        continue;
      }
      const aRets = commonDates.map((d) => aMap.get(d)!);
      const bRets = commonDates.map((d) => bMap.get(d)!);
      const corr = pearsonCorrelation(aRets, bRets);
      matrix.push({
        symbolA: symbols[i],
        symbolB: symbols[j],
        correlation: corr,
      });
      if (i !== j) {
        matrix.push({
          symbolA: symbols[j],
          symbolB: symbols[i],
          correlation: corr,
        });
      }
    }
  }

  return { symbols, matrix };
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let cov = 0,
    sx = 0,
    sy = 0;
  for (let i = 0; i < n; i++) {
    cov += (x[i] - mx) * (y[i] - my);
    sx += (x[i] - mx) ** 2;
    sy += (y[i] - my) ** 2;
  }
  const denom = Math.sqrt(sx * sy);
  return denom > 0 ? cov / denom : 0;
}

// =====================================================
// Pair Analysis
// =====================================================
async function computePairAnalysis(
  supabase: any,
  params: { symbolA: string; symbolB: string; from: string; to: string }
) {
  const { data: closesA } = await supabase.rpc("quant_daily_closes", {
    p_from: params.from,
    p_to: params.to,
    p_symbols: [params.symbolA],
  });
  const { data: closesB } = await supabase.rpc("quant_daily_closes", {
    p_from: params.from,
    p_to: params.to,
    p_symbols: [params.symbolB],
  });

  if (!closesA?.length || !closesB?.length)
    return { error: "insufficient_data" };

  const aMap = new Map(
    closesA.map((c: any) => [c.trade_date, Number(c.close_price)])
  );
  const bMap = new Map(
    closesB.map((c: any) => [c.trade_date, Number(c.close_price)])
  );
  const commonDates = [...aMap.keys()].filter((d) => bMap.has(d)).sort();
  if (commonDates.length < 30)
    return { error: "insufficient_data", min: 60 };

  const pricesA = commonDates.map((d) => aMap.get(d)!);
  const pricesB = commonDates.map((d) => bMap.get(d)!);

  // Returns for correlation
  const retsA: number[] = [],
    retsB: number[] = [];
  for (let i = 1; i < pricesA.length; i++) {
    retsA.push((pricesA[i] - pricesA[i - 1]) / pricesA[i - 1]);
    retsB.push((pricesB[i] - pricesB[i - 1]) / pricesB[i - 1]);
  }

  const pearson = pearsonCorrelation(retsA, retsB);

  // Spearman (rank correlation)
  const rankA = getRanks(retsA);
  const rankB = getRanks(retsB);
  const spearman = pearsonCorrelation(rankA, rankB);

  // Hedge ratio via OLS: priceA = alpha + beta * priceB
  const reg = olsRegression(pricesA, pricesB.map((b) => [b]));
  const hedgeRatio = reg?.coefficients[0] || 0;

  // Spread
  const spread = commonDates.map((d, i) => ({
    date: d,
    spread: pricesA[i] - hedgeRatio * pricesB[i],
  }));
  const spreadValues = spread.map((s) => s.spread);
  const spreadMean =
    spreadValues.reduce((a, b) => a + b, 0) / spreadValues.length;
  const spreadStd = Math.sqrt(
    spreadValues.reduce((a, b) => a + (b - spreadMean) ** 2, 0) /
      (spreadValues.length - 1)
  );

  // Z-scores
  const zScores = spread.map((s) => ({
    date: s.date,
    spread: s.spread,
    zScore: spreadStd > 0 ? (s.spread - spreadMean) / spreadStd : 0,
  }));

  // Simplified ADF test (AR(1) on spread, test if coefficient < 1)
  const spreadLag = spreadValues.slice(0, -1);
  const spreadCurrent = spreadValues.slice(1);
  const diffSpread = spreadCurrent.map((c, i) => c - spreadLag[i]);
  const arReg = olsRegression(diffSpread, spreadLag.map((l) => [l]));
  const adfStat = arReg ? arReg.tStats[0] : 0;
  // Approximate p-value (very rough)
  const adfPValue =
    adfStat < -3.45 ? 0.01 : adfStat < -2.87 ? 0.05 : adfStat < -2.57 ? 0.1 : 0.5;

  // Half-life
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
        action:
          z.zScore > 0
            ? `Long ${params.symbolB}, Short ${params.symbolA}`
            : `Long ${params.symbolA}, Short ${params.symbolB}`,
      });
    } else if (inPosition && Math.abs(z.zScore) <= 0.5) {
      inPosition = false;
      signals.push({
        date: z.date,
        event: "Exit signal",
        zScore: Math.round(z.zScore * 100) / 100,
        action: "Close positions",
      });
    }
  }

  return {
    pearson,
    spearman,
    hedgeRatio,
    spreadMean,
    spreadStd,
    adfStat,
    adfPValue,
    halfLife,
    zScores,
    signals,
  };
}

function getRanks(arr: number[]): number[] {
  const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  sorted.forEach((s, rank) => (ranks[s.i] = rank + 1));
  return ranks;
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
  const returns = await fetchDailyReturns(
    supabase,
    params.from,
    params.to,
    symbols
  );

  // Build date-aligned returns
  const symbolDates = new Map<string, Map<string, number>>();
  returns
    .filter((r: any) => r.daily_return !== null)
    .forEach((r: any) => {
      if (!symbolDates.has(r.symbol))
        symbolDates.set(r.symbol, new Map());
      symbolDates.get(r.symbol)!.set(r.trade_date, Number(r.daily_return));
    });

  const availableSymbols = symbols.filter((s: string) => symbolDates.has(s));
  const pairs: { symbolA: string; symbolB: string; correlation: number }[] = [];

  // Compute pairwise correlations (top 20 most correlated)
  for (let i = 0; i < availableSymbols.length; i++) {
    for (let j = i + 1; j < availableSymbols.length; j++) {
      const aMap = symbolDates.get(availableSymbols[i])!;
      const bMap = symbolDates.get(availableSymbols[j])!;
      const common = [...aMap.keys()].filter((d) => bMap.has(d));
      if (common.length < 30) continue;
      const aRets = common.map((d) => aMap.get(d)!);
      const bRets = common.map((d) => bMap.get(d)!);
      const corr = pearsonCorrelation(aRets, bRets);
      pairs.push({
        symbolA: availableSymbols[i],
        symbolB: availableSymbols[j],
        correlation: corr,
      });
    }
  }

  pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  return { pairs: pairs.slice(0, 20) };
}

// =====================================================
// Intraday Momentum (first hour vs last hour)
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

  if (!quotes || quotes.length === 0) return { correlation: 0, dataPoints: [] };

  // Group by (symbol, date)
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

    // First hour: first price vs price ~60 min later
    const first = prices[0];
    const afterHour = prices.find(
      (p) => p.time.getTime() - first.time.getTime() >= 3600000
    );
    if (!afterHour || first.price === 0) continue;
    const firstHourReturn = (afterHour.price - first.price) / first.price;

    // Last hour: price ~2h before last vs last
    const last = prices[prices.length - 1];
    const beforeLastHour = prices.find(
      (p) =>
        last.time.getTime() - p.time.getTime() >= 3600000 &&
        last.time.getTime() - p.time.getTime() <= 7200000
    );
    if (!beforeLastHour || beforeLastHour.price === 0) continue;
    const lastHourReturn =
      (last.price - beforeLastHour.price) / beforeLastHour.price;

    dataPoints.push({ firstHour: firstHourReturn, lastHour: lastHourReturn });
  }

  const corr =
    dataPoints.length > 5
      ? pearsonCorrelation(
          dataPoints.map((d) => d.firstHour),
          dataPoints.map((d) => d.lastHour)
        )
      : 0;

  return { correlation: corr, dataPoints: dataPoints.slice(0, 500) };
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

  // Group by symbol
  const bySymbol = new Map<string, { time: Date; price: number }[]>();
  quotes.forEach((q: any) => {
    if (!bySymbol.has(q.symbol)) bySymbol.set(q.symbol, []);
    bySymbol.get(q.symbol)!.push({
      time: new Date(q.timestamp_minute),
      price: Number(q.price),
    });
  });

  const results: {
    symbol: string;
    lateVol: number;
    earlyVol: number;
    volRatio: number;
  }[] = [];

  for (const [symbol, prices] of bySymbol.entries()) {
    prices.sort((a, b) => a.time.getTime() - b.time.getTime());
    const lateReturns: number[] = [];
    const earlyReturns: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1].price === 0) continue;
      const ret = Math.abs(
        (prices[i].price - prices[i - 1].price) / prices[i - 1].price
      );
      const etHour = new Date(
        prices[i].time.toLocaleString("en-US", {
          timeZone: "America/New_York",
        })
      ).getHours();
      const etMin = new Date(
        prices[i].time.toLocaleString("en-US", {
          timeZone: "America/New_York",
        })
      ).getMinutes();

      if (etHour === 15 && etMin >= 45) {
        lateReturns.push(ret);
      } else {
        earlyReturns.push(ret);
      }
    }

    const lateVol =
      lateReturns.length > 0
        ? lateReturns.reduce((a, b) => a + b, 0) / lateReturns.length
        : 0;
    const earlyVol =
      earlyReturns.length > 0
        ? earlyReturns.reduce((a, b) => a + b, 0) / earlyReturns.length
        : 0;

    results.push({
      symbol,
      lateVol,
      earlyVol,
      volRatio: earlyVol > 0 ? lateVol / earlyVol : 0,
    });
  }

  results.sort((a, b) => b.volRatio - a.volRatio);
  return { symbols: results.slice(0, 100) };
}
