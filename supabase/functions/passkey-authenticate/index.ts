import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_PER_WINDOW = 10;
const BLOCK_DURATION_MINUTES = 30;

interface RateLimitEntry {
  id: string;
  identifier: string;
  action: string;
  attempt_count: number;
  first_attempt_at: string;
  last_attempt_at: string;
  blocked_until: string | null;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil: string | null;
}

// deno-lint-ignore no-explicit-any
async function checkRateLimit(
  supabase: any,
  identifier: string,
  action: string
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  
  // Check existing rate limit entry
  const { data, error: fetchError } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("identifier", identifier)
    .eq("action", action)
    .single();

  const existing = data as RateLimitEntry | null;

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Rate limit fetch error:", fetchError);
    // On error, allow the request but log it
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW, blockedUntil: null };
  }

  // No existing entry - create one and allow
  if (!existing) {
    await supabase.from("rate_limits").insert({
      identifier,
      action,
      attempt_count: 1,
      first_attempt_at: new Date().toISOString(),
      last_attempt_at: new Date().toISOString(),
    });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - 1, blockedUntil: null };
  }

  // Check if currently blocked
  if (existing.blocked_until) {
    const blockedUntil = new Date(existing.blocked_until);
    if (blockedUntil > new Date()) {
      console.warn(`Rate limit: ${identifier} is blocked until ${existing.blocked_until}`);
      return { allowed: false, remainingAttempts: 0, blockedUntil: existing.blocked_until };
    }
    // Block has expired, reset the counter
    await supabase
      .from("rate_limits")
      .update({
        attempt_count: 1,
        first_attempt_at: new Date().toISOString(),
        last_attempt_at: new Date().toISOString(),
        blocked_until: null,
      })
      .eq("identifier", identifier)
      .eq("action", action);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - 1, blockedUntil: null };
  }

  // Check if window has expired
  const firstAttempt = new Date(existing.first_attempt_at);
  if (firstAttempt < new Date(windowStart)) {
    // Window expired, reset counter
    await supabase
      .from("rate_limits")
      .update({
        attempt_count: 1,
        first_attempt_at: new Date().toISOString(),
        last_attempt_at: new Date().toISOString(),
      })
      .eq("identifier", identifier)
      .eq("action", action);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - 1, blockedUntil: null };
  }

  // Within window - check attempt count
  const newCount = existing.attempt_count + 1;
  
  if (newCount > MAX_ATTEMPTS_PER_WINDOW) {
    // Block the identifier
    const blockedUntil = new Date(Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from("rate_limits")
      .update({
        attempt_count: newCount,
        last_attempt_at: new Date().toISOString(),
        blocked_until: blockedUntil,
      })
      .eq("identifier", identifier)
      .eq("action", action);
    console.warn(`Rate limit exceeded: ${identifier} blocked until ${blockedUntil}`);
    return { allowed: false, remainingAttempts: 0, blockedUntil };
  }

  // Increment counter and allow
  await supabase
    .from("rate_limits")
    .update({
      attempt_count: newCount,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("identifier", identifier)
    .eq("action", action);

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS_PER_WINDOW - newCount, blockedUntil: null };
}

function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers (in order of preference)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a hash of user-agent + origin as identifier
  const userAgent = req.headers.get("user-agent") || "unknown";
  const origin = req.headers.get("origin") || "unknown";
  return `ua:${userAgent.slice(0, 50)}-${origin}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const clientIdentifier = getClientIdentifier(req);
    const { action, credentialId, newCounter } = await req.json();

    // Apply rate limiting to authentication attempts
    if (action === "verify-credential") {
      const rateLimit = await checkRateLimit(supabase, clientIdentifier, "passkey-auth");
      
      if (!rateLimit.allowed) {
        console.warn(`Rate limited: ${clientIdentifier} for passkey-auth`);
        return new Response(JSON.stringify({ 
          error: "Too many authentication attempts. Please try again later.",
          blockedUntil: rateLimit.blockedUntil,
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Periodically cleanup old rate limit entries (1% chance per request)
    if (Math.random() < 0.01) {
      // deno-lint-ignore no-explicit-any
      (supabase.rpc("cleanup_old_rate_limits") as any).then(() => {
        console.log("Cleaned up old rate limit entries");
      }).catch((err: Error) => {
        console.error("Failed to cleanup rate limits:", err);
      });
    }

    if (action === "get-challenge") {
      // Generate a random challenge for authentication
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeBase64 = btoa(String.fromCharCode(...challenge));
      
      // For discoverable credentials (resident keys), we don't need to provide
      // allowCredentials - the authenticator will handle credential selection.
      // This prevents credential enumeration attacks.
      return new Response(JSON.stringify({ 
        challenge: challengeBase64,
        allowCredentials: [], // Empty - let authenticator handle discovery
        rpId: new URL(req.headers.get("origin") || supabaseUrl).hostname,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify-credential") {
      // Validate required parameters
      if (!credentialId || typeof credentialId !== 'string') {
        console.error("Missing or invalid credentialId");
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (typeof newCounter !== 'number' || newCounter < 0) {
        console.error("Invalid counter value:", newCounter);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the credential and its associated user
      const { data: credential, error: findError } = await supabase
        .from("passkey_credentials")
        .select("*, user_id")
        .eq("credential_id", credentialId)
        .single();

      if (findError || !credential) {
        // Use generic error message to prevent credential enumeration
        console.error("Credential not found or error:", findError);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SECURITY: Validate counter to prevent replay attacks
      // The new counter must be greater than the stored counter
      // If counter goes backwards, it indicates a cloned authenticator
      if (newCounter <= credential.counter) {
        console.error(`Counter validation failed: newCounter (${newCounter}) <= storedCounter (${credential.counter}). Possible replay attack or cloned authenticator.`);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update counter and last_used_at
      const { error: updateError } = await supabase
        .from("passkey_credentials")
        .update({ 
          counter: newCounter,
          last_used_at: new Date().toISOString()
        })
        .eq("credential_id", credentialId);

      if (updateError) {
        console.error("Failed to update counter:", updateError);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user email for sign-in
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
        credential.user_id
      );

      if (userError || !user) {
        console.error("User not found:", userError);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate a magic link token for passwordless sign-in
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: user.email!,
      });

      if (linkError) {
        console.error("Magic link error:", linkError);
        return new Response(JSON.stringify({ error: "Authentication failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract the token from the action link
      const actionLink = linkData.properties?.action_link;
      const tokenMatch = actionLink?.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      console.log("Passkey authentication successful for user:", user.email);

      return new Response(JSON.stringify({ 
        success: true,
        publicKey: credential.public_key,
        storedCounter: credential.counter,
        email: user.email,
        token: token,
        tokenHash: linkData.properties?.hashed_token,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Authentication failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
