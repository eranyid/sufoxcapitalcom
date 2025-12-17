import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: Date;
  source: string;
  formattedTime: string;
}

interface NewsSource {
  id: string;
  name: string | null;
  url: string;
  enabled: boolean;
}

interface CachedFeed {
  items: NewsItem[];
  fetchedAt: number;
}

interface UseMultiRssFeedOptions {
  refreshInterval?: number; // in milliseconds
  maxAgeHours?: number;
  cacheMinutes?: number;
}

// In-memory cache for feed results
const feedCache = new Map<string, CachedFeed>();

export function useMultiRssFeed(options: UseMultiRssFeedOptions = {}) {
  const { 
    refreshInterval = 5 * 60 * 1000, // 5 minutes default
    maxAgeHours = 6,
    cacheMinutes = 5
  } = options;

  const { user } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<NewsSource[]>([]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateTitle = (title: string, maxLength: number = 120): string => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  };

  // Load news sources from database
  const loadSources = useCallback(async () => {
    if (!user) {
      setSources([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('news_sources')
        .select('id, name, url, enabled')
        .eq('user_id', user.id)
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setSources((data as NewsSource[]) || []);
    } catch (err) {
      console.error('Failed to load news sources:', err);
      setSources([]);
    }
  }, [user]);

  // Fetch a single RSS feed with caching
  const fetchSingleFeed = async (source: NewsSource): Promise<NewsItem[]> => {
    const cacheKey = source.url;
    const cached = feedCache.get(cacheKey);
    const now = Date.now();

    // Return cached data if still fresh
    if (cached && (now - cached.fetchedAt) < cacheMinutes * 60 * 1000) {
      return cached.items;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: { rssUrl: source.url }
      });

      clearTimeout(timeoutId);

      if (error || data?.error) {
        console.warn(`Feed failed for ${source.name || source.url}:`, error || data?.error);
        return [];
      }

      const sourceName = source.name || extractDomainName(source.url);
      const cutoffTime = new Date(now - maxAgeHours * 60 * 60 * 1000);

      const parsedItems: NewsItem[] = data.items
        .map((item: { title: string; link: string; pubDate: string; source?: string }) => {
          const pubDate = new Date(item.pubDate);
          return {
            title: truncateTitle(item.title),
            link: item.link,
            pubDate,
            source: sourceName,
            formattedTime: formatTime(pubDate)
          };
        })
        .filter((item: NewsItem) => !isNaN(item.pubDate.getTime()) && item.pubDate >= cutoffTime);

      // Cache the results
      feedCache.set(cacheKey, { items: parsedItems, fetchedAt: now });

      return parsedItems;
    } catch (err) {
      console.warn(`Feed error for ${source.name || source.url}:`, err);
      return [];
    }
  };

  // Fetch all feeds in parallel
  const fetchAllFeeds = useCallback(async () => {
    if (sources.length === 0) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all feeds in parallel
      const results = await Promise.allSettled(
        sources.map(source => fetchSingleFeed(source))
      );

      // Collect successful results
      const allItems: NewsItem[] = [];
      let failedCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allItems.push(...result.value);
        } else {
          failedCount++;
        }
      });

      // Sort by date (newest first) and blend sources
      allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

      setItems(allItems);

      if (failedCount === sources.length && sources.length > 0) {
        setError('All feeds failed to load');
      }

      console.log(`Multi-RSS: ${allItems.length} items from ${sources.length - failedCount}/${sources.length} sources`);
    } catch (err) {
      console.error('Multi-RSS fetch error:', err);
      setError('Failed to load news feeds');
    } finally {
      setLoading(false);
    }
  }, [sources, maxAgeHours, cacheMinutes]);

  // Extract domain name for display
  function extractDomainName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      // Remove common prefixes
      return hostname
        .replace(/^(www\.|feeds\.|rss\.)/, '')
        .split('.')[0]
        .charAt(0).toUpperCase() + hostname.replace(/^(www\.|feeds\.|rss\.)/, '').split('.')[0].slice(1);
    } catch {
      return 'News';
    }
  }

  // Load sources on mount/user change
  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Fetch feeds when sources change
  useEffect(() => {
    fetchAllFeeds();
  }, [fetchAllFeeds]);

  // Auto-refresh
  useEffect(() => {
    if (sources.length === 0) return;

    const intervalId = setInterval(() => {
      // Clear cache before refresh
      sources.forEach(s => feedCache.delete(s.url));
      fetchAllFeeds();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [sources, refreshInterval, fetchAllFeeds]);

  return { 
    items, 
    loading, 
    error, 
    refetch: fetchAllFeeds, 
    sourcesCount: sources.length,
    reloadSources: loadSources
  };
}
