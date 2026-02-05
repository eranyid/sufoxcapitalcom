-- Update RLS policies for remaining tables with client_id

-- Target Allocations
DROP POLICY IF EXISTS "Users can view their own target allocations" ON public.target_allocations;
CREATE POLICY "Users can view their own target allocations"
ON public.target_allocations FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = target_allocations.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create their own target allocations" ON public.target_allocations;
CREATE POLICY "Users can create their own target allocations"
ON public.target_allocations FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = target_allocations.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own target allocations" ON public.target_allocations;
CREATE POLICY "Users can update their own target allocations"
ON public.target_allocations FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = target_allocations.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their own target allocations" ON public.target_allocations;
CREATE POLICY "Users can delete their own target allocations"
ON public.target_allocations FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = target_allocations.client_id AND c.user_id = auth.uid())
  )
);

-- Custom Scenarios
DROP POLICY IF EXISTS "Approved users can view their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can view their own scenarios"
ON public.custom_scenarios FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = custom_scenarios.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can create their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can create their own scenarios"
ON public.custom_scenarios FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = custom_scenarios.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can update their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can update their own scenarios"
ON public.custom_scenarios FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = custom_scenarios.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can delete their own scenarios" ON public.custom_scenarios;
CREATE POLICY "Approved users can delete their own scenarios"
ON public.custom_scenarios FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = custom_scenarios.client_id AND c.user_id = auth.uid())
  )
);

-- Research Watchlist
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.research_watchlist;
CREATE POLICY "Users can view their own watchlist"
ON public.research_watchlist FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = research_watchlist.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create watchlist items" ON public.research_watchlist;
CREATE POLICY "Users can create watchlist items"
ON public.research_watchlist FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = research_watchlist.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own watchlist items" ON public.research_watchlist;
CREATE POLICY "Users can update their own watchlist items"
ON public.research_watchlist FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = research_watchlist.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON public.research_watchlist;
CREATE POLICY "Users can delete their own watchlist items"
ON public.research_watchlist FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = research_watchlist.client_id AND c.user_id = auth.uid())
  )
);

-- FX Rates
DROP POLICY IF EXISTS "Users can view their own fx rates" ON public.fx_rates;
CREATE POLICY "Users can view their own fx rates"
ON public.fx_rates FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = fx_rates.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create their own fx rates" ON public.fx_rates;
CREATE POLICY "Users can create their own fx rates"
ON public.fx_rates FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = fx_rates.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own fx rates" ON public.fx_rates;
CREATE POLICY "Users can update their own fx rates"
ON public.fx_rates FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = fx_rates.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their own fx rates" ON public.fx_rates;
CREATE POLICY "Users can delete their own fx rates"
ON public.fx_rates FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = fx_rates.client_id AND c.user_id = auth.uid())
  )
);

-- Portfolio Settings
DROP POLICY IF EXISTS "Approved users can view their own settings" ON public.portfolio_settings;
CREATE POLICY "Approved users can view their own settings"
ON public.portfolio_settings FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = portfolio_settings.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can create their own settings" ON public.portfolio_settings;
CREATE POLICY "Approved users can create their own settings"
ON public.portfolio_settings FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = portfolio_settings.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can update their own settings" ON public.portfolio_settings;
CREATE POLICY "Approved users can update their own settings"
ON public.portfolio_settings FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = portfolio_settings.client_id AND c.user_id = auth.uid())
  )
);

-- Cash Balances
DROP POLICY IF EXISTS "Users can view their own cash balances" ON public.cash_balances;
CREATE POLICY "Users can view their own cash balances"
ON public.cash_balances FOR SELECT
USING (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = cash_balances.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create their own cash balances" ON public.cash_balances;
CREATE POLICY "Users can create their own cash balances"
ON public.cash_balances FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = cash_balances.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own cash balances" ON public.cash_balances;
CREATE POLICY "Users can update their own cash balances"
ON public.cash_balances FOR UPDATE
USING (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = cash_balances.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their own cash balances" ON public.cash_balances;
CREATE POLICY "Users can delete their own cash balances"
ON public.cash_balances FOR DELETE
USING (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = cash_balances.client_id AND c.user_id = auth.uid())
  )
);

-- Capital Ledger
DROP POLICY IF EXISTS "Users can view their own ledger entries" ON public.capital_ledger;
CREATE POLICY "Users can view their own ledger entries"
ON public.capital_ledger FOR SELECT
USING (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = capital_ledger.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create their own ledger entries" ON public.capital_ledger;
CREATE POLICY "Users can create their own ledger entries"
ON public.capital_ledger FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = capital_ledger.client_id AND c.user_id = auth.uid())
  )
);

-- CRM Companies
DROP POLICY IF EXISTS "Approved users can view their companies" ON public.crm_companies;
CREATE POLICY "Approved users can view their companies"
ON public.crm_companies FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = crm_companies.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can create companies" ON public.crm_companies;
CREATE POLICY "Approved users can create companies"
ON public.crm_companies FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = crm_companies.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can update their companies" ON public.crm_companies;
CREATE POLICY "Approved users can update their companies"
ON public.crm_companies FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = crm_companies.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can delete their companies" ON public.crm_companies;
CREATE POLICY "Approved users can delete their companies"
ON public.crm_companies FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = crm_companies.client_id AND c.user_id = auth.uid())
  )
);

-- Investment Policies
DROP POLICY IF EXISTS "Users can view their own investment policies" ON public.investment_policies;
CREATE POLICY "Users can view their own investment policies"
ON public.investment_policies FOR SELECT
USING (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = investment_policies.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create their own investment policies" ON public.investment_policies;
CREATE POLICY "Users can create their own investment policies"
ON public.investment_policies FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = investment_policies.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own investment policies" ON public.investment_policies;
CREATE POLICY "Users can update their own investment policies"
ON public.investment_policies FOR UPDATE
USING (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = investment_policies.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their own investment policies" ON public.investment_policies;
CREATE POLICY "Users can delete their own investment policies"
ON public.investment_policies FOR DELETE
USING (
  auth.uid() = user_id 
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = investment_policies.client_id AND c.user_id = auth.uid())
  )
);