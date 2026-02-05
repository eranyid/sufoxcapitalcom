-- Add client_id to all core data tables for full client separation
-- This enables "account within account" functionality

-- 1. Holdings Snapshot
ALTER TABLE public.holdings_snapshot 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 2. Transactions
ALTER TABLE public.transactions 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 3. Valuations
ALTER TABLE public.valuations 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 4. Reports
ALTER TABLE public.reports 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 5. Target Allocations
ALTER TABLE public.target_allocations 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 6. FX Rates (per client for different base currencies)
ALTER TABLE public.fx_rates 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 7. Research Watchlist
ALTER TABLE public.research_watchlist 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 8. Custom Scenarios
ALTER TABLE public.custom_scenarios 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 9. CRM Companies
ALTER TABLE public.crm_companies 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 10. Investment Policies
ALTER TABLE public.investment_policies 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 11. Portfolio Settings (per client for different base currency, etc.)
ALTER TABLE public.portfolio_settings 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 12. Capital Ledger
ALTER TABLE public.capital_ledger 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- 13. Cash Balances
ALTER TABLE public.cash_balances 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

-- Create indexes for efficient client-scoped queries
CREATE INDEX idx_holdings_snapshot_client ON public.holdings_snapshot(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_transactions_client ON public.transactions(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_valuations_client ON public.valuations(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_reports_client ON public.reports(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_target_allocations_client ON public.target_allocations(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_crm_companies_client ON public.crm_companies(client_id) WHERE client_id IS NOT NULL;

-- Update RLS policies to support client-scoped data
-- Holdings: allow access to own data (personal) OR data for owned clients
DROP POLICY IF EXISTS "Users can view their own holdings" ON public.holdings_snapshot;
CREATE POLICY "Users can view their own holdings"
ON public.holdings_snapshot FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL -- Personal holdings
    OR EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = holdings_snapshot.client_id 
      AND c.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can create their own holdings" ON public.holdings_snapshot;
CREATE POLICY "Users can create their own holdings"
ON public.holdings_snapshot FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = holdings_snapshot.client_id 
      AND c.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can update their own holdings" ON public.holdings_snapshot;
CREATE POLICY "Users can update their own holdings"
ON public.holdings_snapshot FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = holdings_snapshot.client_id 
      AND c.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own holdings" ON public.holdings_snapshot;
CREATE POLICY "Users can delete their own holdings"
ON public.holdings_snapshot FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.clients c 
      WHERE c.id = holdings_snapshot.client_id 
      AND c.user_id = auth.uid()
    )
  )
);

-- Valuations: client-scoped RLS
DROP POLICY IF EXISTS "Approved users can view their own valuations" ON public.valuations;
CREATE POLICY "Approved users can view their own valuations"
ON public.valuations FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = valuations.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can create their own valuations" ON public.valuations;
CREATE POLICY "Approved users can create their own valuations"
ON public.valuations FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = valuations.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can update their own valuations" ON public.valuations;
CREATE POLICY "Approved users can update their own valuations"
ON public.valuations FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = valuations.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Approved users can delete their own valuations" ON public.valuations;
CREATE POLICY "Approved users can delete their own valuations"
ON public.valuations FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = valuations.client_id AND c.user_id = auth.uid())
  )
);

-- Reports: client-scoped RLS
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = reports.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
CREATE POLICY "Users can create their own reports"
ON public.reports FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = reports.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;
CREATE POLICY "Users can update their own reports"
ON public.reports FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = reports.client_id AND c.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their own reports" ON public.reports;
CREATE POLICY "Users can delete their own reports"
ON public.reports FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid())
  AND (
    client_id IS NULL
    OR EXISTS (SELECT 1 FROM public.clients c WHERE c.id = reports.client_id AND c.user_id = auth.uid())
  )
);