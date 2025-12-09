import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Fundamentals API endpoint called");

  const fmpApiKey = Deno.env.get('FMP_API_KEY');

  if (!fmpApiKey) {
    console.error("Missing FMP API key");
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: "Missing FMP API credentials.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { symbol, statementType = "income", period = "quarterly", limit = 8 } = body;

    if (!symbol) {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "Missing 'symbol' parameter",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upperSymbol = symbol.toUpperCase();
    console.log(`Fetching fundamentals for ${upperSymbol}, statement: ${statementType}, period: ${period}`);

    // Build FMP endpoint based on statement type
    let endpoint: string;
    switch (statementType) {
      case 'income':
        endpoint = period === 'annual' 
          ? `${FMP_BASE_URL}/income-statement/${upperSymbol}?limit=${limit}&apikey=${fmpApiKey}`
          : `${FMP_BASE_URL}/income-statement/${upperSymbol}?period=quarter&limit=${limit}&apikey=${fmpApiKey}`;
        break;
      case 'balance':
        endpoint = period === 'annual'
          ? `${FMP_BASE_URL}/balance-sheet-statement/${upperSymbol}?limit=${limit}&apikey=${fmpApiKey}`
          : `${FMP_BASE_URL}/balance-sheet-statement/${upperSymbol}?period=quarter&limit=${limit}&apikey=${fmpApiKey}`;
        break;
      case 'cashflow':
        endpoint = period === 'annual'
          ? `${FMP_BASE_URL}/cash-flow-statement/${upperSymbol}?limit=${limit}&apikey=${fmpApiKey}`
          : `${FMP_BASE_URL}/cash-flow-statement/${upperSymbol}?period=quarter&limit=${limit}&apikey=${fmpApiKey}`;
        break;
      default:
        endpoint = `${FMP_BASE_URL}/income-statement/${upperSymbol}?period=quarter&limit=${limit}&apikey=${fmpApiKey}`;
    }

    console.log(`Fetching from FMP: ${endpoint.replace(fmpApiKey, '***')}`);
    
    const startTime = performance.now();
    const response = await fetch(endpoint, { method: 'GET' });
    const endTime = performance.now();
    const latency_ms = Math.round(endTime - startTime);

    console.log(`FMP response status: ${response.status}, latency: ${latency_ms}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FMP API error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({
          status: "error",
          message: `FMP API error: ${response.status}`,
          latency_ms,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`FMP response received, items: ${Array.isArray(data) ? data.length : 'N/A'}`);

    // Check for FMP error messages
    if (data["Error Message"]) {
      console.error("FMP error:", data["Error Message"]);
      return new Response(
        JSON.stringify({
          status: "error",
          message: data["Error Message"],
          latency_ms,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform the data into our expected format
    const transformedData = transformFmpData(data, statementType, period);

    return new Response(
      JSON.stringify({
        status: "success",
        symbol: upperSymbol,
        statementType,
        period,
        data: transformedData,
        isMock: false,
        latency_ms,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("Error in fundamentals function:", errorMessage);
    
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Transform FMP data to our expected format
function transformFmpData(data: any[], statementType: string, period: string): any[] {
  if (!Array.isArray(data) || data.length === 0) return [];
  
  // Reverse to show oldest first
  const sortedData = [...data].reverse();
  
  switch (statementType) {
    case 'income':
      return sortedData.map((f: any) => {
        const date = new Date(f.date);
        const periodLabel = period === 'annual' 
          ? date.getFullYear().toString()
          : `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
        
        return {
          period: periodLabel,
          date: f.date,
          revenue: f.revenue || 0,
          netIncome: f.netIncome || 0,
          grossProfit: f.grossProfit || 0,
          operatingIncome: f.operatingIncome || 0,
          ebitda: f.ebitda || 0,
          eps: f.eps || 0,
          costOfRevenue: f.costOfRevenue || 0,
          operatingExpenses: f.operatingExpenses || 0,
        };
      });
      
    case 'balance':
      return sortedData.map((f: any) => {
        const date = new Date(f.date);
        const periodLabel = period === 'annual' 
          ? date.getFullYear().toString()
          : `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
        
        return {
          period: periodLabel,
          date: f.date,
          totalAssets: f.totalAssets || 0,
          totalLiabilities: f.totalLiabilities || 0,
          totalEquity: f.totalStockholdersEquity || f.totalEquity || 0,
          totalDebt: f.totalDebt || 0,
          cash: f.cashAndCashEquivalents || f.cash || 0,
          shortTermDebt: f.shortTermDebt || 0,
          longTermDebt: f.longTermDebt || 0,
          totalCurrentAssets: f.totalCurrentAssets || 0,
          totalCurrentLiabilities: f.totalCurrentLiabilities || 0,
        };
      });
      
    case 'cashflow':
      return sortedData.map((f: any) => {
        const date = new Date(f.date);
        const periodLabel = period === 'annual' 
          ? date.getFullYear().toString()
          : `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
        
        return {
          period: periodLabel,
          date: f.date,
          operatingCashFlow: f.operatingCashFlow || f.netCashProvidedByOperatingActivities || 0,
          investingCashFlow: f.netCashUsedForInvestingActivites || f.netCashProvidedByInvestingActivities || 0,
          financingCashFlow: f.netCashUsedProvidedByFinancingActivities || f.financingCashFlow || 0,
          freeCashFlow: f.freeCashFlow || 0,
          capex: f.capitalExpenditure || 0,
          dividendsPaid: f.dividendsPaid || 0,
          stockRepurchases: f.commonStockRepurchased || 0,
        };
      });
      
    default:
      return sortedData;
  }
}