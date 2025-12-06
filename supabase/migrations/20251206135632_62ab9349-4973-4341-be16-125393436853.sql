-- Create ticker_symbols table for configurable market ticker
CREATE TABLE public.ticker_symbols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  tv_symbol TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ticker_symbols ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Approved users can view their own ticker symbols"
ON public.ticker_symbols FOR SELECT
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can create their own ticker symbols"
ON public.ticker_symbols FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can update their own ticker symbols"
ON public.ticker_symbols FOR UPDATE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

CREATE POLICY "Approved users can delete their own ticker symbols"
ON public.ticker_symbols FOR DELETE
USING (auth.uid() = user_id AND is_user_approved(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ticker_symbols_updated_at
BEFORE UPDATE ON public.ticker_symbols
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();