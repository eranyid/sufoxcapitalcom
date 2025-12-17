import { useState } from 'react';
import { useTrash, DeletedItem } from '@/hooks/useTrash';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Trash2, RotateCcw, AlertTriangle, Package, FileText, Building2, Landmark, CheckSquare, FolderOpen, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons: Record<DeletedItem['type'], React.ReactNode> = {
  transaction: <FileText className="h-4 w-4" />,
  valuation: <Package className="h-4 w-4" />,
  company: <Building2 className="h-4 w-4" />,
  fund: <Landmark className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
  project: <FolderOpen className="h-4 w-4" />,
};

const typeLabels: Record<DeletedItem['type'], string> = {
  transaction: 'Transaction',
  valuation: 'Valuation',
  company: 'Company',
  fund: 'Fund',
  task: 'Task',
  project: 'Project',
};

const typeBadgeVariants: Record<DeletedItem['type'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  transaction: 'default',
  valuation: 'secondary',
  company: 'outline',
  fund: 'outline',
  task: 'secondary',
  project: 'default',
};

export default function Trash() {
  const { items, loading, restoreItem, permanentlyDelete, emptyTrash, getDaysRemaining, refetch } = useTrash();
  const [typeFilter, setTypeFilter] = useState<DeletedItem['type'] | 'all'>('all');
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'restore' | 'delete' | 'empty';
    item?: DeletedItem;
  } | null>(null);

  const handleRunCleanup = async () => {
    setRunningCleanup(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-trash');
      
      if (error) {
        console.error('Cleanup error:', error);
        toast.error('Failed to run cleanup');
        return;
      }

      if (data?.success) {
        const totalDeleted = Object.values(data.details as Record<string, number>)
          .filter((v): v is number => typeof v === 'number' && v > 0)
          .reduce((a, b) => a + b, 0);
        
        if (totalDeleted > 0) {
          toast.success(`Cleanup complete: ${totalDeleted} expired items permanently deleted`);
          refetch();
        } else {
          toast.info('No expired items to clean up');
        }
      }
    } catch (err) {
      console.error('Cleanup failed:', err);
      toast.error('Cleanup job failed');
    } finally {
      setRunningCleanup(false);
    }
  };

  const filteredItems = typeFilter === 'all' 
    ? items 
    : items.filter(item => item.type === typeFilter);

  const handleRestore = async () => {
    if (confirmAction?.item) {
      await restoreItem(confirmAction.item);
    }
    setConfirmAction(null);
  };

  const handlePermanentDelete = async () => {
    if (confirmAction?.item) {
      await permanentlyDelete(confirmAction.item);
    }
    setConfirmAction(null);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="border-border/40">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-warning">Administrative View</p>
          <p className="text-muted-foreground mt-1">
            Deleted items are retained for up to 30 days. Restoring items will re-activate them across the system.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-destructive" />
            Trash
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deleted items are permanently removed after 30 days
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunCleanup}
            disabled={runningCleanup}
          >
            {runningCleanup ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Run Cleanup Now
          </Button>
          
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="transaction">Transactions</SelectItem>
              <SelectItem value="valuation">Valuations</SelectItem>
              <SelectItem value="company">Companies</SelectItem>
              <SelectItem value="fund">Funds</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
            </SelectContent>
          </Select>
          
          {items.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmAction({ type: 'empty' })}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Empty Trash
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/40">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-lg font-medium">
            Deleted Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Trash2 className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Trash is empty</p>
              <p className="text-sm">Deleted items will appear here for 30 days</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[140px]">Deleted</TableHead>
                  <TableHead className="w-[100px]">Expires</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const daysRemaining = getDaysRemaining(item.deleted_at);
                  return (
                    <TableRow key={`${item.type}-${item.id}`} className="border-border/40">
                      <TableCell>
                        <Badge variant={typeBadgeVariants[item.type]} className="gap-1">
                          {typeIcons[item.type]}
                          {typeLabels[item.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(item.deleted_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={daysRemaining <= 7 ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {daysRemaining} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'restore', item })}
                            className="text-primary hover:text-primary"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'delete', item })}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation */}
      <AlertDialog open={confirmAction?.type === 'restore'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore "{confirmAction?.item?.name}"? 
              It will be moved back to its original location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={confirmAction?.type === 'delete'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{confirmAction?.item?.name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Trash Confirmation */}
      <AlertDialog open={confirmAction?.type === 'empty'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Empty Trash
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete all {items.length} items in trash? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEmptyTrash}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
