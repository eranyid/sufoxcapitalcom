import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, credentialId, newCounter } = await req.json();

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
