
-- Create advisory lock functions for quant ingestion
CREATE OR REPLACE FUNCTION public.pg_try_advisory_lock_quant_ingestion()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pg_try_advisory_lock(hashtext('quant-minute-ingestion'));
$$;

CREATE OR REPLACE FUNCTION public.pg_advisory_unlock_quant_ingestion()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT pg_advisory_unlock(hashtext('quant-minute-ingestion'));
$$;
