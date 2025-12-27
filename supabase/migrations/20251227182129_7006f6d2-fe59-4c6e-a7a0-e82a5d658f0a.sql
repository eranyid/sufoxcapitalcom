-- Create health_status enum type
CREATE TYPE public.project_health AS ENUM ('on_track', 'at_risk', 'off_track');

-- Create priority enum type for projects
CREATE TYPE public.project_priority AS ENUM ('low', 'medium', 'high');

-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    priority project_priority NOT NULL DEFAULT 'medium',
    lead_user_id UUID,
    start_date DATE,
    target_date DATE,
    health_status project_health NOT NULL DEFAULT 'on_track',
    team TEXT[] DEFAULT '{}',
    labels TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create project_updates table
CREATE TABLE public.project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    author_user_id UUID NOT NULL,
    text TEXT NOT NULL,
    status project_health NOT NULL DEFAULT 'on_track',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add project_id to crm_tasks for issue linking
ALTER TABLE public.crm_tasks 
ADD COLUMN linked_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Approved users can view their own projects"
ON public.projects FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own projects"
ON public.projects FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own projects"
ON public.projects FOR UPDATE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own projects"
ON public.projects FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Enable RLS on project_updates
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_updates
CREATE POLICY "Approved users can view updates for their projects"
ON public.project_updates FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create updates for their projects"
ON public.project_updates FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own updates"
ON public.project_updates FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create updated_at trigger for projects
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX idx_crm_tasks_linked_project_id ON public.crm_tasks(linked_project_id);