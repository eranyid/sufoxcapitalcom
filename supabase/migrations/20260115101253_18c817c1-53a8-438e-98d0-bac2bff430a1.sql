-- Add bond/debt specific fields to valuations table
ALTER TABLE public.valuations 
ADD COLUMN IF NOT EXISTS yield_to_maturity numeric NULL,
ADD COLUMN IF NOT EXISTS coupon_rate numeric NULL,
ADD COLUMN IF NOT EXISTS duration numeric NULL,
ADD COLUMN IF NOT EXISTS accrued_interest numeric NULL,
ADD COLUMN IF NOT EXISTS maturity_date date NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.valuations.yield_to_maturity IS 'Yield to maturity percentage for bonds/debt instruments';
COMMENT ON COLUMN public.valuations.coupon_rate IS 'Annual coupon rate percentage for bonds';
COMMENT ON COLUMN public.valuations.duration IS 'Modified duration in years for bonds';
COMMENT ON COLUMN public.valuations.accrued_interest IS 'Accrued interest amount for the period';
COMMENT ON COLUMN public.valuations.maturity_date IS 'Bond/debt maturity date';