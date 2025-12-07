import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALPACA_DATA_BASE_URL = "https://data.alpaca.markets/v2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Alpaca API endpoint called");

  try {
    // Validate environment variables
    const apiKeyId = Deno.env.get('ALPACA_API_KEY_ID');
    const apiSecretKey = Deno.env.get('ALPACA_API_SECRET_KEY');

    if (!apiKeyId || !apiSecretKey) {
      console.error("Missing Alpaca API credentials");
      return new Response(
        JSON.stringify({ 
          status: "error", 
          error: "Missing Alpaca API credentials" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { action, symbol = "AAPL", timeframe = "1Day", start, end, limit = 100 } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ status: "error", error: "Missing 'action' parameter" }),
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
          JSON.stringify({ status: "error", error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    console.log(`Fetching: ${alpacaUrl}`);
    const response = await fetch(alpacaUrl, { method: 'GET', headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Alpaca API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          error: `Alpaca API returned ${response.status}: ${errorText}` 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`Alpaca API response received for ${action}`);

    return new Response(
      JSON.stringify({
        status: "success",
        action,
        symbol: upperSymbol,
        data,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in alpaca-test function:", errorMessage);
    return new Response(
      JSON.stringify({ status: "error", error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
