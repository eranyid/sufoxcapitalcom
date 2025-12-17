-- Create CRM Projects table
CREATE TABLE public.crm_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_projects
CREATE POLICY "Approved users can view their own projects"
ON public.crm_projects FOR SELECT
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own projects"
ON public.crm_projects FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own projects"
ON public.crm_projects FOR UPDATE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own projects"
ON public.crm_projects FOR DELETE
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()));

-- Add project_id to crm_companies
ALTER TABLE public.crm_companies 
ADD COLUMN project_id UUID REFERENCES public.crm_projects(id) ON DELETE CASCADE;

-- Add project_id to crm_funds
ALTER TABLE public.crm_funds 
ADD COLUMN project_id UUID REFERENCES public.crm_projects(id) ON DELETE CASCADE;

-- Add project_id to crm_tasks
ALTER TABLE public.crm_tasks 
ADD COLUMN project_id UUID REFERENCES public.crm_projects(id) ON DELETE CASCADE;

-- Add group_name column for grouping (Ongoing Holding / Potential / Old Exits)
ALTER TABLE public.crm_companies 
ADD COLUMN group_name TEXT NOT NULL DEFAULT 'potential';

ALTER TABLE public.crm_funds 
ADD COLUMN group_name TEXT NOT NULL DEFAULT 'potential';

-- Add timeline columns
ALTER TABLE public.crm_companies 
ADD COLUMN timeline_start DATE,
ADD COLUMN timeline_end DATE;

ALTER TABLE public.crm_funds 
ADD COLUMN timeline_start DATE,
ADD COLUMN timeline_end DATE;

-- Create trigger for updated_at on crm_projects
CREATE TRIGGER update_crm_projects_updated_at
BEFORE UPDATE ON public.crm_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_crm_companies_project_id ON public.crm_companies(project_id);
CREATE INDEX idx_crm_funds_project_id ON public.crm_funds(project_id);
CREATE INDEX idx_crm_tasks_project_id ON public.crm_tasks(project_id);
CREATE INDEX idx_crm_projects_user_id ON public.crm_projects(user_id);