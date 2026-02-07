import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";

interface HoldingRow {
  ticker: string;
  asset_currency: string;
  quantity: number;
  client_id: string | null;
}

interface FinnhubCandle {
  c: number[];
  h: number[];
  l: number[];
  o: number[];
  v: number[];
  t: number[];
  s: string;
}

function detectMarket(symbol: string): "US" | "IL" {
  return /^\d+$/.test(symbol.trim()) ? "IL" : "US";
}

function toFinnhubSymbol(symbol: string, market: "US" | "IL"): string {
  return market === "IL" ? `TASE:${symbol}` : symbol.toUpperCase();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    
    // Create admin client for DB operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    // Create user client for auth
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: userData, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !userData?.user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const body = await req.json().catch(() => ({}));
    const forceRefresh = body.forceRefresh === true;
    const clientId = body.clientId || null;

    console.log(`[fetch-market-prices] User: ${userId}, clientId: ${clientId}, force: ${forceRefresh}`);

    // 1. Get user holdings
    let holdingsQuery = supabaseAdmin
      .from("holdings_snapshot")
      .select("ticker, asset_currency, quantity, client_id")
      .eq("user_id", userId)
      .gt("quantity", 0);

    if (clientId) {
      holdingsQuery = holdingsQuery.eq("client_id", clientId);
    }

    const { data: holdings, error: holdingsErr } = await holdingsQuery;
    if (holdingsErr) {
      console.error("Holdings error:", holdingsErr);
      throw new Error(`Failed to fetch holdings: ${holdingsErr.message}`);
    }

    if (!holdings || holdings.length === 0) {
      console.log("No holdings found");
      return new Response(JSON.stringify({ prices: [], message: "No holdings found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[fetch-market-prices] Found ${holdings.length} holdings`);

    const today = todayStr();

    // 2. Check cache for today's prices (skip if force refresh)
    let cachedSymbols = new Set<string>();
    let cachedPrices: any[] = [];
    
    if (!forceRefresh) {
      const { data: cached } = await supabaseAdmin
        .from("market_prices")
        .select("*")
        .eq("user_id", userId)
        .eq("price_date", today);

      if (cached && cached.length > 0) {
        cachedPrices = cached;
        cachedSymbols = new Set(cached.map((c: any) => c.symbol));
      }
    }

    // 3. Find symbols that need fetching
    const uniqueHoldings = new Map<string, HoldingRow>();
    for (const h of holdings as HoldingRow[]) {
      if (!cachedSymbols.has(h.ticker)) {
        uniqueHoldings.set(h.ticker, h);
      }
    }

    console.log(`[fetch-market-prices] Cached: ${cachedSymbols.size}, To fetch: ${uniqueHoldings.size}`);

    // 4. Fetch from Finnhub with rate limiting (30 req/sec free tier)
    const fetchedPrices: any[] = [];
    const errors: { symbol: string; error: string }[] = [];

    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400 * 5; // 5 days back to ensure we get data

    let fetchCount = 0;
    for (const [symbol, holding] of uniqueHoldings) {
      const market = detectMarket(symbol);
      const finnhubSymbol = toFinnhubSymbol(symbol, market);
      const currency = market === "IL" ? "ILS" : (holding.asset_currency || "USD");

      try {
        // Rate limit: small delay every 10 requests
        if (fetchCount > 0 && fetchCount % 10 === 0) {
          await new Promise((r) => setTimeout(r, 1100));
        }

        const url = `${FINNHUB_BASE}/stock/candle?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=D&from=${oneDayAgo}&to=${now}&token=${FINNHUB_API_KEY}`;
        console.log(`[fetch-market-prices] Fetching: ${finnhubSymbol}`);

        const resp = await fetch(url);
        if (!resp.ok) {
          const text = await resp.text();
          console.error(`Finnhub error for ${finnhubSymbol}: ${resp.status} ${text}`);
          errors.push({ symbol, error: `HTTP ${resp.status}` });
          fetchCount++;
          continue;
        }

        const candle: FinnhubCandle = await resp.json();

        if (candle.s === "no_data" || !candle.c || candle.c.length === 0) {
          console.warn(`No data for ${finnhubSymbol}`);
          errors.push({ symbol, error: "no_data" });
          fetchCount++;
          continue;
        }

        // Take the last candle
        const idx = candle.c.length - 1;
        const priceDate = new Date(candle.t[idx] * 1000).toISOString().slice(0, 10);

        const priceRow = {
          user_id: userId,
          client_id: clientId,
          symbol,
          market,
          open: candle.o[idx],
          high: candle.h[idx],
          low: candle.l[idx],
          close: candle.c[idx],
          volume: candle.v[idx],
          currency,
          price_date: priceDate,
          source: "finnhub",
          updated_at: new Date().toISOString(),
        };

        fetchedPrices.push(priceRow);
        fetchCount++;
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
        errors.push({ symbol, error: String(err) });
        fetchCount++;
      }
    }

    // 5. Upsert fetched prices
    if (fetchedPrices.length > 0) {
      const { error: upsertErr } = await supabaseAdmin
        .from("market_prices")
        .upsert(fetchedPrices, {
          onConflict: "user_id,client_id,symbol,price_date",
          ignoreDuplicates: false,
        });

      if (upsertErr) {
        console.error("Upsert error:", upsertErr);
        // Try individual inserts as fallback
        for (const p of fetchedPrices) {
          await supabaseAdmin.from("market_prices").upsert(p).select();
        }
      }
    }

    // 6. Return all prices (cached + newly fetched)
    const allPrices = [...cachedPrices, ...fetchedPrices];

    console.log(`[fetch-market-prices] Returning ${allPrices.length} prices, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        prices: allPrices,
        errors: errors.length > 0 ? errors : undefined,
        fetchedCount: fetchedPrices.length,
        cachedCount: cachedPrices.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[fetch-market-prices] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
