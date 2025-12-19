-- Update existing 'backlog' tasks to 'seed'
UPDATE public.crm_tasks SET status = 'seed' WHERE status = 'backlog';

-- Update the default value for status column
ALTER TABLE public.crm_tasks ALTER COLUMN status SET DEFAULT 'seed';