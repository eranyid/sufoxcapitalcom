import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function refreshAccessToken(supabase: any, userId: string, refreshToken: string): Promise<string | null> {
  console.log(`[gcal-events] Refreshing token for user ${userId}`);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[gcal-events] Token refresh failed:', data);
    return null;
  }

  const expiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();

  await supabase
    .from('user_google_tokens')
    .update({
      access_token: data.access_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  console.log(`[gcal-events] Token refreshed for user ${userId}`);
  return data.access_token;
}

async function getValidAccessToken(supabase: any, userId: string): Promise<{ token: string | null; error?: string }> {
  const { data: tokenData, error } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    return { token: null, error: 'Not connected to Google Calendar' };
  }

  const isExpired = new Date(tokenData.expires_at) <= new Date();

  if (isExpired) {
    if (!tokenData.refresh_token) {
      return { token: null, error: 'Token expired and no refresh token available. Please reconnect.' };
    }
    const newToken = await refreshAccessToken(supabase, userId, tokenData.refresh_token);
    if (!newToken) {
      return { token: null, error: 'Failed to refresh token. Please reconnect.' };
    }
    return { token: newToken };
  }

  return { token: tokenData.access_token };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { timeMin, timeMax, calendarId = 'primary', includeAllDay = true } = await req.json();
    console.log(`[gcal-events] Fetching events for user ${user.id}, calendar: ${calendarId}, range: ${timeMin} - ${timeMax}`);

    const { token: accessToken, error: tokenError } = await getValidAccessToken(supabase, user.id);

    if (tokenError || !accessToken) {
      return new Response(JSON.stringify({ error: tokenError || 'No access token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '250');

    const eventsResponse = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json();
      console.error('[gcal-events] Google API error:', errorData);
      
      if (eventsResponse.status === 401) {
        return new Response(JSON.stringify({ error: 'Invalid token. Please reconnect.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const eventsData = await eventsResponse.json();
    
    let events = (eventsData.items || []).map((event: any) => ({
      id: event.id,
      summary: event.summary || '(No title)',
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      isAllDay: !!event.start?.date,
      location: event.location,
      status: event.status,
      htmlLink: event.htmlLink,
      updated: event.updated,
      isTask: event.summary?.startsWith('[SUFOX]') || event.summary?.startsWith('[TASK]'),
    }));

    if (!includeAllDay) {
      events = events.filter((e: any) => !e.isAllDay);
    }

    console.log(`[gcal-events] Fetched ${events.length} events for user ${user.id}`);

    return new Response(JSON.stringify({ events, count: events.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[gcal-events] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
