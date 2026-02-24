
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { DateTime } from "https://esm.sh/luxon@3.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Seed list for initial population (S&P 500 top 20 sample + others as specified)
// In production, this might come from a bigger list or dynamic fetch
const SEED_SYMBOLS = [
    "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "TSLA", "BRK.B", "TSM", "LLY",
    "AVGO", "JPM", "V", "XOM", "WMT", "UNH", "MA", "PG", "JNJ", "HD",
    "COST", "ABBV", "ORCL", "BAC", "KO", "NFLX", "CRM", "AMD", "PEP", "CVX"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting metadata refresh...');
    const start = performance.now();
    const refreshDate = DateTime.now().toISODate();

    // 1. Get list of symbols to refresh
    // For now, we use the active symbols in DB, or if empty, the seed list
    const { data: existingSymbols, error: fetchError } = await supabase
        .from('quant_universe')
        .select('symbol')
        .eq('is_active', true);
    
    if (fetchError) throw fetchError;

    let symbolsToRefresh = existingSymbols?.map(s => s.symbol) || [];
    
    if (symbolsToRefresh.length === 0) {
        console.log('Universe empty, using seed list.');
        symbolsToRefresh = SEED_SYMBOLS;
    }

    let added = 0;
    let updated = 0;
    let deactivated = 0;

    // 2. Refresh loop
    for (const symbol of symbolsToRefresh) {
        try {
            const response = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${finnhubKey}`);
            if (!response.ok) {
                console.error(`Failed to fetch profile for ${symbol}: ${response.status}`);
                continue;
            }

            const profile = await response.json();
            
            // If empty object, might be delisted
            if (Object.keys(profile).length === 0) {
                console.log(`Symbol ${symbol} returned empty profile. Marking inactive.`);
                await supabase.from('quant_universe').update({ is_active: false }).eq('symbol', symbol);
                deactivated++;
                continue;
            }

            // Upsert
            const { error: upsertError } = await supabase.from('quant_universe').upsert({
                symbol: symbol,
                company_name: profile.name,
                sector: profile.finnhubIndustry,
                market_cap: profile.marketCapitalization ? Math.round(profile.marketCapitalization * 1000000) : null, // Finnhub is in millions
                market_timezone: 'America/New_York',
                exchange: profile.exchange,
                currency: profile.currency,
                is_active: true,
                last_metadata_refresh: new Date().toISOString()
            }, { onConflict: 'symbol' });

            if (upsertError) {
                console.error(`Error upserting ${symbol}:`, upsertError);
            } else {
                // Check if it was an update or insert? (Hard to distinguish with upsert without extra query, assuming update/add mixed)
                updated++;
            }

            // Rate limit (60 req/min = 1 req/sec). Be conservative.
            await new Promise(r => setTimeout(r, 1000));

        } catch (err) {
            console.error(`Error processing ${symbol}:`, err);
        }
    }

    // 3. Recompute ranks
    // Using Postgres window function via a custom SQL or update
    // Since we are in Edge Function, we can run a raw query via rpc if we had one, or just fetch all and update.
    // Efficient way:
    const { data: allActive } = await supabase
        .from('quant_universe')
        .select('id, market_cap')
        .eq('is_active', true)
        .order('market_cap', { ascending: false });
    
    if (allActive) {
        let rank = 1;
        for (const item of allActive) {
            await supabase.from('quant_universe').update({ market_cap_rank: rank }).eq('id', item.id);
            rank++;
        }
    }

    const duration = Math.round(performance.now() - start);

    // 4. Log result
    await supabase.from('quant_metadata_refresh_log').insert({
        refresh_date: refreshDate,
        symbols_total: allActive?.length || 0,
        symbols_added: added, // logic approximate
        symbols_updated: updated,
        symbols_deactivated: deactivated,
        status: 'success',
        duration_ms: duration
    });

    return new Response(JSON.stringify({ status: 'success', duration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in metadata refresh:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
