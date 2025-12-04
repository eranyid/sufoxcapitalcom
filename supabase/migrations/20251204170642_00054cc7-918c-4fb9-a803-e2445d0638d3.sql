-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'equity',
  transaction_type TEXT NOT NULL DEFAULT 'buy',
  date DATE NOT NULL,
  quantity NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  fees NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  geography TEXT NOT NULL DEFAULT 'north_america',
  inception_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create valuations table
CREATE TABLE public.valuations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT,
  ticker TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  month TEXT NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  fx_rate NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table
CREATE TABLE public.portfolio_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  risk_free_rate NUMERIC DEFAULT 4.5,
  benchmark_returns JSONB DEFAULT '[]'::jsonb,
  base_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash balances table
CREATE TABLE public.cash_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  usd NUMERIC DEFAULT 0,
  eur NUMERIC DEFAULT 0,
  ils NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_balances ENABLE ROW LEVEL SECURITY;

-- Transactions RLS policies
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Valuations RLS policies
CREATE POLICY "Users can view their own valuations" ON public.valuations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own valuations" ON public.valuations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own valuations" ON public.valuations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own valuations" ON public.valuations FOR DELETE USING (auth.uid() = user_id);

-- Portfolio settings RLS policies
CREATE POLICY "Users can view their own settings" ON public.portfolio_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.portfolio_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.portfolio_settings FOR UPDATE USING (auth.uid() = user_id);

-- Cash balances RLS policies
CREATE POLICY "Users can view their own cash balances" ON public.cash_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cash balances" ON public.cash_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cash balances" ON public.cash_balances FOR UPDATE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_valuations_updated_at BEFORE UPDATE ON public.valuations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolio_settings_updated_at BEFORE UPDATE ON public.portfolio_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cash_balances_updated_at BEFORE UPDATE ON public.cash_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();