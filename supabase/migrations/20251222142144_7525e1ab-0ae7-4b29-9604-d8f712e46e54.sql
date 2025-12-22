-- Create table for storing Google OAuth tokens
CREATE TABLE public.user_google_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table for linking tasks to calendar events
CREATE TABLE public.task_calendar_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  calendar_id text NOT NULL DEFAULT 'primary',
  event_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('linked', 'cancelled', 'error')) DEFAULT 'linked',
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, task_id)
);

-- Enable RLS
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_calendar_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_google_tokens
CREATE POLICY "Users can view their own tokens"
  ON public.user_google_tokens
  FOR SELECT
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can insert their own tokens"
  ON public.user_google_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own tokens"
  ON public.user_google_tokens
  FOR UPDATE
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own tokens"
  ON public.user_google_tokens
  FOR DELETE
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- RLS policies for task_calendar_links
CREATE POLICY "Users can view their own links"
  ON public.task_calendar_links
  FOR SELECT
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can insert their own links"
  ON public.task_calendar_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own links"
  ON public.task_calendar_links
  FOR UPDATE
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own links"
  ON public.task_calendar_links
  FOR DELETE
  USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_user_google_tokens_user_id ON public.user_google_tokens(user_id);
CREATE INDEX idx_task_calendar_links_user_id ON public.task_calendar_links(user_id);
CREATE INDEX idx_task_calendar_links_task_id ON public.task_calendar_links(task_id);
CREATE INDEX idx_task_calendar_links_event_id ON public.task_calendar_links(event_id);

-- Update trigger for updated_at
CREATE TRIGGER update_user_google_tokens_updated_at
  BEFORE UPDATE ON public.user_google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_calendar_links_updated_at
  BEFORE UPDATE ON public.task_calendar_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();