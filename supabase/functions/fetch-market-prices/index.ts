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

// Finnhub /quote response
interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high of day
  l: number;  // low of day
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

function toFinnhubSymbol(symbol: string): string {
  return symbol.toUpperCase();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchQuote(symbol: string, apiKey: string): Promise<{ quote: FinnhubQuote | null; error: string | null }> {
  const finnhubSymbol = toFinnhubSymbol(symbol);
  try {
    const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${apiKey}`;
    console.log(`[fetch-market-prices] Fetching quote: ${finnhubSymbol}`);
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Finnhub error for ${finnhubSymbol}: ${resp.status} ${text}`);
      return { quote: null, error: `HTTP ${resp.status}` };
    }
    const quote: FinnhubQuote = await resp.json();
    // Finnhub returns c=0 for unknown symbols
    if (!quote || quote.c === 0) {
      return { quote: null, error: "no_data" };
    }
    return { quote, error: null };
  } catch (err) {
    console.error(`Error fetching ${symbol}:`, err);
    return { quote: null, error: String(err) };
  }
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
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
    const adHocSymbols: string[] = body.symbols || [];

    console.log(`[fetch-market-prices] User: ${userId}, clientId: ${clientId}, force: ${forceRefresh}, adHoc: ${adHocSymbols.length}`);

    // --- Ad-hoc mode: fetch specific symbols without needing holdings ---
    if (adHocSymbols.length > 0) {
      const results: any[] = [];
      const errors: { symbol: string; error: string }[] = [];

      for (const symbol of adHocSymbols) {
        const { quote, error } = await fetchQuote(symbol, FINNHUB_API_KEY);
        if (error || !quote) {
          errors.push({ symbol, error: error || "unknown" });
          continue;
        }
        results.push({
          id: crypto.randomUUID(),
          symbol: symbol.toUpperCase(),
          market: "US",
          open: quote.o,
          high: quote.h,
          low: quote.l,
          close: quote.c,
          previousClose: quote.pc,
          change: quote.d,
          changePct: quote.dp,
          volume: null,
          currency: "USD",
          price_date: todayStr(),
          source: "finnhub",
          updated_at: new Date().toISOString(),
        });
      }

      return new Response(
        JSON.stringify({ prices: results, errors: errors.length > 0 ? errors : undefined }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Standard mode: fetch from holdings ---
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

    // Check cache
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

    // Find symbols that need fetching
    const uniqueHoldings = new Map<string, HoldingRow>();
    for (const h of holdings as HoldingRow[]) {
      if (!cachedSymbols.has(h.ticker)) {
        uniqueHoldings.set(h.ticker, h);
      }
    }

    console.log(`[fetch-market-prices] Cached: ${cachedSymbols.size}, To fetch: ${uniqueHoldings.size}`);

    const fetchedPrices: any[] = [];
    const errors: { symbol: string; error: string }[] = [];

    let fetchCount = 0;
    for (const [symbol, holding] of uniqueHoldings) {
      const currency = holding.asset_currency || "USD";

      // Rate limit: 60 calls/min
      if (fetchCount > 0 && fetchCount % 55 === 0) {
        console.log(`[fetch-market-prices] Rate limit pause at ${fetchCount} requests`);
        await new Promise((r) => setTimeout(r, 1100));
      }

      const { quote, error } = await fetchQuote(symbol, FINNHUB_API_KEY);
      fetchCount++;

      if (error || !quote) {
        errors.push({ symbol, error: error || "unknown" });
        continue;
      }

      fetchedPrices.push({
        user_id: userId,
        client_id: clientId,
        symbol,
        market: "US",
        open: quote.o,
        high: quote.h,
        low: quote.l,
        close: quote.c,
        volume: null,
        currency,
        price_date: today,
        source: "finnhub",
        updated_at: new Date().toISOString(),
      });
    }

    // Upsert fetched prices
    if (fetchedPrices.length > 0) {
      const { error: upsertErr } = await supabaseAdmin
        .from("market_prices")
        .upsert(fetchedPrices, {
          onConflict: "user_id,client_id,symbol,price_date",
          ignoreDuplicates: false,
        });

      if (upsertErr) {
        console.error("Upsert error:", upsertErr);
        for (const p of fetchedPrices) {
          await supabaseAdmin.from("market_prices").upsert(p).select();
        }
      }
    }

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
