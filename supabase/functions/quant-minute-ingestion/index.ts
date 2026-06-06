
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { DateTime } from "https://esm.sh/luxon@3.4.4";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

const BATCH_SIZE = 5;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    // Verify caller is authenticated
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Advisory lock to prevent parallel execution
    const { data: lockResult } = await supabase.rpc('pg_try_advisory_lock_quant_ingestion');
    if (!lockResult) {
      console.log('Another instance is already running. Exiting.');
      return new Response(JSON.stringify({ status: 'locked' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const now = DateTime.now().toUTC();
    const todayStr = now.setZone('America/New_York').toFormat('yyyy-MM-dd');

    // 0. Guard check: Is there an active session and are we in the window?
    const { data: session, error: sessionError } = await supabase
        .from('quant_ingestion_sessions')
        .select('*')
        .eq('session_date', todayStr)
        .in('status', ['scheduled', 'running'])
        .maybeSingle();

    if (sessionError) throw sessionError;
    
    if (!session) {
        console.log('No active session for today. Exiting.');
        await supabase.rpc('pg_advisory_unlock_quant_ingestion');
        return new Response(JSON.stringify({ status: 'no_session' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const windowStart = DateTime.fromISO(session.window_start_utc).toUTC();
    const windowEnd = DateTime.fromISO(session.window_end_utc).toUTC();

    if (now < windowStart || now > windowEnd) {
        console.log(`Current time ${now.toISO()} is outside ingestion window [${windowStart.toISO()} - ${windowEnd.toISO()}]. Exiting.`);
        
        // If past window end, mark as completed
        if (now > windowEnd && session.status !== 'completed' && session.status !== 'failed') {
             await supabase.from('quant_ingestion_sessions')
                .update({ status: 'completed', completed_at: now.toISO() })
                .eq('id', session.id);
        }
        
        await supabase.rpc('pg_advisory_unlock_quant_ingestion');
        return new Response(JSON.stringify({ status: 'outside_window' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update status to running if scheduled
    if (session.status === 'scheduled') {
        await supabase.from('quant_ingestion_sessions')
            .update({ status: 'running', started_at: now.toISO() })
            .eq('id', session.id);
    }

    // 1. Fetch next batch of symbols
    const cursor = session.cursor_position;
    
    // Get total universe size
    const { count: totalSymbols } = await supabase
        .from('quant_universe')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    // If cursor >= total symbols, we've covered all — mark session complete
    if (cursor >= (totalSymbols || 0)) {
        await supabase.from('quant_ingestion_sessions')
            .update({ status: 'completed', completed_at: now.toISO() })
            .eq('id', session.id);
        console.log(`All ${totalSymbols} symbols covered. Session complete.`);
        await supabase.rpc('pg_advisory_unlock_quant_ingestion');
        return new Response(JSON.stringify({ status: 'completed', total: totalSymbols }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get active symbols ordered by rank — NO wrap-around
    const { data: symbols, error: symbolsError } = await supabase
        .from('quant_universe')
        .select('*')
        .eq('is_active', true)
        .order('market_cap_rank', { ascending: true })
        .range(cursor, cursor + BATCH_SIZE - 1);

    if (symbolsError) throw symbolsError;

    const symbolsToProcess = symbols || [];
    const newCursor = cursor + symbolsToProcess.length;

    // 2. Process symbols
    const timestampMinute = now.startOf('minute').toISO();
    const results = [];
    const succeededSymbols: string[] = [];
    const failedSymbols: string[] = [];
    let totalLatency = 0;
    let totalRetries = 0;

    const ingestionStart = performance.now();

    for (const symbolData of symbolsToProcess) {
        const symbol = symbolData.symbol;
        let retries = 0;
        let success = false;
        let quoteData = null;
        let responseTime = 0;

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const t0 = performance.now();
                const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`);
                const t1 = performance.now();
                responseTime = Math.round(t1 - t0);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.c > 0) { // Valid price
                        quoteData = data;
                        success = true;
                        break;
                    } else {
                         throw new Error(`Invalid price: ${data.c}`);
                    }
                } else if (response.status === 429) {
                    // Rate limit
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt))); // Exponential backoff
                    totalRetries++;
                    retries++;
                    continue;
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (err) {
                totalRetries++;
                retries++;
                if (attempt === 2) {
                    console.error(`Failed to fetch ${symbol}:`, err);
                } else {
                     await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
                }
            }
        }

        if (success && quoteData) {
            succeededSymbols.push(symbol);
            results.push({
                symbol: symbol,
                company_name: symbolData.company_name,
                timestamp_utc: now.toISO(),
                timestamp_minute: timestampMinute,
                price: quoteData.c,
                sector: symbolData.sector,
                market_cap: symbolData.market_cap,
                market_cap_rank: symbolData.market_cap_rank,
                market_timezone: symbolData.market_timezone,
                ingestion_latency_ms: Math.round(performance.now() - ingestionStart),
                api_response_time_ms: responseTime
            });
        } else {
            failedSymbols.push(symbol);
        }
    }
    
    totalLatency = Math.round(performance.now() - ingestionStart);

    // 3. Store quotes
    if (results.length > 0) {
        const { error: insertError } = await supabase
            .from('quant_quotes')
            .upsert(results, { onConflict: 'symbol,timestamp_minute', ignoreDuplicates: true });
            
        if (insertError) console.error('Error inserting quotes:', insertError);
    }

    // 4. Update session
    const { error: updateError } = await supabase
        .from('quant_ingestion_sessions')
        .update({
            cursor_position: newCursor,
            quotes_collected: session.quotes_collected + succeededSymbols.length,
            updated_at: now.toISO()
        })
        .eq('id', session.id);

    if (updateError) console.error('Error updating session:', updateError);

    // 5. Write logs
    const { error: logError } = await supabase
        .from('quant_ingestion_logs')
        .insert({
            session_id: session.id,
            minute_utc: timestampMinute,
            symbols_attempted: symbolsToProcess.map(s => s.symbol),
            symbols_succeeded: succeededSymbols,
            symbols_failed: failedSymbols,
            retry_count: totalRetries,
            status: failedSymbols.length === 0 ? 'success' : (succeededSymbols.length > 0 ? 'partial_success' : 'failed'),
            latency_ms: totalLatency,
            error_details: failedSymbols.length > 0 ? { failed: failedSymbols } : null // Simplification
        });

    if (logError) console.error('Error writing logs:', logError);

    // Release advisory lock
    await supabase.rpc('pg_advisory_unlock_quant_ingestion');

    return new Response(JSON.stringify({ 
        status: 'success', 
        processed: symbolsToProcess.length, 
        succeeded: succeededSymbols.length,
        failed: failedSymbols.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in minute ingestion:', error);
    // Try to release lock on error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const sb = createClient(supabaseUrl, supabaseKey);
      await sb.rpc('pg_advisory_unlock_quant_ingestion');
    } catch (_) { /* best effort */ }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
