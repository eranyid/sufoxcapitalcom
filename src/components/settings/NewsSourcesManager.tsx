import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, GripVertical, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export interface NewsSource {
  id: string;
  user_id: string;
  name: string | null;
  url: string;
  enabled: boolean;
  order_index: number;
  last_tested_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
}

export function NewsSourcesManager() {
  const { user } = useAuth();
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [testingSource, setTestingSource] = useState<string | null>(null);

  // Load news sources
  useEffect(() => {
    const loadSources = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('news_sources')
          .select('*')
          .eq('user_id', user.id)
          .order('order_index', { ascending: true });

        if (error) throw error;
        setSources((data as NewsSource[]) || []);
      } catch (error: any) {
        toast.error('Failed to load news sources');
      } finally {
        setIsLoading(false);
      }
    };
    loadSources();
  }, [user]);

  const handleAddSource = async () => {
    if (!user) return;
    try {
      const newIndex = sources.length;
      const { data, error } = await supabase
        .from('news_sources')
        .insert({
          user_id: user.id,
          name: '',
          url: '',
          enabled: true,
          order_index: newIndex
        })
        .select()
        .single();

      if (error) throw error;
      setSources([...sources, data as NewsSource]);
    } catch (error: any) {
      toast.error('Failed to add source');
    }
  };

  const handleUpdateSource = async (id: string, updates: Partial<NewsSource>) => {
    if (!user) return;
    setIsSaving(id);
    try {
      const { error } = await supabase
        .from('news_sources')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setSources(sources.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (error: any) {
      toast.error('Failed to update source');
    } finally {
      setIsSaving(null);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('news_sources')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setSources(sources.filter(s => s.id !== id));
      toast.success('Source removed');
    } catch (error: any) {
      toast.error('Failed to remove source');
    }
  };

  const handleTestSource = async (source: NewsSource) => {
    if (!source.url) {
      toast.error('Please enter a URL first');
      return;
    }
    
    setTestingSource(source.id);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-rss', {
        body: { rssUrl: source.url }
      });

      const status = error || data?.error ? 'failed' : 'ok';
      const testResult = {
        last_tested_at: new Date().toISOString(),
        last_test_status: status
      };

      await handleUpdateSource(source.id, testResult);

      if (status === 'ok') {
        toast.success(`Feed OK - ${data?.items?.length || 0} items found`);
      } else {
        toast.error(data?.error || error?.message || 'Feed test failed');
      }
    } catch (error: any) {
      const testResult = {
        last_tested_at: new Date().toISOString(),
        last_test_status: 'failed'
      };
      await handleUpdateSource(source.id, testResult);
      toast.error('Failed to test feed');
    } finally {
      setTestingSource(null);
    }
  };

  const handleMoveSource = async (index: number, direction: 'up' | 'down') => {
    if (!user) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sources.length) return;

    const newSources = [...sources];
    const [moved] = newSources.splice(index, 1);
    newSources.splice(newIndex, 0, moved);

    // Update order_index for all affected items
    const updates = newSources.map((s, i) => ({ ...s, order_index: i }));
    setSources(updates);

    // Persist to database
    try {
      await Promise.all(updates.map(s => 
        supabase
          .from('news_sources')
          .update({ order_index: s.order_index })
          .eq('id', s.id)
          .eq('user_id', user.id)
      ));
    } catch (error) {
      toast.error('Failed to reorder sources');
    }
  };

  const isValidUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const isDuplicate = (url: string, excludeId: string): boolean => {
    return sources.some(s => s.id !== excludeId && s.url === url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No news sources configured.</p>
          <p className="text-xs mt-1">Add RSS feeds to populate the Live News ticker.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((source, index) => (
            <div 
              key={source.id} 
              className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border"
            >
              {/* Reorder controls */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => handleMoveSource(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-muted rounded disabled:opacity-30"
                  title="Move up"
                >
                  <GripVertical className="h-3 w-3" />
                </button>
              </div>

              {/* Main content */}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Name (optional)"
                    value={source.name || ''}
                    onChange={(e) => handleUpdateSource(source.id, { name: e.target.value })}
                    className="w-32 h-8 text-xs"
                  />
                  <Input
                    placeholder="https://feeds.example.com/rss"
                    value={source.url}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      if (isDuplicate(newUrl, source.id)) {
                        toast.error('Duplicate URL');
                        return;
                      }
                      handleUpdateSource(source.id, { url: newUrl });
                    }}
                    className={`flex-1 h-8 text-xs ${!isValidUrl(source.url) && source.url ? 'border-destructive' : ''}`}
                  />
                </div>
                
                {/* Status row */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={(checked) => handleUpdateSource(source.id, { enabled: checked })}
                      className="scale-75"
                    />
                    <Label className="text-xs text-muted-foreground">Enabled</Label>
                  </div>

                  {source.last_tested_at && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      {source.last_test_status === 'ok' ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                      <span className="text-[10px]">
                        {new Date(source.last_tested_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestSource(source)}
                  disabled={testingSource === source.id || !source.url}
                  className="h-7 w-7 p-0"
                  title="Test feed"
                >
                  {testingSource === source.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSource(source.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddSource}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" /> Add News Source
      </Button>

      <p className="text-[10px] text-muted-foreground">
        Supported domains: Bloomberg, Reuters, WSJ, FT, CNBC, Yahoo Finance, MarketWatch, Seeking Alpha, and more.
      </p>
    </div>
  );
}
