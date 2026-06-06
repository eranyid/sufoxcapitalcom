/**
 * Shared auth helper for Supabase Edge Functions.
 *
 * Verifies the caller's JWT and returns the authenticated user,
 * or a 401 Response that the handler can return immediately.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AuthSuccess {
  user: { id: string; email?: string };
  supabaseClient: ReturnType<typeof createClient>;
}

type AuthResult =
  | { ok: true; value: AuthSuccess }
  | { ok: false; response: Response };

export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      ),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      ),
    };
  }

  return { ok: true, value: { user, supabaseClient } };
}
