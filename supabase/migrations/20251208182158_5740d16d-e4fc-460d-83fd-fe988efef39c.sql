-- Create research_watchlist table
CREATE TABLE public.research_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  display_name TEXT,
  asset_class TEXT DEFAULT 'equity',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable Row Level Security
ALTER TABLE public.research_watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own watchlist"
ON public.research_watchlist
FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can create watchlist items"
ON public.research_watchlist
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can update their own watchlist items"
ON public.research_watchlist
FOR UPDATE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Users can delete their own watchlist items"
ON public.research_watchlist
FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_research_watchlist_updated_at
BEFORE UPDATE ON public.research_watchlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();