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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, credentialId, publicKey, counter, deviceType, transports } = await req.json();

    if (action === "get-challenge") {
      // Generate a random challenge for registration
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const challengeBase64 = btoa(String.fromCharCode(...challenge));
      
      return new Response(JSON.stringify({ 
        challenge: challengeBase64,
        userId: user.id,
        userEmail: user.email,
        rpId: new URL(supabaseUrl).hostname.includes("supabase") 
          ? new URL(req.headers.get("origin") || "").hostname 
          : new URL(supabaseUrl).hostname,
        rpName: "Hedge Fund Studio"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "store-credential") {
      // Store the credential in the database
      const { error: insertError } = await supabase
        .from("passkey_credentials")
        .insert({
          user_id: user.id,
          credential_id: credentialId,
          public_key: publicKey,
          counter: counter || 0,
          device_type: deviceType,
          transports: transports,
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: "Failed to store credential" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
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
