-- Create task_updates table for storing updates/comments on tasks
CREATE TABLE public.task_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_files table for storing file attachments
CREATE TABLE public.task_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task_activity_log table for tracking task changes
CREATE TABLE public.task_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_updates
CREATE POLICY "Users can view updates for their tasks"
ON public.task_updates FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

CREATE POLICY "Users can create updates for their tasks"
ON public.task_updates FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

CREATE POLICY "Users can update their own updates"
ON public.task_updates FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

CREATE POLICY "Users can delete their own updates"
ON public.task_updates FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

-- RLS policies for task_files
CREATE POLICY "Users can view files for their tasks"
ON public.task_files FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

CREATE POLICY "Users can upload files to their tasks"
ON public.task_files FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

CREATE POLICY "Users can delete their own files"
ON public.task_files FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

-- RLS policies for task_activity_log
CREATE POLICY "Users can view activity for their tasks"
ON public.task_activity_log FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

CREATE POLICY "Users can create activity logs for their tasks"
ON public.task_activity_log FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
);

-- Create storage bucket for task files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-files', 'task-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task files bucket
CREATE POLICY "Users can view their own task files"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own task files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own task files"
ON storage.objects FOR DELETE
USING (bucket_id = 'task-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for updated_at on task_updates
CREATE TRIGGER update_task_updates_updated_at
BEFORE UPDATE ON public.task_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();