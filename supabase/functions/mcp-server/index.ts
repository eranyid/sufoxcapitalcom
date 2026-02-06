import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const app = new Hono();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper: create an authenticated supabase client from the request's auth header
function getSupabaseClient(authHeader: string | null) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!authHeader) throw new Error("Missing Authorization header");

  const token = authHeader.replace("Bearer ", "");

  // Create a client that acts as the authenticated user
  return createClient(supabaseUrl, supabaseServiceKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// We need to authenticate per-request, so we store auth context
let currentAuthHeader: string | null = null;

const mcpServer = new McpServer({
  name: "sufox-capital-mcp",
  version: "1.0.0",
});

// ─── TOOL: get_portfolio_summary ───
mcpServer.tool({
  name: "get_portfolio_summary",
  description:
    "Get a complete portfolio summary: all transactions, current holdings, cash balances, valuations, and policy targets. Returns everything needed for portfolio analysis.",
  inputSchema: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "Optional client ID to scope data. Omit for personal portfolio.",
      },
    },
  },
  handler: async (params: { client_id?: string }) => {
    const supabase = getSupabaseClient(currentAuthHeader);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const userId = user.id;
    const clientId = params.client_id || null;

    const clientFilter = (query: any) => {
      if (clientId) return query.eq("client_id", clientId);
      return query.is("client_id", null);
    };

    // Fetch all data in parallel
    const [txns, holdings, valuations, cashRes, policyTargets, policyRes, settings] =
      await Promise.all([
        clientFilter(
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null)
            .order("date", { ascending: false })
            .limit(500)
        ),
        clientFilter(
          supabase
            .from("holdings_snapshot")
            .select("*")
            .eq("user_id", userId)
            .gt("quantity", 0)
        ),
        clientFilter(
          supabase
            .from("valuations")
            .select("*")
            .eq("user_id", userId)
            .is("deleted_at", null)
            .order("date", { ascending: false })
            .limit(500)
        ),
        clientFilter(
          supabase.from("cash_balances").select("*").eq("user_id", userId)
        ),
        clientFilter(
          supabase
            .from("policy_target_holdings")
            .select("*")
            .eq("user_id", userId)
        ),
        clientFilter(
          supabase.from("investment_policies").select("*").eq("user_id", userId)
        ),
        clientFilter(
          supabase.from("portfolio_settings").select("*").eq("user_id", userId)
        ),
      ]);

    const summary = {
      user_id: userId,
      client_id: clientId,
      transactions: txns.data || [],
      holdings: holdings.data || [],
      valuations: valuations.data || [],
      cash_balances: cashRes.data || [],
      policy_targets: policyTargets.data || [],
      investment_policy: policyRes.data?.[0] || null,
      portfolio_settings: settings.data?.[0] || null,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  },
});

// ─── TOOL: get_crm_data ───
mcpServer.tool({
  name: "get_crm_data",
  description:
    "Get CRM data: companies/research, funds, tasks, projects, and decision logs.",
  inputSchema: {
    type: "object",
    properties: {
      client_id: {
        type: "string",
        description: "Optional client ID to scope data.",
      },
    },
  },
  handler: async (params: { client_id?: string }) => {
    const supabase = getSupabaseClient(currentAuthHeader);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const userId = user.id;

    const [companies, funds, tasks, projects, decisions] = await Promise.all([
      supabase
        .from("crm_companies")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("crm_funds")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("crm_tasks")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("crm_projects")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("company_decisions")
        .select("*")
        .eq("user_id", userId)
        .order("decision_date", { ascending: false })
        .limit(200),
    ]);

    const crmData = {
      companies: companies.data || [],
      funds: funds.data || [],
      tasks: tasks.data || [],
      projects: projects.data || [],
      decisions: decisions.data || [],
    };

    return {
      content: [{ type: "text", text: JSON.stringify(crmData, null, 2) }],
    };
  },
});

// ─── TOOL: get_fx_rates ───
mcpServer.tool({
  name: "get_fx_rates",
  description: "Get FX rates history for portfolio currency conversions.",
  inputSchema: {
    type: "object",
    properties: {
      client_id: { type: "string", description: "Optional client ID." },
    },
  },
  handler: async (params: { client_id?: string }) => {
    const supabase = getSupabaseClient(currentAuthHeader);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const clientId = params.client_id || null;
    let query = supabase
      .from("fx_rates")
      .select("*")
      .eq("user_id", user.id)
      .order("rate_date", { ascending: false })
      .limit(500);
    if (clientId) query = query.eq("client_id", clientId);
    else query = query.is("client_id", null);

    const { data } = await query;

    return {
      content: [{ type: "text", text: JSON.stringify(data || [], null, 2) }],
    };
  },
});

// ─── TOOL: get_target_allocations ───
mcpServer.tool({
  name: "get_target_allocations",
  description:
    "Get strategic target allocations (from construction wizard) with allocation lines by asset class, geography, etc.",
  inputSchema: {
    type: "object",
    properties: {
      client_id: { type: "string", description: "Optional client ID." },
    },
  },
  handler: async (params: { client_id?: string }) => {
    const supabase = getSupabaseClient(currentAuthHeader);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const clientId = params.client_id || null;
    let query = supabase
      .from("target_allocations")
      .select("*, target_allocation_lines(*)")
      .eq("user_id", user.id);
    if (clientId) query = query.eq("client_id", clientId);
    else query = query.is("client_id", null);

    const { data } = await query;

    return {
      content: [{ type: "text", text: JSON.stringify(data || [], null, 2) }],
    };
  },
});

// ─── TOOL: get_clients ───
mcpServer.tool({
  name: "get_clients",
  description: "List all clients managed by this user.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const supabase = getSupabaseClient(currentAuthHeader);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id);

    return {
      content: [{ type: "text", text: JSON.stringify(data || [], null, 2) }],
    };
  },
});

// ─── TOOL: run_sql_read ───
mcpServer.tool({
  name: "query_table",
  description:
    "Read data from any table. Specify the table name and optional filters. Use this for ad-hoc queries on any data.",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string", description: "Table name, e.g. 'transactions'" },
      select: {
        type: "string",
        description: "Columns to select, e.g. '*' or 'ticker, quantity, price_per_unit'",
      },
      filters: {
        type: "array",
        description:
          "Array of filter objects: {column, operator, value}. Operators: eq, neq, gt, gte, lt, lte, like, ilike, is",
        items: {
          type: "object",
          properties: {
            column: { type: "string" },
            operator: { type: "string" },
            value: { type: "string" },
          },
        },
      },
      order_by: { type: "string", description: "Column to order by" },
      ascending: { type: "boolean", description: "Order direction, default false" },
      limit: { type: "number", description: "Max rows to return, default 100" },
    },
    required: ["table"],
  },
  handler: async (params: {
    table: string;
    select?: string;
    filters?: { column: string; operator: string; value: string }[];
    order_by?: string;
    ascending?: boolean;
    limit?: number;
  }) => {
    const supabase = getSupabaseClient(currentAuthHeader);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    let query = supabase
      .from(params.table)
      .select(params.select || "*")
      .limit(params.limit || 100);

    // Always filter by user_id for security
    query = query.eq("user_id", user.id);

    if (params.filters) {
      for (const f of params.filters) {
        switch (f.operator) {
          case "eq": query = query.eq(f.column, f.value); break;
          case "neq": query = query.neq(f.column, f.value); break;
          case "gt": query = query.gt(f.column, f.value); break;
          case "gte": query = query.gte(f.column, f.value); break;
          case "lt": query = query.lt(f.column, f.value); break;
          case "lte": query = query.lte(f.column, f.value); break;
          case "like": query = query.like(f.column, f.value); break;
          case "ilike": query = query.ilike(f.column, f.value); break;
          case "is": query = query.is(f.column, f.value === "null" ? null : f.value); break;
        }
      }
    }

    if (params.order_by) {
      query = query.order(params.order_by, { ascending: params.ascending ?? false });
    }

    const { data, error } = await query;
    if (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ rows: data?.length || 0, data: data || [] }, null, 2),
        },
      ],
    };
  },
});

// ─── HTTP transport ───
const transport = new StreamableHttpTransport();

app.all("/*", async (c) => {
  // Capture auth header for tool handlers
  currentAuthHeader = c.req.header("Authorization") || null;

  // Handle CORS
  if (c.req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const response = await transport.handleRequest(c.req.raw, mcpServer);

    // Add CORS headers to the response
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders)) {
      newHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (err) {
    console.error("[MCP Server] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

Deno.serve(app.fetch);
