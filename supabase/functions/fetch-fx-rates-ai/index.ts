import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const today = new Date().toISOString().split('T')[0];
    
    const systemPrompt = `You are a financial data assistant. Your task is to provide current approximate exchange rates for currencies against USD.

IMPORTANT: You must respond ONLY with a valid JSON object, no other text.

The format must be exactly:
{
  "EUR": <number>,
  "ILS": <number>,
  "GBP": <number>,
  "CHF": <number>,
  "JPY": <number>
}

Where each number represents how many units of that currency equal 1 USD.
For example: EUR: 0.92 means 1 USD = 0.92 EUR
             ILS: 3.65 means 1 USD = 3.65 ILS
             JPY: 150.0 means 1 USD = 150 JPY`;

    const userPrompt = `Provide the current approximate exchange rates as of ${today} for EUR, ILS, GBP, CHF, and JPY against USD. 
Remember: I need how many units of each currency equals 1 USD (USD/{Currency} format).
Respond with ONLY the JSON object, no explanation or markdown.`;

    console.log("Calling Lovable AI Gateway for FX rates...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, // Low temperature for consistent financial data
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get rates from AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI raw response:", content);

    // Parse the JSON from the response (handle potential markdown code blocks)
    let ratesJson = content.trim();
    if (ratesJson.startsWith("```json")) {
      ratesJson = ratesJson.slice(7);
    }
    if (ratesJson.startsWith("```")) {
      ratesJson = ratesJson.slice(3);
    }
    if (ratesJson.endsWith("```")) {
      ratesJson = ratesJson.slice(0, -3);
    }
    ratesJson = ratesJson.trim();

    let rates;
    try {
      rates = JSON.parse(ratesJson);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", ratesJson);
      throw new Error("Invalid JSON in AI response");
    }

    // Validate the response has all required currencies
    const requiredCurrencies = ['EUR', 'ILS', 'GBP', 'CHF', 'JPY'];
    for (const currency of requiredCurrencies) {
      if (typeof rates[currency] !== 'number' || rates[currency] <= 0) {
        throw new Error(`Invalid or missing rate for ${currency}`);
      }
    }

    console.log("Parsed FX rates:", rates);

    return new Response(JSON.stringify({ 
      success: true, 
      rates,
      source: "AI (approximate)",
      date: today
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching FX rates:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
