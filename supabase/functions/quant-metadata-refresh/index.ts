
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { DateTime } from "https://esm.sh/luxon@3.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch S&P 500 + Russell 1000 overlap — target ~900 US large/mid cap stocks
// We use Finnhub's index constituents endpoint to dynamically fetch the list

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

    // 1. Get list of symbols — fetch from Finnhub S&P 500 constituents + existing DB symbols
    let symbolsToRefresh: string[] = [];
    
    try {
        // Fetch S&P 500 constituents from Finnhub
        const sp500Res = await fetch(`https://finnhub.io/api/v1/index/constituents?symbol=^GSPC&token=${finnhubKey}`);
        if (sp500Res.ok) {
            const sp500Data = await sp500Res.json();
            if (sp500Data.constituents) {
                symbolsToRefresh = sp500Data.constituents;
                console.log(`Fetched ${symbolsToRefresh.length} S&P 500 constituents`);
            }
        }
        await new Promise(r => setTimeout(r, 1000));
        
        // Also fetch Russell 1000 for broader coverage (if available)
        // Finnhub may not have all indices — fall back gracefully
        try {
            const r1000Res = await fetch(`https://finnhub.io/api/v1/index/constituents?symbol=^RUI&token=${finnhubKey}`);
            if (r1000Res.ok) {
                const r1000Data = await r1000Res.json();
                if (r1000Data.constituents) {
                    const existingSet = new Set(symbolsToRefresh);
                    const newSymbols = r1000Data.constituents.filter((s: string) => !existingSet.has(s));
                    symbolsToRefresh = [...symbolsToRefresh, ...newSymbols];
                    console.log(`Added ${newSymbols.length} Russell 1000 symbols, total: ${symbolsToRefresh.length}`);
                }
            }
        } catch (e) {
            console.log('Russell 1000 fetch failed, continuing with S&P 500 only');
        }
    } catch (e) {
        console.error('Failed to fetch index constituents:', e);
    }
    
    // Fallback: if API returned nothing, use existing DB symbols
    if (symbolsToRefresh.length === 0) {
        const { data: existingSymbols, error: fetchError } = await supabase
            .from('quant_universe')
            .select('symbol')
            .eq('is_active', true);
        if (fetchError) throw fetchError;
        symbolsToRefresh = existingSymbols?.map(s => s.symbol) || [];
        console.log(`Using ${symbolsToRefresh.length} existing DB symbols`);
    }
    
    // Cap at 900 to stay within rate limits
    symbolsToRefresh = symbolsToRefresh.slice(0, 900);

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

            // Also fetch current quote for last_price
            let lastPrice = null;
            try {
                await new Promise(r => setTimeout(r, 500));
                const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`);
                if (quoteRes.ok) {
                    const quoteData = await quoteRes.json();
                    if (quoteData.c > 0) lastPrice = quoteData.c;
                }
            } catch (e) {
                console.log(`Quote fetch failed for ${symbol}, skipping price`);
            }

            // Upsert
            const upsertData: any = {
                symbol: symbol,
                company_name: profile.name,
                sector: profile.finnhubIndustry,
                market_cap: profile.marketCapitalization ? Math.round(profile.marketCapitalization * 1000000) : null, // Finnhub returns in millions
                market_timezone: 'America/New_York',
                exchange: profile.exchange,
                currency: profile.currency,
                is_active: true,
                last_metadata_refresh: new Date().toISOString()
            };
            if (lastPrice !== null) {
                upsertData.last_price = lastPrice;
                upsertData.last_price_date = refreshDate;
            }
            const { error: upsertError } = await supabase.from('quant_universe').upsert(upsertData, { onConflict: 'symbol' });

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
