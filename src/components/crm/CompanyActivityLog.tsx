import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Activity, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DECISION_TYPE_OPTIONS } from './DecisionLogSection';

interface Decision {
  id: string;
  decision_date: string;
  decision_type: string;
  rationale: string;
  confidence: number;
  created_at: string;
}

interface Props {
  companyId: string;
  companyName: string;
}

export function CompanyActivityLog({ companyId, companyName }: Props) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_decisions')
        .select('id, decision_date, decision_type, rationale, confidence, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch activity logs:', error);
      } else {
        setLogs((data as Decision[]) || []);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [open, companyId, user]);

  const getDecisionTypeConfig = (type: string) => {
    // Handle status_change specially
    if (type === 'status_change') {
      return { 
        label: 'Status Change', 
        color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' 
      };
    }
    return DECISION_TYPE_OPTIONS.find(o => o.value === type) || { 
      label: type, 
      color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' 
    };
  };

  const renderConfidenceStars = (confidence: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={10}
            className={i <= confidence ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Activity size={14} />
          Activity Log
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity size={18} />
            {companyName} - Activity Log
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity yet. Decisions and status changes will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const config = getDecisionTypeConfig(log.decision_type);
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-md border border-border bg-muted/5 hover:bg-muted/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        {log.decision_type !== 'status_change' && renderConfidenceStars(log.confidence)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.decision_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
