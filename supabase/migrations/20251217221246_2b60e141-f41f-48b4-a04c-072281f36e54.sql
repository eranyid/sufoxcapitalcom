-- Create news_sources table for multi-source RSS feeds
CREATE TABLE public.news_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT,
  url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  last_test_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own news sources" 
ON public.news_sources 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own news sources" 
ON public.news_sources 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own news sources" 
ON public.news_sources 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own news sources" 
ON public.news_sources 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_sources_updated_at
BEFORE UPDATE ON public.news_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();