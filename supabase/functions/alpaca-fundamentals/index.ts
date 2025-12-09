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

// Generate realistic mock financial data using real Apple data
function generateMockFinancials(symbol: string, statementType: string, period: string, limit: number): any[] {
  // Real Apple quarterly financial data (most recent quarters, in millions USD)
  const appleIncomeQuarterly = [
    { period: "Q4 2023", revenue: 89498000000, netIncome: 22956000000, grossProfit: 40427000000, operatingIncome: 26962000000, ebitda: 29868000000 },
    { period: "Q1 2024", revenue: 119575000000, netIncome: 33916000000, grossProfit: 54855000000, operatingIncome: 40373000000, ebitda: 44279000000 },
    { period: "Q2 2024", revenue: 90753000000, netIncome: 23636000000, grossProfit: 42269000000, operatingIncome: 27900000000, ebitda: 30806000000 },
    { period: "Q3 2024", revenue: 85777000000, netIncome: 21448000000, grossProfit: 39678000000, operatingIncome: 25352000000, ebitda: 28258000000 },
    { period: "Q4 2024", revenue: 94930000000, netIncome: 14736000000, grossProfit: 43879000000, operatingIncome: 29592000000, ebitda: 32498000000 },
    { period: "Q1 2025", revenue: 124300000000, netIncome: 36330000000, grossProfit: 58274000000, operatingIncome: 43456000000, ebitda: 47362000000 },
    { period: "Q2 2025", revenue: 95359000000, netIncome: 24780000000, grossProfit: 44570000000, operatingIncome: 29410000000, ebitda: 32316000000 },
    { period: "Q3 2025", revenue: 102466000000, netIncome: 27466000000, grossProfit: 47800000000, operatingIncome: 31500000000, ebitda: 34406000000 },
  ];

  const appleBalanceQuarterly = [
    { period: "Q4 2023", totalAssets: 352583000000, totalLiabilities: 290437000000, totalEquity: 62146000000, totalDebt: 111088000000, cash: 29965000000 },
    { period: "Q1 2024", totalAssets: 353514000000, totalLiabilities: 279414000000, totalEquity: 74100000000, totalDebt: 104590000000, cash: 40760000000 },
    { period: "Q2 2024", totalAssets: 337411000000, totalLiabilities: 274764000000, totalEquity: 62647000000, totalDebt: 101304000000, cash: 32695000000 },
    { period: "Q3 2024", totalAssets: 331647000000, totalLiabilities: 264816000000, totalEquity: 66831000000, totalDebt: 97343000000, cash: 25565000000 },
    { period: "Q4 2024", totalAssets: 364980000000, totalLiabilities: 308030000000, totalEquity: 56950000000, totalDebt: 106629000000, cash: 29943000000 },
    { period: "Q1 2025", totalAssets: 364840000000, totalLiabilities: 296412000000, totalEquity: 68428000000, totalDebt: 96512000000, cash: 34686000000 },
    { period: "Q2 2025", totalAssets: 348279000000, totalLiabilities: 286384000000, totalEquity: 61895000000, totalDebt: 94580000000, cash: 28907000000 },
    { period: "Q3 2025", totalAssets: 364530000000, totalLiabilities: 302650000000, totalEquity: 61880000000, totalDebt: 98230000000, cash: 30120000000 },
  ];

  const appleCashflowQuarterly = [
    { period: "Q4 2023", operatingCashFlow: 23059000000, freeCashFlow: 20828000000, investingCashFlow: -1576000000, financingCashFlow: -21313000000, capex: -2231000000 },
    { period: "Q1 2024", operatingCashFlow: 39895000000, freeCashFlow: 37559000000, investingCashFlow: 6283000000, financingCashFlow: -33283000000, capex: -2336000000 },
    { period: "Q2 2024", operatingCashFlow: 22690000000, freeCashFlow: 20690000000, investingCashFlow: -1892000000, financingCashFlow: -28859000000, capex: -2000000000 },
    { period: "Q3 2024", operatingCashFlow: 28859000000, freeCashFlow: 26570000000, investingCashFlow: -3028000000, financingCashFlow: -32683000000, capex: -2289000000 },
    { period: "Q4 2024", operatingCashFlow: 26812000000, freeCashFlow: 24328000000, investingCashFlow: -24177000000, financingCashFlow: -2207000000, capex: -2484000000 },
    { period: "Q1 2025", operatingCashFlow: 29037000000, freeCashFlow: 26842000000, investingCashFlow: -2985000000, financingCashFlow: -21309000000, capex: -2195000000 },
    { period: "Q2 2025", operatingCashFlow: 24087000000, freeCashFlow: 21987000000, investingCashFlow: -2315000000, financingCashFlow: -27551000000, capex: -2100000000 },
    { period: "Q3 2025", operatingCashFlow: 26850000000, freeCashFlow: 24550000000, investingCashFlow: -2400000000, financingCashFlow: -23250000000, capex: -2300000000 },
  ];

  // For non-Apple symbols, generate proportionally scaled data
  const symbolUpper = symbol.toUpperCase();
  
  if (symbolUpper === 'AAPL') {
    switch (statementType) {
      case 'income':
        return appleIncomeQuarterly.slice(-limit);
      case 'balance':
        return appleBalanceQuarterly.slice(-limit);
      case 'cashflow':
        return appleCashflowQuarterly.slice(-limit);
      default:
        return [];
    }
  }

  // For other symbols, scale based on a hash
  const symbolHash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const scaleFactor = 0.1 + (symbolHash % 100) / 100; // 0.1 to 1.1 scale

  switch (statementType) {
    case 'income':
      return appleIncomeQuarterly.slice(-limit).map(d => ({
        ...d,
        revenue: Math.round(d.revenue * scaleFactor),
        netIncome: Math.round(d.netIncome * scaleFactor),
        grossProfit: Math.round(d.grossProfit * scaleFactor),
        operatingIncome: Math.round(d.operatingIncome * scaleFactor),
        ebitda: Math.round(d.ebitda * scaleFactor),
      }));
    case 'balance':
      return appleBalanceQuarterly.slice(-limit).map(d => ({
        ...d,
        totalAssets: Math.round(d.totalAssets * scaleFactor),
        totalLiabilities: Math.round(d.totalLiabilities * scaleFactor),
        totalEquity: Math.round(d.totalEquity * scaleFactor),
        totalDebt: Math.round(d.totalDebt * scaleFactor),
        cash: Math.round(d.cash * scaleFactor),
      }));
    case 'cashflow':
      return appleCashflowQuarterly.slice(-limit).map(d => ({
        ...d,
        operatingCashFlow: Math.round(d.operatingCashFlow * scaleFactor),
        freeCashFlow: Math.round(d.freeCashFlow * scaleFactor),
        investingCashFlow: Math.round(d.investingCashFlow * scaleFactor),
        financingCashFlow: Math.round(d.financingCashFlow * scaleFactor),
        capex: Math.round(d.capex * scaleFactor),
      }));
    default:
      return [];
  }
}