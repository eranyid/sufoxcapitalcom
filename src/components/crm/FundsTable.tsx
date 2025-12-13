import { useState, useMemo } from 'react';
import { Trash2, Check, X, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrmFund, FundStatus, Priority, FUND_STATUS_OPTIONS, PRIORITY_OPTIONS } from '@/types/crm';
import { FundStatusBadge } from './FundStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FundsTableProps {
  funds: CrmFund[];
  onUpdate: (id: string, updates: Partial<CrmFund>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

type SortField = 'fund_name' | 'strategy' | 'status' | 'priority' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function FundsTable({ funds, onUpdate, onDelete }: FundsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CrmFund>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<FundStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');

  const startEdit = (fund: CrmFund) => {
    setEditingId(fund.id);
    setEditValues({
      fund_name: fund.fund_name,
      strategy: fund.strategy,
      asset_class: fund.asset_class,
      geography: fund.geography,
      manager: fund.manager,
      status: fund.status,
      priority: fund.priority,
      notes: fund.notes,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const success = await onUpdate(editingId, editValues);
    if (success) {
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredAndSortedFunds = useMemo(() => {
    let result = [...funds];

    if (filterStatus !== 'all') {
      result = result.filter(f => f.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      result = result.filter(f => f.priority === filterPriority);
    }

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'fund_name':
          comparison = a.fund_name.localeCompare(b.fund_name);
          break;
        case 'strategy':
          comparison = (a.strategy || '').localeCompare(b.strategy || '');
          break;
        case 'status':
          const statusOrder = { screening: 0, dd: 1, approved: 2, rejected: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'priority':
          const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [funds, filterStatus, filterPriority, sortField, sortDir]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground -ml-2"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown size={12} className="ml-1 opacity-50" />
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-muted-foreground" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FundStatus | 'all')}>
          <SelectTrigger className="w-[150px] h-8 text-xs bg-background">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Statuses</SelectItem>
            {FUND_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as Priority | 'all')}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Priorities</SelectItem>
            {PRIORITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterStatus !== 'all' || filterPriority !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setFilterStatus('all'); setFilterPriority('all'); }}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[160px]">
                <SortableHeader field="fund_name">Fund Name</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="strategy">Strategy</SortableHeader>
              </TableHead>
              <TableHead className="w-[100px]">Asset Class</TableHead>
              <TableHead className="w-[100px]">Geography</TableHead>
              <TableHead className="w-[100px]">Manager</TableHead>
              <TableHead className="w-[110px]">
                <SortableHeader field="status">Status</SortableHeader>
              </TableHead>
              <TableHead className="w-[90px]">
                <SortableHeader field="priority">Priority</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">Notes</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedFunds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No funds found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedFunds.map((fund) => (
                <TableRow 
                  key={fund.id} 
                  className={cn('group', editingId === fund.id && 'bg-muted/30')}
                >
                  <TableCell>
                    {editingId === fund.id ? (
                      <Input
                        value={editValues.fund_name || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, fund_name: e.target.value }))}
                        className="h-8 text-sm bg-background"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer text-primary hover:text-primary/80 transition-colors font-medium"
                        onClick={() => startEdit(fund)}
                      >
                        {fund.fund_name}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <Input
                        value={editValues.strategy || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, strategy: e.target.value }))}
                        className="h-8 text-xs bg-background"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => startEdit(fund)}>
                        {fund.strategy || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <Input
                        value={editValues.asset_class || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, asset_class: e.target.value }))}
                        className="h-8 text-xs bg-background"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => startEdit(fund)}>
                        {fund.asset_class || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <Input
                        value={editValues.geography || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, geography: e.target.value }))}
                        className="h-8 text-xs bg-background"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => startEdit(fund)}>
                        {fund.geography || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <Input
                        value={editValues.manager || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, manager: e.target.value }))}
                        className="h-8 text-xs bg-background"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => startEdit(fund)}>
                        {fund.manager || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <Select 
                        value={editValues.status} 
                        onValueChange={(v) => setEditValues(prev => ({ ...prev, status: v as FundStatus }))}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {FUND_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="cursor-pointer" onClick={() => startEdit(fund)}>
                        <FundStatusBadge status={fund.status} />
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <Select 
                        value={editValues.priority} 
                        onValueChange={(v) => setEditValues(prev => ({ ...prev, priority: v as Priority }))}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {PRIORITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="cursor-pointer" onClick={() => startEdit(fund)}>
                        <PriorityBadge priority={fund.priority} />
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <Textarea
                        value={editValues.notes || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, notes: e.target.value }))}
                        className="h-14 text-xs bg-background resize-none"
                        rows={2}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer line-clamp-2" onClick={() => startEdit(fund)}>
                        {fund.notes || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === fund.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          onClick={saveEdit}
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={cancelEdit}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteId(fund.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fund? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
