import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, ArrowRight, MoreHorizontal, Copy, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmFund, GroupName, GROUP_OPTIONS, BOARD_STATUS_OPTIONS } from '@/types/crm';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { BoardStatusBadge } from './BoardStatusBadge';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  projectId: string;
}

function DraggableRow({ fund, children }: { fund: CrmFund; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fund.id, data: { fund } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border/30 hover:bg-[#266E73]/8 group/row transition-colors">
      <td className="px-2 py-1.5 w-[30px]">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-50 hover:opacity-100"
        >
          <GripVertical size={14} />
        </div>
      </td>
      {children}
    </tr>
  );
}

function DroppableGroup({ groupId, children }: { groupId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId });

  return (
    <tbody ref={setNodeRef} className={isOver ? 'bg-primary/5' : ''}>
      {children}
    </tbody>
  );
}

export default function ProjectFundsBoard({ projectId }: Props) {
  const { user } = useAuth();
  const [funds, setFunds] = useState<CrmFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<GroupName, boolean>>({
    ongoing_holding: true,
    potential: true,
    old_exits: false,
  });
  const [addingToGroup, setAddingToGroup] = useState<GroupName | null>(null);
  const [newFundName, setNewFundName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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

    const tempId = `temp-${Date.now()}`;
    const tempFund: CrmFund = {
      id: tempId,
      user_id: user.id,
      project_id: projectId,
      fund_name: newFundName,
      group_name: groupName,
      status: 'working_on_it',
      strategy: null,
      asset_class: null,
      geography: null,
      manager: null,
      priority: 'medium',
      notes: null,
      timeline_start: null,
      timeline_end: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setFunds(prev => [tempFund, ...prev]);
    setNewFundName('');
    setAddingToGroup(null);

    const { data, error } = await supabase
      .from('crm_funds')
      .insert({
        user_id: user.id,
        project_id: projectId,
        fund_name: newFundName,
        group_name: groupName,
        status: 'working_on_it',
        priority: 'medium',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create fund');
      setFunds(prev => prev.filter(f => f.id !== tempId));
      console.error(error);
      return;
    }

    setFunds(prev => prev.map(f => f.id === tempId ? (data as CrmFund) : f));
    toast.success('Fund added');
  };

  const handleInlineUpdate = async (id: string, field: keyof CrmFund, value: string | null) => {
    const original = funds.find(f => f.id === id);
    if (!original) return;

    setFunds(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));

    const { error } = await supabase
      .from('crm_funds')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
      setFunds(prev => prev.map(f => f.id === id ? original : f));
      console.error(error);
    }
  };

  const handleDuplicate = async (fund: CrmFund) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('crm_funds')
      .insert({
        user_id: user.id,
        project_id: projectId,
        fund_name: `${fund.fund_name} (copy)`,
        group_name: fund.group_name,
        status: fund.status,
        strategy: fund.strategy,
        asset_class: fund.asset_class,
        geography: fund.geography,
        manager: fund.manager,
        priority: fund.priority,
        notes: fund.notes,
        timeline_start: fund.timeline_start,
        timeline_end: fund.timeline_end,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to duplicate');
      console.error(error);
      return;
    }

    setFunds(prev => [data as CrmFund, ...prev]);
    toast.success('Fund duplicated');
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const original = funds.find(f => f.id === deleteId);
    setFunds(prev => prev.filter(f => f.id !== deleteId));
    setDeleteId(null);

    const { error } = await supabase
      .from('crm_funds')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete fund');
      if (original) setFunds(prev => [original, ...prev]);
      console.error(error);
      return;
    }

    toast.success('Fund deleted');
  };

  const toggleGroup = (group: GroupName) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeFund = funds.find(f => f.id === active.id);
    if (!activeFund) return;

    const targetGroup = GROUP_OPTIONS.find(g => g.value === over.id);
    if (targetGroup && targetGroup.value !== activeFund.group_name) {
      handleInlineUpdate(activeFund.id, 'group_name', targetGroup.value);
      return;
    }

    const overFund = funds.find(f => f.id === over.id);
    if (overFund && overFund.group_name !== activeFund.group_name) {
      handleInlineUpdate(activeFund.id, 'group_name', overFund.group_name);
    }
  };

  const groupedFunds = GROUP_OPTIONS.reduce((acc, group) => {
    acc[group.value] = funds.filter(f => f.group_name === group.value);
    return acc;
  }, {} as Record<GroupName, CrmFund[]>);

  const activeFund = activeId ? funds.find(f => f.id === activeId) : null;

  if (loading) {
    return <div className="h-64 bg-muted/50 animate-pulse rounded" />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-3">
        {GROUP_OPTIONS.map(group => (
          <Collapsible 
            key={group.value} 
            open={expandedGroups[group.value]}
            onOpenChange={() => toggleGroup(group.value)}
          >
            <div className="rounded-lg overflow-hidden">
              {/* Section Header - Dark Blue #4B4BC3 */}
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between px-4 py-3.5 bg-[#4B4BC3] cursor-pointer hover:bg-[#5555d0] rounded-t-lg">
                  <div className="flex items-center gap-3">
                    {expandedGroups[group.value] ? <ChevronDown size={16} className="text-white/70" /> : <ChevronRight size={16} className="text-white/70" />}
                    <span className="font-medium text-[15px] text-white/95">{group.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80">
                      {groupedFunds[group.value]?.length || 0}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-white/80 hover:text-white hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingToGroup(group.value);
                      setExpandedGroups(prev => ({ ...prev, [group.value]: true }));
                    }}
                  >
                    <Plus size={12} className="mr-1" />
                    Add
                  </Button>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {/* Column Header - Teal #266E73 */}
                    <thead>
                      <tr className="bg-[#266E73]">
                        <th className="w-[30px]"></th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/60 w-[180px]">Name</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/60 w-[120px]">Status</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/60 w-[120px]">Strategy</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/60 w-[100px]">Asset Class</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/60 w-[100px]">Geography</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/60 min-w-[150px]">Notes</th>
                        <th className="text-left px-3 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/60 w-[140px]">Timeline</th>
                        <th className="w-[50px]"></th>
                      </tr>
                    </thead>
                    <SortableContext items={groupedFunds[group.value]?.map(f => f.id) || []} strategy={verticalListSortingStrategy}>
                      <DroppableGroup groupId={group.value}>
                        {addingToGroup === group.value && (
                          <tr className="border-b border-border">
                            <td colSpan={9} className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newFundName}
                                  onChange={e => setNewFundName(e.target.value)}
                                  placeholder="Fund name..."
                                  className="h-8 text-sm"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreate(group.value);
                                    if (e.key === 'Escape') setAddingToGroup(null);
                                  }}
                                />
                                <Button size="sm" className="h-8" onClick={() => handleCreate(group.value)}>Add</Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingToGroup(null)}>Cancel</Button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {groupedFunds[group.value]?.length === 0 && addingToGroup !== group.value && (
                          <tr>
                            <td colSpan={9} className="text-center text-muted-foreground py-6 text-sm">
                              No items — drag here to add
                            </td>
                          </tr>
                        )}
                        {groupedFunds[group.value]?.map(fund => (
                          <DraggableRow key={fund.id} fund={fund}>
                            <td className="px-3 py-1.5">
                              <Input
                                defaultValue={fund.fund_name}
                                className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent"
                                onBlur={e => {
                                  if (e.target.value !== fund.fund_name) {
                                    handleInlineUpdate(fund.id, 'fund_name', e.target.value);
                                  }
                                }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Select
                                value={fund.status}
                                onValueChange={v => handleInlineUpdate(fund.id, 'status', v)}
                              >
                                <SelectTrigger className="h-7 text-xs border-transparent hover:border-border bg-transparent w-[110px]">
                                  <BoardStatusBadge status={fund.status} />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border border-border z-50">
                                  {BOARD_STATUS_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                defaultValue={fund.strategy || ''}
                                placeholder="-"
                                className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent w-[100px]"
                                onBlur={e => {
                                  if (e.target.value !== (fund.strategy || '')) {
                                    handleInlineUpdate(fund.id, 'strategy', e.target.value || null);
                                  }
                                }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                defaultValue={fund.asset_class || ''}
                                placeholder="-"
                                className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent w-[80px]"
                                onBlur={e => {
                                  if (e.target.value !== (fund.asset_class || '')) {
                                    handleInlineUpdate(fund.id, 'asset_class', e.target.value || null);
                                  }
                                }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                defaultValue={fund.geography || ''}
                                placeholder="-"
                                className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent w-[80px]"
                                onBlur={e => {
                                  if (e.target.value !== (fund.geography || '')) {
                                    handleInlineUpdate(fund.id, 'geography', e.target.value || null);
                                  }
                                }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                defaultValue={fund.notes || ''}
                                placeholder="-"
                                className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent"
                                onBlur={e => {
                                  if (e.target.value !== (fund.notes || '')) {
                                    handleInlineUpdate(fund.id, 'notes', e.target.value || null);
                                  }
                                }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <div className="flex gap-1">
                                <Input
                                  type="date"
                                  defaultValue={fund.timeline_start || ''}
                                  className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent w-[85px]"
                                  onBlur={e => {
                                    if (e.target.value !== (fund.timeline_start || '')) {
                                      handleInlineUpdate(fund.id, 'timeline_start', e.target.value || null);
                                    }
                                  }}
                                />
                                <Input
                                  type="date"
                                  defaultValue={fund.timeline_end || ''}
                                  className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent w-[85px]"
                                  onBlur={e => {
                                    if (e.target.value !== (fund.timeline_end || '')) {
                                      handleInlineUpdate(fund.id, 'timeline_end', e.target.value || null);
                                    }
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="opacity-0 group-hover/row:opacity-100">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7">
                                      <MoreHorizontal size={14} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                                    <DropdownMenuItem onClick={() => handleDuplicate(fund)}>
                                      <Copy size={14} className="mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Move to</div>
                                    {GROUP_OPTIONS.filter(g => g.value !== fund.group_name).map(g => (
                                      <DropdownMenuItem 
                                        key={g.value} 
                                        onClick={() => handleInlineUpdate(fund.id, 'group_name', g.value)}
                                      >
                                        <ArrowRight size={14} className="mr-2" />
                                        {g.label}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => setDeleteId(fund.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 size={14} className="mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </DraggableRow>
                        ))}
                      </DroppableGroup>
                    </SortableContext>
                  </table>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>

      <DragOverlay>
        {activeFund && (
          <div className="bg-card border border-primary rounded px-3 py-2 shadow-lg text-sm">
            {activeFund.fund_name}
          </div>
        )}
      </DragOverlay>

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
    </DndContext>
  );
}
