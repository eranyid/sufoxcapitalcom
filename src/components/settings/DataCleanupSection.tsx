import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Clock, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type TimePeriod = '24h' | '7d' | '30d' | '1y' | 'all';
type DataCategory = 'transactions' | 'valuations' | 'activity' | 'all';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

const DATA_CATEGORIES: { value: DataCategory; label: string; description: string }[] = [
  { value: 'transactions', label: 'Transactions', description: 'Buy/sell records' },
  { value: 'valuations', label: 'Valuations', description: 'Asset price records' },
  { value: 'activity', label: 'Activity Logs', description: 'Task & CRM activity' },
  { value: 'all', label: 'All Data', description: 'Everything above' },
];

export function DataCleanupSection() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [dataCategory, setDataCategory] = useState<DataCategory>('transactions');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedCounts, setDeletedCounts] = useState<Record<string, number> | null>(null);

  const getCutoffDate = (period: TimePeriod): Date | null => {
    if (period === 'all') return null;
    
    const now = new Date();
    switch (period) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  const handleCleanup = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    setDeletedCounts(null);
    
    const cutoff = getCutoffDate(timePeriod);
    const results: Record<string, number> = {};

    try {
      // Delete transactions
      if (dataCategory === 'transactions' || dataCategory === 'all') {
        let query = supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id);
        
        if (cutoff) {
          query = query.gte('created_at', cutoff.toISOString());
        }
        
        const { data, error } = await query.select('id');
        if (error) throw error;
        results.transactions = data?.length || 0;
      }

      // Delete valuations
      if (dataCategory === 'valuations' || dataCategory === 'all') {
        let query = supabase
          .from('valuations')
          .delete()
          .eq('user_id', user.id);
        
        if (cutoff) {
          query = query.gte('created_at', cutoff.toISOString());
        }
        
        const { data, error } = await query.select('id');
        if (error) throw error;
        results.valuations = data?.length || 0;
      }

      // Delete activity logs
      if (dataCategory === 'activity' || dataCategory === 'all') {
        // Task activity log
        let activityQuery = supabase
          .from('task_activity_log')
          .delete()
          .eq('user_id', user.id);
        
        if (cutoff) {
          activityQuery = activityQuery.gte('created_at', cutoff.toISOString());
        }
        
        const { data: activityData, error: activityError } = await activityQuery.select('id');
        if (activityError) throw activityError;
        
        // CRM activity log
        let crmQuery = supabase
          .from('crm_activity_log')
          .delete()
          .eq('user_id', user.id);
        
        if (cutoff) {
          crmQuery = crmQuery.gte('created_at', cutoff.toISOString());
        }
        
        const { data: crmData, error: crmError } = await crmQuery.select('id');
        if (crmError) throw crmError;
        
        results.activity = (activityData?.length || 0) + (crmData?.length || 0);
      }

      setDeletedCounts(results);
      
      const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);
      if (totalDeleted > 0) {
        toast.success(`Deleted ${totalDeleted} records successfully`);
      } else {
        toast.info('No records found for the selected period');
      }
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(error.message || 'Failed to delete records');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryLabel = () => {
    const cat = DATA_CATEGORIES.find(c => c.value === dataCategory);
    return cat?.label || 'data';
  };

  const getPeriodLabel = () => {
    const period = TIME_PERIODS.find(p => p.value === timePeriod);
    return period?.label.toLowerCase() || 'selected period';
  };

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Data Cleanup
        </CardTitle>
        <CardDescription className="text-xs">
          Delete accumulated data for specific time periods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Data Type</label>
            <Select value={dataCategory} onValueChange={(v: DataCategory) => setDataCategory(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex flex-col">
                      <span>{cat.label}</span>
                      <span className="text-xs text-muted-foreground">{cat.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Time Period</label>
            <Select value={timePeriod} onValueChange={(v: TimePeriod) => setTimePeriod(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIODS.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {deletedCounts && (
          <div className="p-3 bg-muted/30 rounded-lg text-sm">
            <p className="font-medium mb-2">Last cleanup results:</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {deletedCounts.transactions !== undefined && (
                <div>
                  <p className="text-lg font-bold text-primary">{deletedCounts.transactions}</p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </div>
              )}
              {deletedCounts.valuations !== undefined && (
                <div>
                  <p className="text-lg font-bold text-primary">{deletedCounts.valuations}</p>
                  <p className="text-xs text-muted-foreground">Valuations</p>
                </div>
              )}
              {deletedCounts.activity !== undefined && (
                <div>
                  <p className="text-lg font-bold text-primary">{deletedCounts.activity}</p>
                  <p className="text-xs text-muted-foreground">Activity Logs</p>
                </div>
              )}
            </div>
          </div>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {getCategoryLabel()}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Data Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  You are about to <strong>permanently delete</strong> the following data:
                </p>
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="font-medium text-foreground">{getCategoryLabel()}</p>
                  <p className="text-sm text-muted-foreground">From: {getPeriodLabel()}</p>
                </div>
                <p className="text-sm">
                  This action <strong>cannot be undone</strong>. The data will be permanently removed from your account.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCleanup}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
