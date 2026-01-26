-- Add new columns to crm_tasks for time tracking and tags
ALTER TABLE public.crm_tasks 
ADD COLUMN IF NOT EXISTS estimated_hours numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create task_subtasks table for subtask tracking
CREATE TABLE IF NOT EXISTS public.task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on task_subtasks
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_subtasks
CREATE POLICY "Users can view their own subtasks"
ON public.task_subtasks
FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create their own subtasks"
ON public.task_subtasks
FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own subtasks"
ON public.task_subtasks
FOR UPDATE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own subtasks"
ON public.task_subtasks
FOR DELETE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Enable realtime for task_subtasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_subtasks;