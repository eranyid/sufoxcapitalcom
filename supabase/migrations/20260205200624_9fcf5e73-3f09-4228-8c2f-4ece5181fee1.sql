
-- Manual target allocation entries on the Investment Policy page
CREATE TABLE public.policy_target_holdings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT,
  target_weight NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_target_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own policy holdings"
  ON public.policy_target_holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own policy holdings"
  ON public.policy_target_holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own policy holdings"
  ON public.policy_target_holdings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own policy holdings"
  ON public.policy_target_holdings FOR DELETE
  USING (auth.uid() = user_id);
