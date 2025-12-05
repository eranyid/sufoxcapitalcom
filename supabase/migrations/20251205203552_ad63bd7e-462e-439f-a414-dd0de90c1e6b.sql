-- Add RSS feed URL column to portfolio_settings
ALTER TABLE public.portfolio_settings 
ADD COLUMN IF NOT EXISTS rss_feed_url TEXT DEFAULT NULL;