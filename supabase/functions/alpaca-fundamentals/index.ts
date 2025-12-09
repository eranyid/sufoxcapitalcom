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

    // If no API key, return mock data
    if (!fmpApiKey) {
      console.log("No FMP API key configured, returning mock data");
      const mockData = generateMockFinancials(upperSymbol, statementType, period, limit);
      return new Response(
        JSON.stringify({
          status: "success",
          symbol: upperSymbol,
          statementType,
          period,
          data: mockData,
          isMock: true,
          message: "Using sample data - FMP API key not configured",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      
      // Return mock data on API error
      console.log("FMP API failed, returning mock data");
      const mockData = generateMockFinancials(upperSymbol, statementType, period, limit);
      return new Response(
        JSON.stringify({
          status: "success",
          symbol: upperSymbol,
          statementType,
          period,
          data: mockData,
          isMock: true,
          message: "Using sample data - FMP API error",
          latency_ms,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log(`FMP response received, items: ${Array.isArray(data) ? data.length : 'N/A'}`);

    // Check for FMP error messages or empty data
    if (data["Error Message"] || !Array.isArray(data) || data.length === 0) {
      console.log("FMP returned error or empty data, returning mock data");
      const mockData = generateMockFinancials(upperSymbol, statementType, period, limit);
      return new Response(
        JSON.stringify({
          status: "success",
          symbol: upperSymbol,
          statementType,
          period,
          data: mockData,
          isMock: true,
          message: data["Error Message"] || "No data available, using sample data",
          latency_ms,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    
    // Return mock data on any error
    try {
      const body = await req.clone().json();
      const { symbol = "AAPL", statementType = "income", period = "quarterly", limit = 8 } = body;
      const mockData = generateMockFinancials(symbol.toUpperCase(), statementType, period, limit);
      
      return new Response(
        JSON.stringify({
          status: "success",
          symbol: symbol.toUpperCase(),
          statementType,
          period,
          data: mockData,
          isMock: true,
          message: "Using sample data due to error",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: errorMessage,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
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

// Generate realistic mock financial data for development
function generateMockFinancials(symbol: string, statementType: string, period: string, limit: number): any[] {
  const isQuarterly = period === 'quarterly';
  const periods: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < limit; i++) {
    if (isQuarterly) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - (i * 3));
      const quarter = Math.ceil((date.getMonth() + 1) / 3);
      periods.push(`Q${quarter} ${date.getFullYear()}`);
    } else {
      periods.push(`${now.getFullYear() - i}`);
    }
  }
  
  // Base values that vary by symbol (pseudo-random based on symbol)
  const symbolHash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const baseRevenue = (symbolHash % 100 + 50) * 1000000000; // 50B - 150B range
  const growthRate = 1 + (symbolHash % 20) / 100; // 0-20% growth
  
  switch (statementType) {
    case 'income':
      return periods.map((p, i) => {
        const revenue = baseRevenue * Math.pow(growthRate, limit - i - 1) * (0.9 + Math.random() * 0.2);
        const margin = 0.15 + (symbolHash % 20) / 100; // 15-35% margin
        return {
          period: p,
          revenue: Math.round(revenue),
          netIncome: Math.round(revenue * margin * (0.8 + Math.random() * 0.4)),
          grossProfit: Math.round(revenue * (margin + 0.2)),
          operatingIncome: Math.round(revenue * (margin + 0.05)),
          ebitda: Math.round(revenue * (margin + 0.1)),
        };
      }).reverse();
      
    case 'balance':
      return periods.map((p, i) => {
        const assets = baseRevenue * 2 * Math.pow(growthRate, limit - i - 1);
        const debtRatio = 0.3 + (symbolHash % 30) / 100; // 30-60% debt ratio
        return {
          period: p,
          totalAssets: Math.round(assets * (0.9 + Math.random() * 0.2)),
          totalLiabilities: Math.round(assets * debtRatio * (0.9 + Math.random() * 0.2)),
          totalEquity: Math.round(assets * (1 - debtRatio) * (0.9 + Math.random() * 0.2)),
          totalDebt: Math.round(assets * debtRatio * 0.6),
          cash: Math.round(assets * 0.1 * (0.5 + Math.random())),
        };
      }).reverse();
      
    case 'cashflow':
      return periods.map((p, i) => {
        const opCash = baseRevenue * 0.2 * Math.pow(growthRate, limit - i - 1);
        return {
          period: p,
          operatingCashFlow: Math.round(opCash * (0.8 + Math.random() * 0.4)),
          investingCashFlow: Math.round(-opCash * 0.4 * (0.8 + Math.random() * 0.4)),
          financingCashFlow: Math.round(-opCash * 0.3 * (0.5 + Math.random())),
          freeCashFlow: Math.round(opCash * 0.6 * (0.8 + Math.random() * 0.4)),
          capex: Math.round(-opCash * 0.3 * (0.8 + Math.random() * 0.4)),
        };
      }).reverse();
      
    default:
      return [];
  }
}