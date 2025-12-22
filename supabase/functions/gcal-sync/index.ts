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
  if (!response.ok) return null;

  const expiresAt = new Date(Date.now() + (data.expires_in * 1000)).toISOString();
  await supabase
    .from('user_google_tokens')
    .update({ access_token: data.access_token, expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

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
      return { token: null, error: 'Token expired. Please reconnect.' };
    }
    const newToken = await refreshAccessToken(supabase, userId, tokenData.refresh_token);
    if (!newToken) return { token: null, error: 'Failed to refresh token.' };
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

    const { taskId, action, calendarId = 'primary', eventTime = '10:00' } = await req.json();
    console.log(`[gcal-sync] Action: ${action} for task ${taskId} by user ${user.id}`);

    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('crm_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: 'Task not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { token: accessToken, error: tokenError } = await getValidAccessToken(supabase, user.id);
    if (tokenError || !accessToken) {
      return new Response(JSON.stringify({ error: tokenError || 'No access token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check existing link
    const { data: existingLink } = await supabase
      .from('task_calendar_links')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .single();

    const baseUrl = SUPABASE_URL.replace('.supabase.co', '.lovable.app');
    const taskDeepLink = `${baseUrl}/backoffice/tasks?task=${taskId}`;

    if (action === 'create') {
      if (!task.due_date) {
        return new Response(JSON.stringify({ error: 'Task has no due date' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // If link exists, do update instead
      if (existingLink && existingLink.status === 'linked') {
        console.log('[gcal-sync] Link exists, updating instead');
        // Fall through to update logic
      } else {
        // Create new event
        const startDateTime = `${task.due_date}T${eventTime}:00`;
        const endDate = new Date(startDateTime);
        endDate.setMinutes(endDate.getMinutes() + 30);

        const eventBody = {
          summary: `[SUFOX] ${task.task_name} — ${task.status}`,
          description: `Priority: ${task.urgency}\nTask ID: ${taskId}\n\n${task.description || ''}\n\nOpen in SUFOX: ${taskDeepLink}`,
          start: { dateTime: startDateTime, timeZone: 'Asia/Jerusalem' },
          end: { dateTime: endDate.toISOString().replace('Z', ''), timeZone: 'Asia/Jerusalem' },
        };

        const createResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventBody),
          }
        );

        const createdEvent = await createResponse.json();

        if (!createResponse.ok) {
          console.error('[gcal-sync] Failed to create event:', createdEvent);
          await supabase.from('task_calendar_links').upsert({
            user_id: user.id,
            task_id: taskId,
            calendar_id: calendarId,
            event_id: '',
            status: 'error',
            last_error: JSON.stringify(createdEvent),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,task_id' });

          return new Response(JSON.stringify({ error: 'Failed to create event' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await supabase.from('task_calendar_links').upsert({
          user_id: user.id,
          task_id: taskId,
          calendar_id: calendarId,
          event_id: createdEvent.id,
          status: 'linked',
          last_synced_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,task_id' });

        console.log(`[gcal-sync] Created event ${createdEvent.id} for task ${taskId}`);
        return new Response(JSON.stringify({ success: true, eventId: createdEvent.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (action === 'update' || (action === 'create' && existingLink?.status === 'linked')) {
      if (!existingLink || existingLink.status !== 'linked') {
        return new Response(JSON.stringify({ error: 'Task not linked to calendar' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!task.due_date) {
        return new Response(JSON.stringify({ error: 'Task has no due date' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const startDateTime = `${task.due_date}T${eventTime}:00`;
      const endDate = new Date(startDateTime);
      endDate.setMinutes(endDate.getMinutes() + 30);

      const eventBody = {
        summary: `[SUFOX] ${task.task_name} — ${task.status}`,
        description: `Priority: ${task.urgency}\nTask ID: ${taskId}\n\n${task.description || ''}\n\nOpen in SUFOX: ${taskDeepLink}`,
        start: { dateTime: startDateTime, timeZone: 'Asia/Jerusalem' },
        end: { dateTime: endDate.toISOString().replace('Z', ''), timeZone: 'Asia/Jerusalem' },
      };

      const updateResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(existingLink.calendar_id)}/events/${existingLink.event_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventBody),
        }
      );

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('[gcal-sync] Failed to update event:', errorData);
        await supabase.from('task_calendar_links')
          .update({ status: 'error', last_error: JSON.stringify(errorData), updated_at: new Date().toISOString() })
          .eq('id', existingLink.id);

        return new Response(JSON.stringify({ error: 'Failed to update event' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await supabase.from('task_calendar_links')
        .update({ last_synced_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
        .eq('id', existingLink.id);

      console.log(`[gcal-sync] Updated event ${existingLink.event_id} for task ${taskId}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'cancel') {
      if (!existingLink) {
        return new Response(JSON.stringify({ error: 'Task not linked to calendar' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Delete the event from Google Calendar
      const deleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(existingLink.calendar_id)}/events/${existingLink.event_id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      // 204 = success, 404 = already deleted (both OK)
      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        const errorData = await deleteResponse.text();
        console.error('[gcal-sync] Failed to delete event:', errorData);
      }

      await supabase.from('task_calendar_links')
        .update({ status: 'cancelled', last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existingLink.id);

      console.log(`[gcal-sync] Cancelled event for task ${taskId}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[gcal-sync] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
