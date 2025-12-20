-- Add new columns to company_decisions table
ALTER TABLE public.company_decisions
ADD COLUMN IF NOT EXISTS ticker text,
ADD COLUMN IF NOT EXISTS direction text DEFAULT 'N/A',
ADD COLUMN IF NOT EXISTS size_change numeric,
ADD COLUMN IF NOT EXISTS size_unit text,
ADD COLUMN IF NOT EXISTS key_assumptions text,
ADD COLUMN IF NOT EXISTS expected_outcome text,
ADD COLUMN IF NOT EXISTS catalyst_timeline text,
ADD COLUMN IF NOT EXISTS risks_breaks_thesis text,
ADD COLUMN IF NOT EXISTS confidence integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add check constraint for confidence (1-5)
ALTER TABLE public.company_decisions
DROP CONSTRAINT IF EXISTS company_decisions_confidence_check;

ALTER TABLE public.company_decisions
ADD CONSTRAINT company_decisions_confidence_check CHECK (confidence >= 1 AND confidence <= 5);

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_company_decisions_decision_type ON public.company_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_company_decisions_tags ON public.company_decisions USING GIN(tags);