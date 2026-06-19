-- Create milestone_templates table for user-defined custom milestone templates.
-- Built-in templates live in code (src/lib/milestoneTemplates.ts); this table holds
-- the user's own reusable templates that can be applied across projects.
CREATE TABLE public.milestone_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'LayoutList',
    -- Array of { title, description, dayOffset } objects, in order.
    milestones JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on milestone_templates
ALTER TABLE public.milestone_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies — mirror project_milestones (owner + approved)
CREATE POLICY "Approved users can view their own milestone templates"
ON public.milestone_templates FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create milestone templates"
ON public.milestone_templates FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own milestone templates"
ON public.milestone_templates FOR UPDATE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own milestone templates"
ON public.milestone_templates FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_milestone_templates_updated_at
BEFORE UPDATE ON public.milestone_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX idx_milestone_templates_user_id ON public.milestone_templates(user_id);
