import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Activity, ExternalLink, ArrowUpRight, ArrowDownRight, Plus, Trash2, RefreshCw } from 'lucide-react';
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

interface ActivityLogEntry {
  id: string;
  user_id: string;
  project_id: string;
  ticker: string;
  action: string;
  source_transaction_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface Props {
  projectId: string;
}

export default function CrmActivityLog({ projectId }: Props) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_activity_log')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to fetch activity logs:', error);
      } else {
        setLogs((data as ActivityLogEntry[]) || []);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [open, projectId, user]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'auto_add_ongoing':
        return 'Added to Ongoing';
      case 'auto_move_old_exits':
        return 'Moved to Old Exits';
      case 'manual_edit':
        return 'Manual Edit';
      case 'task_created':
        return 'Task Created';
      case 'task_deleted':
        return 'Task Deleted';
      case 'status_changed':
        return 'Status Changed';
      default:
        return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  const getActionBadge = (action: string, details?: Record<string, unknown>) => {
    switch (action) {
      case 'auto_add_ongoing':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
            <ArrowUpRight size={10} className="mr-1" />
            {getActionLabel(action)}
          </Badge>
        );
      case 'auto_move_old_exits':
        return (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
            <ArrowDownRight size={10} className="mr-1" />
            {getActionLabel(action)}
          </Badge>
        );
      case 'task_created':
        return (
          <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-xs">
            <Plus size={10} className="mr-1" />
            {getActionLabel(action)}
          </Badge>
        );
      case 'task_deleted':
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-xs">
            <Trash2 size={10} className="mr-1" />
            {getActionLabel(action)}
          </Badge>
        );
      case 'status_changed':
        return (
          <span className="flex items-center gap-1">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
              <RefreshCw size={10} className="mr-1" />
              Status
            </Badge>
            {details?.previousStatus && details?.newStatus && (
              <span className="text-xs text-muted-foreground">
                {String(details.previousStatus).replace(/_/g, ' ')} → {String(details.newStatus).replace(/_/g, ' ')}
              </span>
            )}
          </span>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {getActionLabel(action)}
          </Badge>
        );
    }
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
            CRM Activity Log
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity yet. Activity will appear here when transactions sync to CRM.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/5 hover:bg-muted/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm font-medium text-primary">
                      {log.ticker}
                    </div>
                    {getActionBadge(log.action, log.details)}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                    {log.source_transaction_id && (
                      <a
                        href={`/transactions?highlight=${log.source_transaction_id}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpen(false);
                          window.location.href = `/transactions?highlight=${log.source_transaction_id}`;
                        }}
                      >
                        <ExternalLink size={12} />
                        View Tx
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
