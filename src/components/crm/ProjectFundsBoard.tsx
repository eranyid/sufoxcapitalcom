import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmFund, GroupName, GROUP_OPTIONS, FUND_STATUS_OPTIONS, FundStatus, PRIORITY_OPTIONS, Priority } from '@/types/crm';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { FundStatusBadge } from './FundStatusBadge';
import { PriorityBadge } from './PriorityBadge';

interface Props {
  projectId: string;
}

export default function ProjectFundsBoard({ projectId }: Props) {
  const { user } = useAuth();
  const [funds, setFunds] = useState<CrmFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CrmFund>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<GroupName, boolean>>({
    ongoing_holding: true,
    potential: true,
    old_exits: false,
  });
  const [addingToGroup, setAddingToGroup] = useState<GroupName | null>(null);
  const [newFundName, setNewFundName] = useState('');

  const fetchFunds = useCallback(async () => {
    const { data, error } = await supabase
      .from('crm_funds')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load funds');
      console.error(error);
    } else {
      setFunds((data as CrmFund[]) || []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchFunds();
  }, [fetchFunds]);

  const handleCreate = async (groupName: GroupName) => {
    if (!user || !newFundName.trim()) return;

    const { data, error } = await supabase
      .from('crm_funds')
      .insert({
        user_id: user.id,
        project_id: projectId,
        fund_name: newFundName,
        group_name: groupName,
        status: 'screening',
        priority: 'medium',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create fund');
      console.error(error);
      return;
    }

    setFunds(prev => [data as CrmFund, ...prev]);
    setNewFundName('');
    setAddingToGroup(null);
    toast.success('Fund added');
  };

  const handleUpdate = async (id: string, updates: Partial<CrmFund>) => {
    const { error } = await supabase
      .from('crm_funds')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update fund');
      console.error(error);
      return;
    }

    setFunds(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('crm_funds')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete fund');
      console.error(error);
      return;
    }

    setFunds(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);
    toast.success('Fund deleted');
  };

  const startEdit = (fund: CrmFund) => {
    setEditingId(fund.id);
    setEditValues(fund);
  };

  const toggleGroup = (group: GroupName) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groupedFunds = GROUP_OPTIONS.reduce((acc, group) => {
    acc[group.value] = funds.filter(f => f.group_name === group.value);
    return acc;
  }, {} as Record<GroupName, CrmFund[]>);

  if (loading) {
    return <div className="h-64 bg-muted/50 animate-pulse rounded" />;
  }

  return (
    <div className="space-y-4">
      {GROUP_OPTIONS.map(group => (
        <Collapsible 
          key={group.value} 
          open={expandedGroups[group.value]}
          onOpenChange={() => toggleGroup(group.value)}
        >
          <div className="border border-border rounded-lg overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  {expandedGroups[group.value] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="font-medium">{group.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {groupedFunds[group.value]?.length || 0}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingToGroup(group.value);
                    setExpandedGroups(prev => ({ ...prev, [group.value]: true }));
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  Add
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Name</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Asset Class</TableHead>
                    <TableHead>Geography</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addingToGroup === group.value && (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newFundName}
                            onChange={e => setNewFundName(e.target.value)}
                            placeholder="Fund name..."
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCreate(group.value);
                              if (e.key === 'Escape') setAddingToGroup(null);
                            }}
                          />
                          <Button size="sm" onClick={() => handleCreate(group.value)}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddingToGroup(null)}>Cancel</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {groupedFunds[group.value]?.length === 0 && addingToGroup !== group.value && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No funds in this group
                      </TableCell>
                    </TableRow>
                  )}
                  {groupedFunds[group.value]?.map(fund => (
                    <TableRow key={fund.id} className="group">
                      <TableCell>
                        {editingId === fund.id ? (
                          <Input
                            value={editValues.fund_name || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, fund_name: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{fund.fund_name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === fund.id ? (
                          <Input
                            value={editValues.strategy || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, strategy: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          fund.strategy || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === fund.id ? (
                          <Input
                            value={editValues.asset_class || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, asset_class: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          fund.asset_class || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === fund.id ? (
                          <Input
                            value={editValues.geography || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, geography: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          fund.geography || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === fund.id ? (
                          <Input
                            value={editValues.manager || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, manager: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          fund.manager || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === fund.id ? (
                          <Select
                            value={editValues.status}
                            onValueChange={v => setEditValues(prev => ({ ...prev, status: v as FundStatus }))}
                          >
                            <SelectTrigger className="h-8 w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FUND_STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FundStatusBadge status={fund.status} />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === fund.id ? (
                          <Select
                            value={editValues.priority}
                            onValueChange={v => setEditValues(prev => ({ ...prev, priority: v as Priority }))}
                          >
                            <SelectTrigger className="h-8 w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <PriorityBadge priority={fund.priority} />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {editingId === fund.id ? (
                          <Input
                            value={editValues.notes || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          fund.notes || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          {editingId === fund.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdate(fund.id, editValues)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(fund)}>
                                <Pencil size={14} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(fund.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fund?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
