import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: Date;
  source?: string;
  formattedTime: string;
}

interface UseRssFeedOptions {
  refreshInterval?: number; // in milliseconds
  maxAgeHours?: number;
  minItems?: number;
}

export function useRssFeed(rssUrl: string | null, options: UseRssFeedOptions = {}) {
  const { 
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    maxAgeHours = 3,
    minItems = 10
  } = options;

  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateTitle = (title: string, maxLength: number = 120): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  const fetchRss = useCallback(async () => {
    // Only fetch if we have a URL and user is authenticated
    if (!rssUrl || !isAuthenticated) {
      if (!isAuthenticated) {
        // Don't set error for unauthenticated users, just return empty
        setItems([]);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-rss', {
        body: { rssUrl }
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const now = new Date();
      const cutoffTime = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000);

      // Parse and filter items
      const parsedItems: NewsItem[] = data.items
        .map((item: { title: string; link: string; pubDate: string; source?: string }) => {
          const pubDate = new Date(item.pubDate);
          return {
            title: truncateTitle(item.title),
            link: item.link,
            pubDate,
            source: item.source,
            formattedTime: formatTime(pubDate)
          };
        })
        .filter((item: NewsItem) => !isNaN(item.pubDate.getTime()))
        .sort((a: NewsItem, b: NewsItem) => b.pubDate.getTime() - a.pubDate.getTime());

      // Get items from last 3 hours
      let filteredItems = parsedItems.filter((item: NewsItem) => item.pubDate >= cutoffTime);

      // If not enough items, fill with most recent
      if (filteredItems.length < minItems) {
        filteredItems = parsedItems.slice(0, Math.max(minItems, filteredItems.length));
      }

      setItems(filteredItems);
      console.log(`RSS feed updated: ${filteredItems.length} items`);
    } catch (err) {
      console.error('RSS fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
      // Keep existing items on error to avoid empty ticker
    } finally {
      setLoading(false);
    }
  }, [rssUrl, maxAgeHours, minItems, isAuthenticated]);

  // Fetch when authenticated or URL changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchRss();
    }
  }, [fetchRss, isAuthenticated]);

  // Auto-refresh
  useEffect(() => {
    if (!rssUrl || !isAuthenticated) return;

    const intervalId = setInterval(fetchRss, refreshInterval);
    return () => clearInterval(intervalId);
  }, [rssUrl, refreshInterval, fetchRss, isAuthenticated]);

  return { items, loading, error, refetch: fetchRss };
}
