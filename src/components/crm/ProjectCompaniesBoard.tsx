import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil, ArrowRight, MoreHorizontal, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmCompany, GroupName, GROUP_OPTIONS, BOARD_STATUS_OPTIONS, BoardStatus } from '@/types/crm';
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
import { format } from 'date-fns';

interface Props {
  projectId: string;
}

export default function ProjectCompaniesBoard({ projectId }: Props) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<GroupName, boolean>>({
    ongoing_holding: true,
    potential: true,
    old_exits: false,
  });
  const [addingToGroup, setAddingToGroup] = useState<GroupName | null>(null);
  const [newCompanyName, setNewCompanyName] = useState('');

  const fetchCompanies = useCallback(async () => {
    const { data, error } = await supabase
      .from('crm_companies')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load companies');
      console.error(error);
    } else {
      setCompanies((data as CrmCompany[]) || []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCreate = async (groupName: GroupName) => {
    if (!user || !newCompanyName.trim()) return;

    // Optimistic: add temp item
    const tempId = `temp-${Date.now()}`;
    const tempCompany: CrmCompany = {
      id: tempId,
      user_id: user.id,
      project_id: projectId,
      company_name: newCompanyName,
      group_name: groupName,
      status: 'working_on_it',
      market_cap: null,
      sector: null,
      geography: null,
      investment_thesis: null,
      notes: null,
      timeline_start: null,
      timeline_end: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCompanies(prev => [tempCompany, ...prev]);
    setNewCompanyName('');
    setAddingToGroup(null);

    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        project_id: projectId,
        company_name: newCompanyName,
        group_name: groupName,
        status: 'working_on_it',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create company');
      setCompanies(prev => prev.filter(c => c.id !== tempId));
      console.error(error);
      return;
    }

    setCompanies(prev => prev.map(c => c.id === tempId ? (data as CrmCompany) : c));
    toast.success('Company added');
  };

  const handleInlineUpdate = async (id: string, field: keyof CrmCompany, value: string | null) => {
    const original = companies.find(c => c.id === id);
    if (!original) return;

    // Optimistic update
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));

    const { error } = await supabase
      .from('crm_companies')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
      setCompanies(prev => prev.map(c => c.id === id ? original : c));
      console.error(error);
    }
  };

  const handleDuplicate = async (company: CrmCompany) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        project_id: projectId,
        company_name: `${company.company_name} (copy)`,
        group_name: company.group_name,
        status: company.status,
        market_cap: company.market_cap,
        sector: company.sector,
        geography: company.geography,
        investment_thesis: company.investment_thesis,
        notes: company.notes,
        timeline_start: company.timeline_start,
        timeline_end: company.timeline_end,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to duplicate');
      console.error(error);
      return;
    }

    setCompanies(prev => [data as CrmCompany, ...prev]);
    toast.success('Company duplicated');
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const original = companies.find(c => c.id === deleteId);
    setCompanies(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);

    const { error } = await supabase
      .from('crm_companies')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete company');
      if (original) setCompanies(prev => [original, ...prev]);
      console.error(error);
      return;
    }

    toast.success('Company deleted');
  };

  const toggleGroup = (group: GroupName) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groupedCompanies = GROUP_OPTIONS.reduce((acc, group) => {
    acc[group.value] = companies.filter(c => c.group_name === group.value);
    return acc;
  }, {} as Record<GroupName, CrmCompany[]>);

  const formatTimeline = (start: string | null, end: string | null) => {
    if (!start && !end) return '-';
    const s = start ? format(new Date(start), 'MMM d') : '';
    const e = end ? format(new Date(end), 'MMM d') : '';
    if (s && e) return `${s} - ${e}`;
    return s || e;
  };

  if (loading) {
    return <div className="h-64 bg-muted/50 animate-pulse rounded" />;
  }

  return (
    <div className="space-y-3">
      {GROUP_OPTIONS.map(group => (
        <Collapsible 
          key={group.value} 
          open={expandedGroups[group.value]}
          onOpenChange={() => toggleGroup(group.value)}
        >
          <div className="border border-border rounded overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  {expandedGroups[group.value] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="font-medium text-sm">{group.label}</span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {groupedCompanies[group.value]?.length || 0}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
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
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[180px]">Name</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[120px]">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[100px]">Market Cap</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[120px]">Sector</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[100px]">Geography</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[150px]">Notes</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[140px]">Timeline</th>
                      <th className="w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {addingToGroup === group.value && (
                      <tr className="border-b border-border">
                        <td colSpan={8} className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={newCompanyName}
                              onChange={e => setNewCompanyName(e.target.value)}
                              placeholder="Company name..."
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
                    {groupedCompanies[group.value]?.length === 0 && addingToGroup !== group.value && (
                      <tr>
                        <td colSpan={8} className="text-center text-muted-foreground py-6 text-sm">
                          No items
                        </td>
                      </tr>
                    )}
                    {groupedCompanies[group.value]?.map(company => (
                      <tr key={company.id} className="border-b border-border hover:bg-muted/10 group/row">
                        <td className="px-3 py-1.5">
                          <Input
                            defaultValue={company.company_name}
                            className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent"
                            onBlur={e => {
                              if (e.target.value !== company.company_name) {
                                handleInlineUpdate(company.id, 'company_name', e.target.value);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Select
                            value={company.status}
                            onValueChange={v => handleInlineUpdate(company.id, 'status', v)}
                          >
                            <SelectTrigger className="h-7 text-xs border-transparent hover:border-border bg-transparent w-[110px]">
                              <BoardStatusBadge status={company.status} />
                            </SelectTrigger>
                            <SelectContent>
                              {BOARD_STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            defaultValue={company.market_cap || ''}
                            placeholder="-"
                            className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent w-[80px]"
                            onBlur={e => {
                              if (e.target.value !== (company.market_cap || '')) {
                                handleInlineUpdate(company.id, 'market_cap', e.target.value || null);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            defaultValue={company.sector || ''}
                            placeholder="-"
                            className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent w-[100px]"
                            onBlur={e => {
                              if (e.target.value !== (company.sector || '')) {
                                handleInlineUpdate(company.id, 'sector', e.target.value || null);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            defaultValue={company.geography || ''}
                            placeholder="-"
                            className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent w-[80px]"
                            onBlur={e => {
                              if (e.target.value !== (company.geography || '')) {
                                handleInlineUpdate(company.id, 'geography', e.target.value || null);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            defaultValue={company.notes || ''}
                            placeholder="-"
                            className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent"
                            onBlur={e => {
                              if (e.target.value !== (company.notes || '')) {
                                handleInlineUpdate(company.id, 'notes', e.target.value || null);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex gap-1">
                            <Input
                              type="date"
                              defaultValue={company.timeline_start || ''}
                              className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent w-[85px]"
                              onBlur={e => {
                                if (e.target.value !== (company.timeline_start || '')) {
                                  handleInlineUpdate(company.id, 'timeline_start', e.target.value || null);
                                }
                              }}
                            />
                            <Input
                              type="date"
                              defaultValue={company.timeline_end || ''}
                              className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent w-[85px]"
                              onBlur={e => {
                                if (e.target.value !== (company.timeline_end || '')) {
                                  handleInlineUpdate(company.id, 'timeline_end', e.target.value || null);
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
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDuplicate(company)}>
                                  <Copy size={14} className="mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Move to</div>
                                {GROUP_OPTIONS.filter(g => g.value !== company.group_name).map(g => (
                                  <DropdownMenuItem 
                                    key={g.value} 
                                    onClick={() => handleInlineUpdate(company.id, 'group_name', g.value)}
                                  >
                                    <ArrowRight size={14} className="mr-2" />
                                    {g.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeleteId(company.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
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
