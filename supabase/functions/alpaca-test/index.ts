import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPACA_DATA_BASE_URL = "https://data.alpaca.markets/v2";
const LATENCY_THRESHOLD_MS = 800;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Alpaca API endpoint called");

  // ===== JWT AUTHENTICATION =====
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: "Unauthorized - missing or invalid authorization header",
        isHealthy: false,
        latency_ms: 0,
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    console.error('JWT verification failed:', claimsError);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: "Unauthorized - invalid token",
        isHealthy: false,
        latency_ms: 0,
      }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const userId = claimsData.claims.sub;
  console.log(`Authenticated Alpaca request from user: ${userId}`);

  // Verify user is approved
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('is_approved')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile?.is_approved) {
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: "Account not approved",
        isHealthy: false,
        latency_ms: 0,
      }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // ===== END AUTHENTICATION =====

  // Validate environment variables first
  const apiKeyId = Deno.env.get('ALPACA_API_KEY_ID');
  const apiSecretKey = Deno.env.get('ALPACA_API_SECRET_KEY');

  if (!apiKeyId || !apiSecretKey) {
    console.error("Missing Alpaca API credentials");
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: "Missing Alpaca API credentials.",
        isHealthy: false,
        latency_ms: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { action, symbol = "AAPL", timeframe = "1Day", start, end, limit = 100 } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "Missing 'action' parameter",
          isHealthy: false,
          latency_ms: 0,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upperSymbol = symbol.toUpperCase();
    console.log(`Action: ${action}, Symbol: ${upperSymbol}`);

    const headers = {
      'APCA-API-KEY-ID': apiKeyId,
      'APCA-API-SECRET-KEY': apiSecretKey,
    };

    let alpacaUrl: string;
    
    switch (action) {
      case "latest-trade":
        alpacaUrl = `${ALPACA_DATA_BASE_URL}/stocks/${upperSymbol}/trades/latest`;
        break;
      case "latest-quote":
        alpacaUrl = `${ALPACA_DATA_BASE_URL}/stocks/${upperSymbol}/quotes/latest`;
        break;
      case "latest-bar":
        alpacaUrl = `${ALPACA_DATA_BASE_URL}/stocks/${upperSymbol}/bars/latest?timeframe=${timeframe}`;
        break;
      case "historical-bars": {
        const params = new URLSearchParams({ timeframe, limit: String(limit) });
        if (start) params.append("start", start);
        if (end) params.append("end", end);
        alpacaUrl = `${ALPACA_DATA_BASE_URL}/stocks/${upperSymbol}/bars?${params.toString()}`;
        break;
      }
      case "historical-trades": {
        const params = new URLSearchParams({ limit: String(limit) });
        if (start) params.append("start", start);
        if (end) params.append("end", end);
        alpacaUrl = `${ALPACA_DATA_BASE_URL}/stocks/${upperSymbol}/trades?${params.toString()}`;
        break;
      }
      case "historical-quotes": {
        const params = new URLSearchParams({ limit: String(limit) });
        if (start) params.append("start", start);
        if (end) params.append("end", end);
        alpacaUrl = `${ALPACA_DATA_BASE_URL}/stocks/${upperSymbol}/quotes?${params.toString()}`;
        break;
      }
      case "snapshot":
        alpacaUrl = `${ALPACA_DATA_BASE_URL}/stocks/${upperSymbol}/snapshot`;
        break;
      default:
        return new Response(
          JSON.stringify({ 
            status: "error", 
            message: `Unknown action: ${action}`,
            isHealthy: false,
            latency_ms: 0,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`Fetching: ${alpacaUrl}`);
    
    // Measure latency
    const startTime = performance.now();
    const response = await fetch(alpacaUrl, { method: 'GET', headers });
    const endTime = performance.now();
    const latency_ms = Math.round(endTime - startTime);

    console.log(`Alpaca response status: ${response.status}, latency: ${latency_ms}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Alpaca API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          status: "error",
          message: "Failed to fetch Alpaca data.",
          alpaca_status: response.status,
          alpaca_error: errorText,
          isHealthy: false,
          latency_ms,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const isHealthy = response.status === 200 && latency_ms < LATENCY_THRESHOLD_MS;

    console.log(`Alpaca API response received. Healthy: ${isHealthy}`);

    return new Response(
      JSON.stringify({
        status: "success",
        action,
        symbol: upperSymbol,
        data,
        isHealthy,
        latency_ms,
        latency_threshold_ms: LATENCY_THRESHOLD_MS,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in alpaca-test function:", errorMessage);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: errorMessage,
        isHealthy: false,
        latency_ms: 0,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
