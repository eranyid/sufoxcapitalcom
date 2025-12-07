import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Alpaca test endpoint called");

  try {
    // Validate environment variables
    const apiKeyId = Deno.env.get('ALPACA_API_KEY_ID');
    const apiSecretKey = Deno.env.get('ALPACA_API_SECRET_KEY');

    if (!apiKeyId) {
      console.error("Missing ALPACA_API_KEY_ID environment variable");
      return new Response(
        JSON.stringify({ 
          status: "error", 
          error: "Missing ALPACA_API_KEY_ID environment variable" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    if (!apiSecretKey) {
      console.error("Missing ALPACA_API_SECRET_KEY environment variable");
      return new Response(
        JSON.stringify({ 
          status: "error", 
          error: "Missing ALPACA_API_SECRET_KEY environment variable" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Environment variables validated, fetching from Alpaca API...");

    // Fetch latest trade for AAPL from Alpaca
    const symbol = "AAPL";
    const alpacaUrl = `https://data.alpaca.markets/v2/stocks/${symbol}/trades/latest`;

    const response = await fetch(alpacaUrl, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': apiKeyId,
        'APCA-API-SECRET-KEY': apiSecretKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Alpaca API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          status: "error", 
          error: `Alpaca API returned ${response.status}: ${errorText}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();
    console.log("Alpaca API response received successfully");

    return new Response(
      JSON.stringify({
        status: "success",
        symbol: symbol,
        trade: data.trade || data,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in alpaca-test function:", errorMessage);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
