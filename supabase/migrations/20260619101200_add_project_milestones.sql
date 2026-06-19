-- Create project_milestones table for smart milestone tracking
CREATE TABLE public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date DATE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    template_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on project_milestones
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_milestones
CREATE POLICY "Approved users can view milestones for their projects"
ON public.project_milestones FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create milestones for their projects"
ON public.project_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own milestones"
ON public.project_milestones FOR UPDATE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own milestones"
ON public.project_milestones FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_project_milestones_updated_at
BEFORE UPDATE ON public.project_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX idx_project_milestones_user_id ON public.project_milestones(user_id);
