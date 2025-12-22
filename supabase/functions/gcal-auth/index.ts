import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Validate Google credentials on startup
function validateGoogleCredentials(): { valid: boolean; error?: string } {
  if (!GOOGLE_CLIENT_ID) {
    return { valid: false, error: 'GOOGLE_CLIENT_ID is not configured in secrets' };
  }
  if (!GOOGLE_CLIENT_SECRET) {
    return { valid: false, error: 'GOOGLE_CLIENT_SECRET is not configured in secrets' };
  }
  // Check if client ID looks valid (ends with .apps.googleusercontent.com)
  if (!GOOGLE_CLIENT_ID.endsWith('.apps.googleusercontent.com')) {
    return { valid: false, error: 'GOOGLE_CLIENT_ID format appears invalid - should end with .apps.googleusercontent.com' };
  }
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate credentials first
    const credCheck = validateGoogleCredentials();
    if (!credCheck.valid) {
      console.error(`[gcal-auth] Credential validation failed: ${credCheck.error}`);
      return new Response(JSON.stringify({ 
        error: credCheck.error,
        code: 'INVALID_CREDENTIALS'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, code, redirectUri } = await req.json();
    console.log(`[gcal-auth] Action: ${action} for user: ${user.id}`);

    if (action === 'get-auth-url') {
      // Validate redirect URI
      if (!redirectUri) {
        return new Response(JSON.stringify({ 
          error: 'Missing redirectUri parameter',
          code: 'MISSING_REDIRECT_URI'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Log the redirect URI for debugging
      console.log(`[gcal-auth] Generating auth URL with redirect URI: ${redirectUri}`);

      // Use minimal scopes - calendar.events gives read/write access
      const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ].join(' ');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID!)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(scopes)}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&include_granted_scopes=true`;

      console.log(`[gcal-auth] Generated auth URL for user ${user.id}`);
      console.log(`[gcal-auth] Full auth URL (first 200 chars): ${authUrl.substring(0, 200)}...`);
      
      return new Response(JSON.stringify({ 
        authUrl,
        redirectUri,
        clientId: GOOGLE_CLIENT_ID!.substring(0, 20) + '...' // Partial for debugging
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'exchange-code') {
      if (!code) {
        return new Response(JSON.stringify({ 
          error: 'Missing authorization code',
          code: 'MISSING_CODE'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[gcal-auth] Exchanging code for tokens, redirectUri: ${redirectUri}`);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID!,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log(`[gcal-auth] Token response status: ${tokenResponse.status}`);

      if (!tokenResponse.ok) {
        console.error(`[gcal-auth] Token exchange failed:`, JSON.stringify(tokenData));
        
        // Provide user-friendly error messages
        let userMessage = 'Failed to connect to Google Calendar';
        let errorCode = tokenData.error || 'UNKNOWN_ERROR';
        
        switch (tokenData.error) {
          case 'invalid_grant':
            userMessage = 'Authorization expired or already used. Please try connecting again.';
            break;
          case 'invalid_client':
            userMessage = 'OAuth configuration error. Please contact support.';
            break;
          case 'redirect_uri_mismatch':
            userMessage = 'Redirect URI mismatch. The OAuth app may need reconfiguration.';
            console.error(`[gcal-auth] REDIRECT URI MISMATCH! Sent: ${redirectUri}`);
            break;
          case 'access_denied':
            userMessage = 'Access was denied. Please grant calendar permissions when prompted.';
            break;
          case 'unauthorized_client':
            userMessage = 'This app is not authorized. The OAuth app may be in testing mode.';
            break;
        }
        
        return new Response(JSON.stringify({ 
          error: userMessage,
          code: errorCode,
          details: tokenData.error_description || null
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate we got the tokens we need
      if (!tokenData.access_token) {
        console.error(`[gcal-auth] No access_token in response:`, tokenData);
        return new Response(JSON.stringify({ 
          error: 'Invalid token response from Google',
          code: 'INVALID_TOKEN_RESPONSE'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

      // Test the token by fetching calendar list
      console.log(`[gcal-auth] Testing token by fetching calendar list...`);
      const testResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      if (!testResponse.ok) {
        const testError = await testResponse.json();
        console.error(`[gcal-auth] Token test failed:`, testError);
        return new Response(JSON.stringify({ 
          error: 'Token received but calendar access failed. Check OAuth scopes.',
          code: 'CALENDAR_ACCESS_FAILED',
          details: testError.error?.message || null
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[gcal-auth] Token test successful`);

      // Upsert tokens in database
      const { error: upsertError } = await supabase
        .from('user_google_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt,
          scope: tokenData.scope,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (upsertError) {
        console.error(`[gcal-auth] Failed to save tokens:`, upsertError);
        return new Response(JSON.stringify({ 
          error: 'Failed to save connection. Please try again.',
          code: 'DATABASE_ERROR'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`[gcal-auth] Tokens saved successfully for user ${user.id}`);
      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'check-connection') {
      const { data: tokenData } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!tokenData) {
        return new Response(JSON.stringify({ connected: false }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const needsRefresh = new Date(tokenData.expires_at) <= new Date();
      const hasRefreshToken = !!tokenData.refresh_token;

      return new Response(JSON.stringify({ 
        connected: true,
        needsRefresh,
        hasRefreshToken,
        expiresAt: tokenData.expires_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'disconnect') {
      // Delete tokens
      await supabase
        .from('user_google_tokens')
        .delete()
        .eq('user_id', user.id);

      // Mark all calendar links as error
      await supabase
        .from('task_calendar_links')
        .update({ status: 'error', last_error: 'Disconnected from Google Calendar' })
        .eq('user_id', user.id);

      console.log(`[gcal-auth] Disconnected Google Calendar for user ${user.id}`);
      return new Response(JSON.stringify({ disconnected: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[gcal-auth] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});