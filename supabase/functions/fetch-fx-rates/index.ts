import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAIRS = [
  { from: "USD", to: "EUR" },
  { from: "USD", to: "ILS" },
  { from: "USD", to: "GBP" },
  { from: "USD", to: "CHF" },
  { from: "USD", to: "JPY" },
];

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url);
      if (resp.ok) return resp;
      console.warn(`[fetch-fx-rates] Attempt ${attempt + 1} failed: ${resp.status}`);
    } catch (err) {
      console.warn(`[fetch-fx-rates] Attempt ${attempt + 1} error:`, err);
    }
    if (attempt < retries) await sleep(RETRY_DELAY_MS);
  }
  throw new Error(`Failed to fetch after ${retries + 1} attempts`);
}

interface RateResult {
  pair: string;
  rate: number | null;
  status: "ok" | "error";
  error?: string;
}

async function fetchRates(): Promise<{ results: RateResult[]; fetchedAt: string }> {
  const fetchedAt = new Date().toISOString();
  const results: RateResult[] = [];

  try {
    // Use open.er-api.com — free, no API key, includes ILS
    const resp = await fetchWithRetry("https://open.er-api.com/v6/latest/USD");
    const data = await resp.json();

    if (data.result !== "success") {
      throw new Error(`API returned: ${data.result}`);
    }

    const apiRates = data.rates as Record<string, number>;

    for (const pair of PAIRS) {
      const rate = apiRates[pair.to];
      if (rate && rate > 0) {
        results.push({ pair: `${pair.from}/${pair.to}`, rate, status: "ok" });
      } else {
        results.push({
          pair: `${pair.from}/${pair.to}`,
          rate: null,
          status: "error",
          error: `Currency ${pair.to} not found in API response`,
        });
      }
    }
  } catch (err: any) {
    console.error("[fetch-fx-rates] API call failed:", err.message);
    for (const pair of PAIRS) {
      results.push({
        pair: `${pair.from}/${pair.to}`,
        rate: null,
        status: "error",
        error: err.message,
      });
    }
  }

  return { results, fetchedAt };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is an authenticated user call or a cron call
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) userId = user.id;
    }

    console.log(`[fetch-fx-rates] Starting fetch. userId=${userId || "system/cron"}`);

    const { results, fetchedAt } = await fetchRates();
    const today = new Date().toISOString().split("T")[0];
    const okResults = results.filter((r) => r.status === "ok" && r.rate !== null);
    const errorResults = results.filter((r) => r.status === "error");

    console.log(`[fetch-fx-rates] Fetched ${okResults.length} OK, ${errorResults.length} errors`);

    // Upsert into fx_rates — system rates (user_id=null) and user-specific if authenticated
    const inserts = okResults.map((r) => ({
      user_id: userId,
      from_currency: r.pair.split("/")[0],
      to_currency: r.pair.split("/")[1],
      rate: r.rate!,
      rate_date: today,
      source: "auto",
    }));

    if (inserts.length > 0) {
      for (const insert of inserts) {
        let query = supabase
          .from("fx_rates")
          .select("id")
          .eq("from_currency", insert.from_currency)
          .eq("to_currency", insert.to_currency)
          .eq("rate_date", insert.rate_date)
          .eq("source", "auto");

        if (insert.user_id) {
          query = query.eq("user_id", insert.user_id);
        } else {
          query = query.is("user_id", null);
        }

        const { data: existing } = await query.maybeSingle();

        if (existing) {
          const { error } = await supabase
            .from("fx_rates")
            .update({ rate: insert.rate })
            .eq("id", existing.id);
          if (error) console.error(`[fetch-fx-rates] Update error for ${insert.from_currency}/${insert.to_currency}:`, error);
        } else {
          const { error } = await supabase
            .from("fx_rates")
            .insert(insert);
          if (error) console.error(`[fetch-fx-rates] Insert error for ${insert.from_currency}/${insert.to_currency}:`, error);
        }
      }
    }

    // If user is authenticated, also upsert for their user_id
    if (userId) {
      for (const r of okResults) {
        const fromCur = r.pair.split("/")[0];
        const toCur = r.pair.split("/")[1];

        const { data: existing } = await supabase
          .from("fx_rates")
          .select("id")
          .eq("user_id", userId)
          .eq("from_currency", fromCur)
          .eq("to_currency", toCur)
          .eq("rate_date", today)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("fx_rates")
            .update({ rate: r.rate!, source: "auto" })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("fx_rates")
            .insert({
              user_id: userId,
              from_currency: fromCur,
              to_currency: toCur,
              rate: r.rate!,
              rate_date: today,
              source: "auto",
            });
        }
      }
    }

    const status = errorResults.length === 0 ? "ok" : okResults.length > 0 ? "partial" : "error";

    console.log(`[fetch-fx-rates] Done. Status: ${status}`);

    return new Response(
      JSON.stringify({
        status,
        fetchedAt,
        rates: results,
        savedCount: okResults.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[fetch-fx-rates] Unhandled error:", err);
    return new Response(
      JSON.stringify({ status: "error", error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
