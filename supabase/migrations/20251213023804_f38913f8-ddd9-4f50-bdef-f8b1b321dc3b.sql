-- Create tasks table for CRM module
CREATE TABLE public.crm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  owner TEXT DEFAULT 'Me',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'backlog',
  urgency TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies (approved users only)
CREATE POLICY "Approved users can view their own tasks"
ON public.crm_tasks FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own tasks"
ON public.crm_tasks FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own tasks"
ON public.crm_tasks FOR UPDATE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own tasks"
ON public.crm_tasks FOR DELETE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_crm_tasks_updated_at
BEFORE UPDATE ON public.crm_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();