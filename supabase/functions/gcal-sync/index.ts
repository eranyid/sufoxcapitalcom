import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return await response.json();
}

async function getValidAccessToken(
  userId: string,
  serviceClient: any,
  clientId: string,
  clientSecret: string
) {
  const { data: tokenData, error: tokenError } = await serviceClient
    .from("user_google_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (tokenError || !tokenData) {
    throw new Error("Google Calendar not connected");
  }

  let accessToken = tokenData.access_token;

  // Refresh if expired
  if (new Date(tokenData.expires_at) < new Date()) {
    if (!tokenData.refresh_token) {
      throw new Error("Token expired and no refresh token");
    }

    const newTokens = await refreshAccessToken(tokenData.refresh_token, clientId, clientSecret);
    accessToken = newTokens.access_token;

    await serviceClient
      .from("user_google_tokens")
      .update({
        access_token: newTokens.access_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }

  return accessToken;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;
    const { action, event, eventId } = await req.json();

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Google OAuth not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const accessToken = await getValidAccessToken(userId, serviceClient, clientId, clientSecret);

    // Create event
    if (action === "create") {
      if (!event?.title || !event?.startDateTime) {
        return new Response(
          JSON.stringify({ error: "Missing required event fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const googleEvent: any = {
        summary: event.title,
        description: event.notes || "",
        location: event.location || "",
      };

      if (event.allDay) {
        googleEvent.start = { date: event.startDateTime.split("T")[0] };
        googleEvent.end = { date: event.endDateTime?.split("T")[0] || event.startDateTime.split("T")[0] };
      } else {
        googleEvent.start = { dateTime: event.startDateTime, timeZone: event.timezone || "Asia/Jerusalem" };
        googleEvent.end = { dateTime: event.endDateTime, timeZone: event.timezone || "Asia/Jerusalem" };
      }

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to create event:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to create event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const createdEvent = await response.json();
      console.log("Event created:", createdEvent.id);

      return new Response(
        JSON.stringify({ success: true, eventId: createdEvent.id, htmlLink: createdEvent.htmlLink }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update event
    if (action === "update") {
      if (!eventId || !event) {
        return new Response(
          JSON.stringify({ error: "Missing eventId or event data" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const googleEvent: any = {
        summary: event.title,
        description: event.notes || "",
        location: event.location || "",
      };

      if (event.allDay) {
        googleEvent.start = { date: event.startDateTime.split("T")[0] };
        googleEvent.end = { date: event.endDateTime?.split("T")[0] || event.startDateTime.split("T")[0] };
      } else {
        googleEvent.start = { dateTime: event.startDateTime, timeZone: event.timezone || "Asia/Jerusalem" };
        googleEvent.end = { dateTime: event.endDateTime, timeZone: event.timezone || "Asia/Jerusalem" };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to update event:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to update event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Event updated:", eventId);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete event
    if (action === "delete") {
      if (!eventId) {
        return new Response(
          JSON.stringify({ error: "Missing eventId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok && response.status !== 410) {
        const errorText = await response.text();
        console.error("Failed to delete event:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to delete event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Event deleted:", eventId);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in gcal-sync:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
