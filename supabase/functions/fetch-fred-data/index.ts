import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FRED series IDs for economic indicators
const FRED_SERIES = {
  GDP: 'A191RL1Q225SBEA',      // Real GDP Growth Rate (Quarterly)
  CPI: 'CPIAUCSL',             // CPI All Urban Consumers (Monthly)
  UNEMP: 'UNRATE',             // Unemployment Rate (Monthly)
  PCE: 'PCEPILFE',             // Core PCE Price Index (Monthly)
  FED_ASSETS: 'WALCL',         // Fed Balance Sheet: Total Assets (Weekly)
};

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<{ value: number; prevValue: number; date: string } | null> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;
    
    console.log(`Fetching FRED series: ${seriesId}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`FRED API error for ${seriesId}: ${response.status}`);
      return null;
    }
    
    const data: FredResponse = await response.json();
    
    if (!data.observations || data.observations.length < 1) {
      console.error(`No observations for ${seriesId}`);
      return null;
    }
    
    const currentObs = data.observations[0];
    const prevObs = data.observations[1];
    
    const value = parseFloat(currentObs.value);
    const prevValue = prevObs ? parseFloat(prevObs.value) : value;
    
    if (isNaN(value)) {
      console.error(`Invalid value for ${seriesId}: ${currentObs.value}`);
      return null;
    }
    
    return {
      value,
      prevValue: isNaN(prevValue) ? value : prevValue,
      date: currentObs.date
    };
  } catch (error) {
    console.error(`Error fetching ${seriesId}:`, error);
    return null;
  }
}

function formatPeriod(dateStr: string, isQuarterly: boolean = false): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  if (isQuarterly) {
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `Q${quarter} ${date.getFullYear()}`;
  }
  
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== JWT AUTHENTICATION =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('JWT verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated FRED data request from user: ${user.id}`);
    // ===== END AUTHENTICATION =====

    const apiKey = Deno.env.get('FRED_API_KEY');
    
    if (!apiKey) {
      console.error('FRED_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'FRED API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching all FRED series...');

    // Fetch all series in parallel
    const [gdpData, cpiData, unempData, pceData, fedAssetsData] = await Promise.all([
      fetchFredSeries(FRED_SERIES.GDP, apiKey),
      fetchFredSeries(FRED_SERIES.CPI, apiKey),
      fetchFredSeries(FRED_SERIES.UNEMP, apiKey),
      fetchFredSeries(FRED_SERIES.PCE, apiKey),
      fetchFredSeries(FRED_SERIES.FED_ASSETS, apiKey),
    ]);

    // Build indicators array
    const indicators = [];

    // GDP - already a growth rate
    if (gdpData) {
      indicators.push({
        symbol: 'GDP',
        name: 'Real GDP Growth',
        value: gdpData.value.toFixed(1),
        change: Number((gdpData.value - gdpData.prevValue).toFixed(1)),
        unit: '%',
        source: 'BEA',
        period: formatPeriod(gdpData.date, true)
      });
    }

    // CPI - calculate YoY change
    if (cpiData) {
      // CPI is an index, so we show the YoY % change approximation
      const yoyChange = ((cpiData.value - cpiData.prevValue) / cpiData.prevValue * 100 * 12).toFixed(1);
      const prevYoyChange = 2.7; // Approximate previous for change calculation
      indicators.push({
        symbol: 'CPI',
        name: 'CPI YoY',
        value: yoyChange,
        change: Number((parseFloat(yoyChange) - prevYoyChange).toFixed(1)),
        unit: '%',
        source: 'BLS',
        period: formatPeriod(cpiData.date)
      });
    }

    // Core PCE - calculate YoY change (placed next to CPI)
    if (pceData) {
      const yoyChange = ((pceData.value - pceData.prevValue) / pceData.prevValue * 100 * 12).toFixed(1);
      const prevYoyChange = 2.8;
      indicators.push({
        symbol: 'PCE',
        name: 'Core PCE',
        value: yoyChange,
        change: Number((parseFloat(yoyChange) - prevYoyChange).toFixed(1)),
        unit: '%',
        source: 'BEA',
        period: formatPeriod(pceData.date)
      });
    }

    // Unemployment Rate
    if (unempData) {
      indicators.push({
        symbol: 'UNEMP',
        name: 'Unemployment',
        value: unempData.value.toFixed(1),
        change: Number((unempData.value - unempData.prevValue).toFixed(1)),
        unit: '%',
        source: 'BLS',
        period: formatPeriod(unempData.date)
      });
    }

    // Fed Balance Sheet Total Assets - value in millions, display in trillions
    if (fedAssetsData) {
      const valueInTrillions = fedAssetsData.value / 1000000;
      const prevValueInTrillions = fedAssetsData.prevValue / 1000000;
      const weeklyChange = valueInTrillions - prevValueInTrillions;
      indicators.push({
        symbol: 'FED',
        name: 'Fed Total Assets',
        value: `$${valueInTrillions.toFixed(2)}T`,
        change: Number((weeklyChange * 1000).toFixed(0)), // Change in billions
        unit: 'B',
        source: 'FED',
        period: formatPeriod(fedAssetsData.date)
      });
    }

    console.log(`Successfully fetched ${indicators.length} indicators`);

    return new Response(
      JSON.stringify({ 
        indicators,
        lastUpdated: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-fred-data:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
