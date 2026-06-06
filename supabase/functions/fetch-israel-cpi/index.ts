import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth.ts";

// Israeli CBS API for CPI (Consumer Price Index)
// Index ID 120010 = General CPI Index
const CPI_INDEX_ID = '120010';

interface CPIDataPoint {
  date: string; // YYYY-MM format
  value: number;
}

// CBS API response structure
interface CBSDateEntry {
  year: number;
  month: number;
  monthDesc: string;
  percent: number;
  percentYear: number;
  currBase: {
    baseDesc: string;
    value: number;
  };
}

interface CBSMonthItem {
  code: number;
  name: string;
  date: CBSDateEntry[];
}

interface CBSResponse {
  month: CBSMonthItem[];
  quarter?: unknown[];
  paging?: unknown;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }

  try {
    // Verify caller is authenticated
    const auth = await requireAuth(req, corsHeaders);
    if (!auth.ok) return auth.response;

    console.log('Fetching Israeli CPI data from CBS API...');

    const apiUrl = `https://api.cbs.gov.il/index/data/price?id=${CPI_INDEX_ID}&format=json&download=false`;
    console.log(`CBS API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    console.log(`CBS Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CBS API error: ${errorText.substring(0, 300)}`);
      throw new Error(`CBS API returned ${response.status}`);
    }

    const data: CBSResponse = await response.json();
    console.log(`Response has ${data.month?.length || 0} month items`);

    const cpiData: CPIDataPoint[] = [];
    
    // CBS structure: { month: [{ code, name, date: [{ year, month, currBase: { value } }] }] }
    if (data.month && Array.isArray(data.month)) {
      for (const monthItem of data.month) {
        // Find the CPI index (code 120010)
        if (monthItem.code === Number(CPI_INDEX_ID) && monthItem.date) {
          console.log(`Found CPI index with ${monthItem.date.length} date entries`);
          
          for (const entry of monthItem.date) {
            if (entry.year && entry.month && entry.currBase?.value !== undefined) {
              // Format: YYYY-MM
              const dateStr = `${entry.year}-${String(entry.month).padStart(2, '0')}`;
              
              cpiData.push({
                date: dateStr,
                value: entry.currBase.value,
              });
            }
          }
        }
      }
    }

    // Sort by date ascending
    cpiData.sort((a, b) => a.date.localeCompare(b.date));

    console.log(`Successfully parsed ${cpiData.length} CPI entries`);
    if (cpiData.length > 0) {
      console.log(`Date range: ${cpiData[0].date} to ${cpiData[cpiData.length - 1].date}`);
      console.log(`Latest values: ${cpiData.slice(-3).map(d => `${d.date}=${d.value}`).join(', ')}`);
    }

    // Get base year from the response
    const baseDesc = data.month?.[0]?.date?.[0]?.currBase?.baseDesc || 'Unknown';

    return new Response(
      JSON.stringify({
        success: true,
        data: cpiData,
        source: 'Israeli Central Bureau of Statistics',
        indexId: CPI_INDEX_ID,
        indexName: 'מדד המחירים לצרכן - כללי (Consumer Price Index - General)',
        baseYear: baseDesc,
        fetchedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in fetch-israel-cpi:', error);

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
