import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PolicyData {
  strategy_philosophy: string | null;
  equity_min_pct: number;
  equity_max_pct: number;
  fixed_income_min_pct: number;
  fixed_income_max_pct: number;
  alternatives_min_pct: number;
  alternatives_max_pct: number;
  cash_min_pct: number;
  max_single_position_pct: number;
  max_sector_allocation_pct: number;
  geographic_limits: Record<string, { min: number; max: number }>;
  risk_tolerance: 'low' | 'medium' | 'high';
  investment_horizon_years: number;
  leverage_allowed: boolean;
  max_leverage_ratio: number;
  min_liquid_assets_pct: number;
  special_constraints: string | null;
}

interface PortfolioSummary {
  totalValue: number;
  holdings: Array<{
    ticker: string;
    assetName: string;
    assetType: string;
    geography: string;
    value: number;
    weight: number;
  }>;
  allocationByAssetType: Record<string, number>;
  allocationByGeography: Record<string, number>;
  topPositions: Array<{ ticker: string; weight: number }>;
  cashPct: number;
  numberOfHoldings: number;
}

interface ProposedTrade {
  ticker: string;
  assetName: string;
  assetType: string;
  geography: string;
  transactionType: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
}

serve(async (req) => {
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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    // Verify user is approved
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_approved')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile?.is_approved) {
      return new Response(
        JSON.stringify({ error: 'Account not approved' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // ===== END AUTHENTICATION =====

    const { policy, portfolio, proposedTrade, query, mode = 'full' } = await req.json() as { 
      policy: PolicyData; 
      portfolio: PortfolioSummary;
      proposedTrade?: ProposedTrade;
      query?: string;
      mode?: 'full' | 'pre-trade' | 'compliance-check';
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the analysis prompt based on mode
    let systemPrompt: string;
    
    if (mode === 'compliance-check') {
      systemPrompt = `You are an expert investment compliance officer. Your role is to evaluate whether a USER'S INTENDED ACTION would be allowed under their investment policy.

You will receive:
1. The investor's written strategy and philosophy
2. Their structured policy constraints (allocation limits, risk tolerance, leverage rules, etc.)
3. A summary of their CURRENT portfolio
4. A natural language description of what they want to do

Your task is to:
1. Understand the user's intent
2. Evaluate if the action would violate any policy constraints
3. Provide a clear decision with reasoning

**You MUST respond with EXACTLY this format:**

**STATUS:** [EXACTLY one of: "Allowed" OR "Allowed with conditions" OR "Not allowed"]

**REASONING:** [2-3 sentences explaining why, referencing specific policy constraints]

**GUIDANCE:** [If not allowed or with conditions: specific steps to make it compliant. If allowed: brief confirmation or monitoring suggestion. Keep it actionable.]

Be precise and reference actual numbers from the policy. No generic advice.`;
    } else if (mode === 'pre-trade') {
      systemPrompt = `You are an expert investment compliance officer. Your role is to evaluate whether a PROPOSED TRADE would keep a portfolio aligned with the investor's investment policy.

You will receive:
1. The investor's written strategy and philosophy
2. Their structured policy constraints (allocation limits, risk tolerance, etc.)
3. A summary of their CURRENT portfolio
4. Details of the PROPOSED TRADE

Your task is to:
1. Simulate what the portfolio would look like AFTER the trade executes
2. Check if the post-trade portfolio would violate any policy constraints
3. Provide a clear APPROVE or REJECT recommendation

**Classification** (EXACTLY one of these):
- "APPROVED - Trade Compliant" - The trade keeps the portfolio within policy limits
- "APPROVED WITH CAUTION" - Trade is acceptable but approaches policy limits
- "REJECTED - Policy Violation" - The trade would cause a policy violation

**Key Impact Points** (2-3 bullet points):
- How the trade affects allocation percentages
- Any limits that would be approached or breached
- Impact on concentration or diversification

**Recommendation**:
- If approved: any monitoring suggestions
- If rejected: what would need to change to make the trade compliant`;
    } else {
      systemPrompt = `You are an expert investment compliance officer and portfolio analyst. Your role is to evaluate whether a portfolio aligns with an investor's stated investment policy and strategy.

You will receive:
1. The investor's written strategy and philosophy
2. Their structured policy constraints (allocation limits, risk tolerance, etc.)
3. A summary of their current portfolio

Your task is to provide a professional evaluation with:

1. **Classification** (EXACTLY one of these):
   - "Feasible & Suitable" - Portfolio fully aligns with policy
   - "Feasible but Not Fully Suitable" - Portfolio is workable but has minor deviations
   - "Not Feasible in its current form" - Portfolio has significant policy violations
   - "Not Aligned with stated policy" - Portfolio fundamentally contradicts the strategy

2. **Key Findings** (2-4 bullet points explaining the classification)

3. **Actionable Recommendations** (2-4 specific actions to improve alignment)

Be precise, professional, and actionable. Reference specific numbers and percentages from the policy and portfolio.`;
    }

    let userPrompt: string;
    if (mode === 'compliance-check' && query) {
      userPrompt = buildComplianceCheckPrompt(policy, portfolio, query);
    } else if (mode === 'pre-trade' && proposedTrade) {
      userPrompt = buildPreTradePrompt(policy, portfolio, proposedTrade);
    } else {
      userPrompt = buildAnalysisPrompt(policy, portfolio);
    }

    console.log(`Calling Lovable AI with google/gemini-3-flash-preview model... Mode: ${mode}`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI credits exhausted. Please add credits to continue." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    // Parse the AI response to extract structured data
    const analysis = mode === 'compliance-check' 
      ? parseComplianceResponse(aiResponse)
      : parseAIResponse(aiResponse);

    console.log("Analysis complete, mode:", mode);

    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      rawResponse: aiResponse
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-policy function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildAnalysisPrompt(policy: PolicyData, portfolio: PortfolioSummary): string {
  const parts: string[] = [];

  // Strategy section
  parts.push("## INVESTMENT STRATEGY & PHILOSOPHY");
  if (policy.strategy_philosophy) {
    parts.push(policy.strategy_philosophy);
  } else {
    parts.push("(No written strategy provided)");
  }

  // Policy constraints section
  parts.push("\n## POLICY CONSTRAINTS");
  parts.push(`- Equity allocation: ${policy.equity_min_pct}% - ${policy.equity_max_pct}%`);
  parts.push(`- Fixed income allocation: ${policy.fixed_income_min_pct}% - ${policy.fixed_income_max_pct}%`);
  parts.push(`- Alternatives allocation: ${policy.alternatives_min_pct}% - ${policy.alternatives_max_pct}%`);
  parts.push(`- Minimum cash: ${policy.cash_min_pct}%`);
  parts.push(`- Max single position: ${policy.max_single_position_pct}%`);
  parts.push(`- Max sector allocation: ${policy.max_sector_allocation_pct}%`);
  parts.push(`- Risk tolerance: ${policy.risk_tolerance}`);
  parts.push(`- Investment horizon: ${policy.investment_horizon_years} years`);
  parts.push(`- Leverage allowed: ${policy.leverage_allowed ? `Yes (max ${policy.max_leverage_ratio}x)` : 'No'}`);
  parts.push(`- Minimum liquid assets: ${policy.min_liquid_assets_pct}%`);

  if (Object.keys(policy.geographic_limits).length > 0) {
    parts.push("\nGeographic limits:");
    for (const [region, limits] of Object.entries(policy.geographic_limits)) {
      parts.push(`  - ${region}: ${limits.min}% - ${limits.max}%`);
    }
  }

  if (policy.special_constraints) {
    parts.push(`\nSpecial constraints: ${policy.special_constraints}`);
  }

  // Portfolio summary section
  parts.push("\n## CURRENT PORTFOLIO SUMMARY");
  parts.push(`- Total value: $${portfolio.totalValue.toLocaleString()}`);
  parts.push(`- Number of holdings: ${portfolio.numberOfHoldings}`);
  parts.push(`- Cash position: ${portfolio.cashPct.toFixed(1)}%`);

  parts.push("\nAllocation by asset type:");
  for (const [type, pct] of Object.entries(portfolio.allocationByAssetType)) {
    parts.push(`  - ${type}: ${pct.toFixed(1)}%`);
  }

  parts.push("\nAllocation by geography:");
  for (const [geo, pct] of Object.entries(portfolio.allocationByGeography)) {
    parts.push(`  - ${geo}: ${pct.toFixed(1)}%`);
  }

  parts.push("\nTop 5 positions:");
  portfolio.topPositions.slice(0, 5).forEach((pos, i) => {
    parts.push(`  ${i + 1}. ${pos.ticker}: ${pos.weight.toFixed(1)}%`);
  });

  parts.push("\n---\nPlease analyze whether this portfolio aligns with the stated investment policy and provide your evaluation.");

  return parts.join("\n");
}

function buildPreTradePrompt(policy: PolicyData, portfolio: PortfolioSummary, trade: ProposedTrade): string {
  const parts: string[] = [];

  // Strategy section
  parts.push("## INVESTMENT STRATEGY & PHILOSOPHY");
  if (policy.strategy_philosophy) {
    parts.push(policy.strategy_philosophy);
  } else {
    parts.push("(No written strategy provided)");
  }

  // Policy constraints section
  parts.push("\n## POLICY CONSTRAINTS");
  parts.push(`- Equity allocation: ${policy.equity_min_pct}% - ${policy.equity_max_pct}%`);
  parts.push(`- Fixed income allocation: ${policy.fixed_income_min_pct}% - ${policy.fixed_income_max_pct}%`);
  parts.push(`- Alternatives allocation: ${policy.alternatives_min_pct}% - ${policy.alternatives_max_pct}%`);
  parts.push(`- Minimum cash: ${policy.cash_min_pct}%`);
  parts.push(`- Max single position: ${policy.max_single_position_pct}%`);
  parts.push(`- Max sector allocation: ${policy.max_sector_allocation_pct}%`);
  parts.push(`- Risk tolerance: ${policy.risk_tolerance}`);
  parts.push(`- Investment horizon: ${policy.investment_horizon_years} years`);
  parts.push(`- Leverage allowed: ${policy.leverage_allowed ? `Yes (max ${policy.max_leverage_ratio}x)` : 'No'}`);
  parts.push(`- Minimum liquid assets: ${policy.min_liquid_assets_pct}%`);

  if (Object.keys(policy.geographic_limits).length > 0) {
    parts.push("\nGeographic limits:");
    for (const [region, limits] of Object.entries(policy.geographic_limits)) {
      parts.push(`  - ${region}: ${limits.min}% - ${limits.max}%`);
    }
  }

  if (policy.special_constraints) {
    parts.push(`\nSpecial constraints: ${policy.special_constraints}`);
  }

  // Current portfolio section
  parts.push("\n## CURRENT PORTFOLIO (BEFORE TRADE)");
  parts.push(`- Total value: $${portfolio.totalValue.toLocaleString()}`);
  parts.push(`- Number of holdings: ${portfolio.numberOfHoldings}`);
  parts.push(`- Cash position: ${portfolio.cashPct.toFixed(1)}%`);

  parts.push("\nAllocation by asset type:");
  for (const [type, pct] of Object.entries(portfolio.allocationByAssetType)) {
    parts.push(`  - ${type}: ${pct.toFixed(1)}%`);
  }

  parts.push("\nAllocation by geography:");
  for (const [geo, pct] of Object.entries(portfolio.allocationByGeography)) {
    parts.push(`  - ${geo}: ${pct.toFixed(1)}%`);
  }

  parts.push("\nTop 5 positions:");
  portfolio.topPositions.slice(0, 5).forEach((pos, i) => {
    parts.push(`  ${i + 1}. ${pos.ticker}: ${pos.weight.toFixed(1)}%`);
  });

  // Proposed trade section
  const tradeValue = trade.quantity * trade.pricePerUnit;
  parts.push("\n## PROPOSED TRADE");
  parts.push(`- Action: ${trade.transactionType.toUpperCase()}`);
  parts.push(`- Ticker: ${trade.ticker}`);
  parts.push(`- Asset Name: ${trade.assetName}`);
  parts.push(`- Asset Type: ${trade.assetType}`);
  parts.push(`- Geography: ${trade.geography}`);
  parts.push(`- Quantity: ${trade.quantity.toLocaleString()}`);
  parts.push(`- Price per Unit: $${trade.pricePerUnit.toFixed(2)}`);
  parts.push(`- Trade Value: $${tradeValue.toLocaleString()}`);

  // Calculate post-trade impact
  const isBuy = trade.transactionType === 'buy';
  const newTotalValue = isBuy 
    ? portfolio.totalValue + tradeValue 
    : portfolio.totalValue;
  const newPositionWeight = (tradeValue / newTotalValue) * 100;
  
  // Check existing position
  const existingPosition = portfolio.topPositions.find(p => p.ticker === trade.ticker);
  const existingWeight = existingPosition?.weight || 0;
  const postTradeWeight = isBuy 
    ? existingWeight + newPositionWeight 
    : Math.max(0, existingWeight - newPositionWeight);

  parts.push("\n## ESTIMATED POST-TRADE IMPACT");
  parts.push(`- New portfolio total: ~$${newTotalValue.toLocaleString()}`);
  parts.push(`- ${trade.ticker} weight: ${existingWeight.toFixed(1)}% → ~${postTradeWeight.toFixed(1)}%`);
  parts.push(`- Trade as % of portfolio: ${((tradeValue / portfolio.totalValue) * 100).toFixed(1)}%`);

  parts.push("\n---\nPlease evaluate whether this proposed trade keeps the portfolio within policy constraints. Provide your APPROVE/REJECT decision with explanation.");

  return parts.join("\n");
}

function parseAIResponse(response: string): {
  classification: string;
  findings: string[];
  recommendations: string[];
  fullAnalysis: string;
} {
  // Default values
  let classification = "Not Aligned with stated policy";
  const findings: string[] = [];
  const recommendations: string[] = [];

  // Try to extract classification (includes both full and pre-trade patterns)
  const classificationPatterns = [
    "APPROVED - Trade Compliant",
    "APPROVED WITH CAUTION",
    "REJECTED - Policy Violation",
    "Feasible & Suitable",
    "Feasible but Not Fully Suitable",
    "Not Feasible in its current form",
    "Not Aligned with stated policy"
  ];

  for (const pattern of classificationPatterns) {
    if (response.toLowerCase().includes(pattern.toLowerCase())) {
      classification = pattern;
      break;
    }
  }

  // Extract bullet points for findings and recommendations
  const lines = response.split('\n');
  let inFindings = false;
  let inRecommendations = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.toLowerCase().includes('key finding') || trimmed.toLowerCase().includes('findings')) {
      inFindings = true;
      inRecommendations = false;
      continue;
    }
    
    if (trimmed.toLowerCase().includes('recommendation') || trimmed.toLowerCase().includes('action')) {
      inFindings = false;
      inRecommendations = true;
      continue;
    }

    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.match(/^\d+\./)) {
      const content = trimmed.replace(/^[-•\d.]+\s*/, '').trim();
      if (content) {
        if (inFindings && findings.length < 4) {
          findings.push(content);
        } else if (inRecommendations && recommendations.length < 4) {
          recommendations.push(content);
        }
      }
    }
  }

  // Fallback: if we couldn't parse structured data, use generic extracts
  if (findings.length === 0) {
    findings.push("See full analysis for detailed findings.");
  }
  if (recommendations.length === 0) {
    recommendations.push("See full analysis for recommendations.");
  }

  return {
    classification,
    findings,
    recommendations,
    fullAnalysis: response
  };
}

function buildComplianceCheckPrompt(policy: PolicyData, portfolio: PortfolioSummary, query: string): string {
  const parts: string[] = [];

  // Strategy section
  parts.push("## INVESTMENT STRATEGY & PHILOSOPHY");
  if (policy.strategy_philosophy) {
    parts.push(policy.strategy_philosophy);
  } else {
    parts.push("(No written strategy provided)");
  }

  // Policy constraints section
  parts.push("\n## POLICY CONSTRAINTS");
  parts.push(`- Equity allocation: ${policy.equity_min_pct}% - ${policy.equity_max_pct}%`);
  parts.push(`- Fixed income allocation: ${policy.fixed_income_min_pct}% - ${policy.fixed_income_max_pct}%`);
  parts.push(`- Alternatives allocation: ${policy.alternatives_min_pct}% - ${policy.alternatives_max_pct}%`);
  parts.push(`- Minimum cash: ${policy.cash_min_pct}%`);
  parts.push(`- Max single position: ${policy.max_single_position_pct}%`);
  parts.push(`- Max sector allocation: ${policy.max_sector_allocation_pct}%`);
  parts.push(`- Risk tolerance: ${policy.risk_tolerance}`);
  parts.push(`- Investment horizon: ${policy.investment_horizon_years} years`);
  parts.push(`- Leverage allowed: ${policy.leverage_allowed ? `Yes (max ${policy.max_leverage_ratio}x)` : 'No'}`);
  parts.push(`- Minimum liquid assets: ${policy.min_liquid_assets_pct}%`);

  if (Object.keys(policy.geographic_limits).length > 0) {
    parts.push("\nGeographic limits:");
    for (const [region, limits] of Object.entries(policy.geographic_limits)) {
      parts.push(`  - ${region}: ${limits.min}% - ${limits.max}%`);
    }
  }

  if (policy.special_constraints) {
    parts.push(`\nSpecial constraints: ${policy.special_constraints}`);
  }

  // Portfolio summary section
  parts.push("\n## CURRENT PORTFOLIO SUMMARY");
  parts.push(`- Total value: $${portfolio.totalValue.toLocaleString()}`);
  parts.push(`- Number of holdings: ${portfolio.numberOfHoldings}`);
  parts.push(`- Cash position: ${portfolio.cashPct.toFixed(1)}%`);

  parts.push("\nAllocation by asset type:");
  for (const [type, pct] of Object.entries(portfolio.allocationByAssetType)) {
    parts.push(`  - ${type}: ${pct.toFixed(1)}%`);
  }

  parts.push("\nAllocation by geography:");
  for (const [geo, pct] of Object.entries(portfolio.allocationByGeography)) {
    parts.push(`  - ${geo}: ${pct.toFixed(1)}%`);
  }

  parts.push("\nTop 5 positions:");
  portfolio.topPositions.slice(0, 5).forEach((pos, i) => {
    parts.push(`  ${i + 1}. ${pos.ticker}: ${pos.weight.toFixed(1)}%`);
  });

  // User query
  parts.push("\n## USER'S INTENDED ACTION");
  parts.push(`"${query}"`);

  parts.push("\n---\nPlease evaluate whether this action would be allowed under the investment policy. Provide your STATUS, REASONING, and GUIDANCE.");

  return parts.join("\n");
}

function parseComplianceResponse(response: string): {
  status: 'allowed' | 'allowed_with_conditions' | 'not_allowed';
  reasoning: string;
  guidance: string | null;
  fullAnalysis: string;
} {
  let status: 'allowed' | 'allowed_with_conditions' | 'not_allowed' = 'not_allowed';
  let reasoning = '';
  let guidance: string | null = null;

  const lines = response.split('\n');
  let currentSection = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const lowerTrimmed = trimmed.toLowerCase();

    // Detect status
    if (lowerTrimmed.includes('**status:**') || lowerTrimmed.startsWith('status:')) {
      const statusText = trimmed.replace(/\*\*status:\*\*/i, '').replace(/status:/i, '').trim().toLowerCase();
      if (statusText.includes('allowed with conditions') || statusText.includes('with conditions')) {
        status = 'allowed_with_conditions';
      } else if (statusText.includes('not allowed') || statusText.includes('not_allowed')) {
        status = 'not_allowed';
      } else if (statusText.includes('allowed')) {
        status = 'allowed';
      }
      continue;
    }

    // Detect section headers
    if (lowerTrimmed.includes('**reasoning:**') || lowerTrimmed.startsWith('reasoning:')) {
      currentSection = 'reasoning';
      const content = trimmed.replace(/\*\*reasoning:\*\*/i, '').replace(/reasoning:/i, '').trim();
      if (content) reasoning = content;
      continue;
    }

    if (lowerTrimmed.includes('**guidance:**') || lowerTrimmed.startsWith('guidance:')) {
      currentSection = 'guidance';
      const content = trimmed.replace(/\*\*guidance:\*\*/i, '').replace(/guidance:/i, '').trim();
      if (content) guidance = content;
      continue;
    }

    // Accumulate content for current section
    if (trimmed && currentSection === 'reasoning' && !lowerTrimmed.includes('**')) {
      reasoning += (reasoning ? ' ' : '') + trimmed;
    }
    if (trimmed && currentSection === 'guidance' && !lowerTrimmed.includes('**')) {
      guidance = (guidance || '') + (guidance ? ' ' : '') + trimmed;
    }
  }

  // Fallbacks
  if (!reasoning) {
    reasoning = 'Unable to determine compliance reasoning from the analysis.';
  }

  return {
    status,
    reasoning,
    guidance,
    fullAnalysis: response
  };
}
