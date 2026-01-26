import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ICSEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: Date;
  dtend: Date;
  isAllDay: boolean;
}

function parseICSDate(dateStr: string): { date: Date; isAllDay: boolean } {
  // Handle all-day events (YYYYMMDD format)
  if (dateStr.length === 8) {
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return { date: new Date(Date.UTC(year, month, day)), isAllDay: true };
  }
  
  // Handle datetime format (YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
  const cleanStr = dateStr.replace(/[^0-9TZ]/g, '');
  const hasZ = cleanStr.endsWith('Z');
  const numStr = cleanStr.replace('Z', '').replace('T', '');
  
  const year = parseInt(numStr.substring(0, 4));
  const month = parseInt(numStr.substring(4, 6)) - 1;
  const day = parseInt(numStr.substring(6, 8));
  const hour = parseInt(numStr.substring(8, 10)) || 0;
  const minute = parseInt(numStr.substring(10, 12)) || 0;
  const second = parseInt(numStr.substring(12, 14)) || 0;
  
  if (hasZ) {
    return { date: new Date(Date.UTC(year, month, day, hour, minute, second)), isAllDay: false };
  }
  return { date: new Date(year, month, day, hour, minute, second), isAllDay: false };
}

function parseICS(icsContent: string): ICSEvent[] {
  const events: ICSEvent[] = [];
  const lines = icsContent.split(/\r?\n/);
  
  let currentEvent: Partial<ICSEvent> | null = null;
  let currentKey = '';
  let currentValue = '';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line folding (lines starting with space/tab are continuations)
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1);
    }
    
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = { isAllDay: false };
    } else if (line.startsWith('END:VEVENT') && currentEvent) {
      if (currentEvent.uid && currentEvent.summary && currentEvent.dtstart && currentEvent.dtend) {
        events.push(currentEvent as ICSEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const keyPart = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        const key = keyPart.split(';')[0];
        
        switch (key) {
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'SUMMARY':
            currentEvent.summary = value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
            break;
          case 'DESCRIPTION':
            currentEvent.description = value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
            break;
          case 'LOCATION':
            currentEvent.location = value.replace(/\\,/g, ',').replace(/\\n/g, '\n').replace(/\\;/g, ';');
            break;
          case 'DTSTART':
            const startResult = parseICSDate(value);
            currentEvent.dtstart = startResult.date;
            currentEvent.isAllDay = startResult.isAllDay;
            break;
          case 'DTEND':
            const endResult = parseICSDate(value);
            currentEvent.dtend = endResult.date;
            break;
        }
      }
    }
  }
  
  return events;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = userData.user.id;

    // Get the user's calendar integration
    const { data: integration, error: integrationError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (integrationError) {
      console.error('Integration fetch error:', integrationError);
      return new Response(JSON.stringify({ error: 'Failed to fetch integration' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!integration || !integration.ics_url) {
      return new Response(JSON.stringify({ error: 'No calendar URL configured' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('Fetching ICS from:', integration.ics_url);

    // Fetch the ICS file
    const icsResponse = await fetch(integration.ics_url, {
      headers: { 'Accept': 'text/calendar' }
    });

    if (!icsResponse.ok) {
      // Update integration with error status
      await supabase
        .from('calendar_integrations')
        .update({ 
          sync_status: 'error', 
          sync_error: `Failed to fetch: ${icsResponse.status} ${icsResponse.statusText}` 
        })
        .eq('user_id', userId);

      return new Response(JSON.stringify({ error: 'Failed to fetch calendar' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const icsContent = await icsResponse.text();
    console.log('ICS content length:', icsContent.length);

    // Parse the ICS content
    const events = parseICS(icsContent);
    console.log('Parsed events:', events.length);

    // Filter to only future and recent past events (last 30 days, next 365 days)
    const now = new Date();
    const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const futureCutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    const relevantEvents = events.filter(e => 
      e.dtend >= pastCutoff && e.dtstart <= futureCutoff
    );
    console.log('Relevant events:', relevantEvents.length);

    // Delete old external events for this user
    await supabase
      .from('external_events')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'google_ics');

    // Insert new events
    if (relevantEvents.length > 0) {
      const eventsToInsert = relevantEvents.map(e => ({
        user_id: userId,
        provider: 'google_ics',
        external_uid: e.uid,
        title: e.summary || 'Untitled Event',
        description: e.description || null,
        location: e.location || null,
        start_at: e.dtstart.toISOString(),
        end_at: e.dtend.toISOString(),
        is_all_day: e.isAllDay,
        raw_payload: null
      }));

      const { error: insertError } = await supabase
        .from('external_events')
        .insert(eventsToInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
        await supabase
          .from('calendar_integrations')
          .update({ sync_status: 'error', sync_error: insertError.message })
          .eq('user_id', userId);

        return new Response(JSON.stringify({ error: 'Failed to save events' }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Update integration status
    await supabase
      .from('calendar_integrations')
      .update({ 
        sync_status: 'success', 
        sync_error: null,
        last_synced_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    return new Response(JSON.stringify({ 
      success: true, 
      eventsCount: relevantEvents.length 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
