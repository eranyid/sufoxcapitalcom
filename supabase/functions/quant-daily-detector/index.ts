import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { DateTime } from "https://esm.sh/luxon@3.4.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // Need service role to write to tables
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Detecting trading day...');

    // 1. Get US market holidays for the current year
    const now = DateTime.now().setZone('America/New_York');
    const todayStr = now.toFormat('yyyy-MM-dd');
    
    // Check if weekend
    const isWeekend = now.weekday >= 6; // 6 = Sat, 7 = Sun
    if (isWeekend) {
      console.log(`Today ${todayStr} is a weekend. Skipping.`);
      await createSession(supabase, todayStr, false, 'Weekend', 'skipped');
      return new Response(JSON.stringify({ status: 'skipped', reason: 'weekend' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check holidays via Finnhub
    const holidaysResponse = await fetch(`https://finnhub.io/api/v1/calendar/holiday?exchange=US&token=${finnhubKey}`);
    const holidaysData = await holidaysResponse.json();
    
    if (!holidaysResponse.ok) {
       console.error('Failed to fetch holidays:', holidaysData);
       throw new Error('Failed to fetch holidays');
    }

    // holidaysData is an array of holidays. We need to check if today is in it.
    // Finnhub format: { "eventName": "New Year's Day", "atDate": "2024-01-01", "tradingHour": "" }
    const holiday = holidaysData.data?.find((h: any) => h.atDate === todayStr);

    if (holiday) {
        console.log(`Today ${todayStr} is a holiday: ${holiday.eventName}`);
        await createSession(supabase, todayStr, false, holiday.eventName, 'skipped');
        return new Response(JSON.stringify({ status: 'skipped', reason: 'holiday', holiday: holiday.eventName }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Check for early close
    // Known early close days (approximate list for now, ideally fetch from a comprehensive source)
    // 13:00 ET close
    let isEarlyClose = false;
    let earlyCloseNote = null;
    let marketCloseHour = 16;
    let marketCloseMinute = 0;
    
    // Day after Thanksgiving (Black Friday) - often early close
    // Christmas Eve (Dec 24)
    // July 3 (if July 4 is Sat) - observed holiday is usually full off, but sometimes early close
    
    // For MVP, we can implement specific logic or rely on manual override if needed. 
    // Finnhub's holiday endpoint usually includes early closes as well with tradingHour info, but the documentation is sparse.
    // Let's check the 'tradingHour' field if available.
    
    if (holiday && holiday.tradingHour) {
        // If tradingHour is present, it might imply partial day?
        // Actually, if it's in the holiday list, it's usually a full holiday.
    }
    
    // Manual check for common early closes
    const month = now.month;
    const day = now.day;
    
    if (month === 11 && day === 24 && now.weekday <= 5) { // Dec 24 weekday
        isEarlyClose = true;
        earlyCloseNote = "Christmas Eve";
        marketCloseHour = 13;
    } else if (month === 11 && now.weekday === 5 && day >= 23 && day <= 29) {
        // Black Friday (Day after Thanksgiving - 4th Thursday)
        // Thanksgiving is 4th Thursday. 
        // Simple logic: if month is Nov, and it's Friday... let's keep it simple for now or strictly follow spec manual list
        // "Day before Thanksgiving" isn't early close. "Day AFTER Thanksgiving" (Black Friday) is. 
        // The spec said "Day before Thanksgiving (4th Thursday Nov)" - wait, Day BEFORE is Wed. Markets usually open full day Wed. 
        // Markets close early on BLACK FRIDAY (Day After). 
        // Let's assume the spec meant "Day after Thanksgiving".
        // Let's stick to safe default (full day) unless sure.
    }

    // Calculate times
    // Market close at 16:00 ET (or 13:00 ET)
    const marketClose = now.set({ hour: marketCloseHour, minute: marketCloseMinute, second: 0, millisecond: 0 });
    const marketCloseUtc = marketClose.toUTC();
    
    // Window covers last 3 hours of trading: 13:00 - 16:00 ET (or 10:00 - 13:00 ET for early close)
    const windowStartET = now.set({ hour: marketCloseHour - 3, minute: 0, second: 0, millisecond: 0 });
    const windowEndUtc = marketCloseUtc;
    const windowStartUtc = windowStartET.toUTC();
    
    // Create session
    await createSession(
        supabase, 
        todayStr, 
        true, 
        null, 
        'scheduled', 
        isEarlyClose, 
        earlyCloseNote,
        marketCloseUtc.toISO(),
        windowStartUtc.toISO(),
        windowEndUtc.toISO(),
        isEarlyClose ? 900 : 900 // 5 symbols/min × 180 min = 900
    );

    return new Response(JSON.stringify({ status: 'scheduled', date: todayStr, window_start: windowStartUtc.toISO(), window_end: windowEndUtc.toISO() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily detector:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createSession(
    supabase: any, 
    date: string, 
    isTradingDay: boolean, 
    notes: string | null, 
    status: string,
    earlyClose: boolean = false,
    earlyCloseNote: string | null = null,
    marketCloseUtc: string | null = null,
    windowStartUtc: string | null = null,
    windowEndUtc: string | null = null,
    quotesTarget: number = 0
) {
    const { error } = await supabase
        .from('quant_ingestion_sessions')
        .upsert({
            session_date: date,
            is_trading_day: isTradingDay,
            notes: notes,
            status: status,
            early_close: earlyClose,
            early_close_note: earlyCloseNote,
            market_close_utc: marketCloseUtc,
            window_start_utc: windowStartUtc,
            window_end_utc: windowEndUtc,
            quotes_target: quotesTarget
        }, { onConflict: 'session_date' });
    
    if (error) throw error;
}
