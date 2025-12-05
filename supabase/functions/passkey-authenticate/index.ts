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
      
      // Get all stored credential IDs (for discoverable credentials)
      const { data: credentials } = await supabase
        .from("passkey_credentials")
        .select("credential_id");

      const allowCredentials = credentials?.map(c => c.credential_id) || [];

      return new Response(JSON.stringify({ 
        challenge: challengeBase64,
        allowCredentials,
        rpId: new URL(req.headers.get("origin") || supabaseUrl).hostname,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify-credential") {
      // Find the credential and its associated user
      const { data: credential, error: findError } = await supabase
        .from("passkey_credentials")
        .select("*, user_id")
        .eq("credential_id", credentialId)
        .single();

      if (findError || !credential) {
        return new Response(JSON.stringify({ error: "Credential not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update counter and last_used_at
      await supabase
        .from("passkey_credentials")
        .update({ 
          counter: newCounter,
          last_used_at: new Date().toISOString()
        })
        .eq("credential_id", credentialId);

      // Get user email for sign-in
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
        credential.user_id
      );

      if (userError || !user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
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
        return new Response(JSON.stringify({ error: "Failed to create session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract the token from the action link
      const actionLink = linkData.properties?.action_link;
      const tokenMatch = actionLink?.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
