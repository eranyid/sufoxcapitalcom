import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a senior hedge fund analyst for SUFOX Capital. Your tone is professional, cynical about market hype, and focused strictly on risk/reward and alpha generation.

Your role is to analyze portfolio data and identify:
1. SUSPICIOUS ACTIVITY - Unusual patterns, outliers, or anomalies that could indicate data entry errors, fraud, or system issues
2. MISINFORMATION - Data inconsistencies, unrealistic values, or entries that don't match expected patterns
3. ILLOGICAL DATA - Mathematical impossibilities, negative quantities where not allowed, dates in the future, circular references

For each issue found, provide:
- A severity level: "critical", "warning", or "info"
- A clear description of the issue
- The affected data/entity
- A recommended action

Be concise and direct. Focus on actionable insights. Do not sugarcoat issues.

Respond in valid JSON format with this structure:
{
  "summary": "Brief overall assessment",
  "issues": [
    {
      "severity": "critical|warning|info",
      "category": "suspicious_activity|misinformation|illogical_data",
      "description": "What's wrong",
      "affected": "Which data/entity",
      "recommendation": "What to do"
    }
  ],
  "clean_data_score": 0-100
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header to identify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { analysisType, data } = await req.json();
    console.log(`AI Watchdog analysis requested: ${analysisType} for user ${user.id}`);

    let dataToAnalyze = data;

    // If no data provided, fetch relevant data from database
    if (!dataToAnalyze) {
      const dataPromises = [
        supabase.from('transactions').select('*').eq('user_id', user.id).is('deleted_at', null).order('date', { ascending: false }).limit(50),
        supabase.from('crm_tasks').select('*').eq('user_id', user.id).is('deleted_at', null).limit(50),
        supabase.from('valuations').select('*').eq('user_id', user.id).is('deleted_at', null).limit(50),
        supabase.from('cash_balances').select('*').eq('user_id', user.id).single(),
      ];

      const [transactionsRes, tasksRes, valuationsRes, cashRes] = await Promise.all(dataPromises);

      dataToAnalyze = {
        transactions: transactionsRes.data || [],
        tasks: tasksRes.data || [],
        valuations: valuationsRes.data || [],
        cashBalances: cashRes.data || {},
        analysisTimestamp: new Date().toISOString(),
      };
    }

    const userPrompt = `Analyze the following portfolio data for suspicious activity, misinformation, and illogical data:

${JSON.stringify(dataToAnalyze, null, 2)}

Focus on:
- Transaction patterns that seem unusual
- Task data that might indicate issues
- Valuation inconsistencies
- Cash balance anomalies
- Any data that doesn't make logical sense`;

    console.log('Calling Lovable AI for analysis...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log('AI analysis complete');

    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      analysisResult = {
        summary: content,
        issues: [],
        clean_data_score: 50,
        parseError: true,
      };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: analysisResult,
      analyzedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Watchdog error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
