-- Internal calendar events table
CREATE TABLE public.internal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar integrations table (for ICS URLs)
CREATE TABLE public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'google_ics',
  ics_url TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- External events from calendar integrations
CREATE TABLE public.external_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google_ics',
  external_uid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, external_uid)
);

-- Enable RLS
ALTER TABLE public.internal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internal_events
CREATE POLICY "Users can view their own internal events"
  ON public.internal_events FOR SELECT
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own internal events"
  ON public.internal_events FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own internal events"
  ON public.internal_events FOR UPDATE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own internal events"
  ON public.internal_events FOR DELETE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- RLS Policies for calendar_integrations
CREATE POLICY "Users can view their own calendar integrations"
  ON public.calendar_integrations FOR SELECT
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own calendar integrations"
  ON public.calendar_integrations FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own calendar integrations"
  ON public.calendar_integrations FOR UPDATE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own calendar integrations"
  ON public.calendar_integrations FOR DELETE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- RLS Policies for external_events
CREATE POLICY "Users can view their own external events"
  ON public.external_events FOR SELECT
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own external events"
  ON public.external_events FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own external events"
  ON public.external_events FOR UPDATE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own external events"
  ON public.external_events FOR DELETE
  USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_internal_events_updated_at
  BEFORE UPDATE ON public.internal_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_external_events_updated_at
  BEFORE UPDATE ON public.external_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();