import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BarChart3, Search, FileText, TrendingUp, Target, FlaskConical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AnalysisItem {
  id: string;
  title: string;
  entry_type: string;
  ticker: string | null;
  updated_at: string;
  output_summary: string | null;
}

interface ShareAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareAnalysis: (analysisId: string, analysisType: string, analysisTitle: string, snapshot?: Record<string, unknown>) => void;
}

const typeIcons: Record<string, typeof BarChart3> = {
  valuation: TrendingUp,
  research_note: FileText,
  scenario: Target,
  calculator: FlaskConical,
};

const typeLabels: Record<string, string> = {
  valuation: 'Valuation',
  research_note: 'Research Note',
  scenario: 'Scenario',
  calculator: 'Calculator',
  question: 'Question',
};

export function ShareAnalysisDialog({ open, onOpenChange, onShareAnalysis }: ShareAnalysisDialogProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    const fetchAnalyses = async () => {
      const { data } = await supabase
        .from('company_research_entries')
        .select('id, title, entry_type, ticker, updated_at, output_summary')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      setItems(data || []);
      setLoading(false);
    };
    fetchAnalyses();
    setSearch('');
  }, [open, user]);

  const filtered = items.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return item.title.toLowerCase().includes(s) || item.ticker?.toLowerCase().includes(s);
  });

  const handleShare = (item: AnalysisItem) => {
    onShareAnalysis(
      item.id,
      item.entry_type,
      item.title,
      { ticker: item.ticker, summary: item.output_summary }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-wider flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" />
            SHARE ANALYSIS
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or ticker..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 border border-border rounded-md p-1">
            {loading && <p className="text-xs text-muted-foreground p-3 text-center">Loading...</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {items.length === 0 ? 'No analyses found' : 'No results'}
              </p>
            )}
            {filtered.map(item => {
              const Icon = typeIcons[item.entry_type] || BarChart3;
              return (
                <button
                  key={item.id}
                  onClick={() => handleShare(item)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-primary font-mono uppercase">
                        {typeLabels[item.entry_type] || item.entry_type}
                      </span>
                      {item.ticker && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.ticker}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
