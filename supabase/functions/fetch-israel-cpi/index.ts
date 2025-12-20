import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Israeli CBS API for CPI (Consumer Price Index)
// Index ID 120010 = General CPI Index
const CBS_API_BASE = 'https://api.cbs.gov.il/index/data';
const CPI_INDEX_ID = '120010';

interface CPIDataPoint {
  date: string; // YYYY-MM format
  value: number;
}

interface CBSPriceResponse {
  Prices?: Array<{
    date?: string;
    currBase?: number;
    value?: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Fetching Israeli CPI data from CBS API...');

    // Fetch CPI data from Israeli CBS
    const response = await fetch(
      `${CBS_API_BASE}/price?id=${CPI_INDEX_ID}&format=json`,
      {
        headers: {
          'User-Agent': 'Lovable-Portfolio-App/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`CBS API error: ${response.status} ${response.statusText}`);
      throw new Error(`CBS API returned ${response.status}`);
    }

    const data: CBSPriceResponse = await response.json();
    console.log(`Received ${data.Prices?.length || 0} CPI data points`);

    // Transform CBS data to our format
    const cpiData: CPIDataPoint[] = [];
    
    if (data.Prices && Array.isArray(data.Prices)) {
      for (const price of data.Prices) {
        if (price.date && price.currBase !== undefined) {
          // CBS returns date in format like "2024-01" or "01/2024"
          let dateStr = price.date;
          
          // Convert "01/2024" to "2024-01" if needed
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 2) {
              dateStr = `${parts[1]}-${parts[0].padStart(2, '0')}`;
            }
          }
          
          // Validate date format
          if (/^\d{4}-\d{2}$/.test(dateStr)) {
            cpiData.push({
              date: dateStr,
              value: price.currBase,
            });
          }
        }
      }
    }

    // Sort by date ascending
    cpiData.sort((a, b) => a.date.localeCompare(b.date));

    console.log(`Processed ${cpiData.length} valid CPI entries`);
    console.log(`Date range: ${cpiData[0]?.date} to ${cpiData[cpiData.length - 1]?.date}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: cpiData,
        source: 'Israeli Central Bureau of Statistics',
        indexId: CPI_INDEX_ID,
        indexName: 'Consumer Price Index - General',
        fetchedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error fetching CPI data:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch CPI data',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
