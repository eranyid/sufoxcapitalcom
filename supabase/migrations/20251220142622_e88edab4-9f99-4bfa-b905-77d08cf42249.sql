-- Enable realtime for task-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_activity_log;