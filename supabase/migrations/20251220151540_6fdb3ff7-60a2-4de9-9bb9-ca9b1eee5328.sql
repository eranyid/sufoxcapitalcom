-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_user_id uuid NULL,
  task_id uuid NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can insert notifications for themselves"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add notification preferences to portfolio_settings
ALTER TABLE public.portfolio_settings 
ADD COLUMN IF NOT EXISTS notify_on_assignment boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_status_change boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_urgency_change boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_new_update boolean DEFAULT true;