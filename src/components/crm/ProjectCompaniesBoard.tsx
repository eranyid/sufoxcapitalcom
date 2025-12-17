import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil, ArrowRight, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmCompany, GroupName, GROUP_OPTIONS, COMPANY_STATUS_OPTIONS, CompanyStatus } from '@/types/crm';
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
import { CompanyStatusBadge } from './CompanyStatusBadge';

interface Props {
  projectId: string;
}

export default function ProjectCompaniesBoard({ projectId }: Props) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CrmCompany>>({});
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

    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        project_id: projectId,
        company_name: newCompanyName,
        group_name: groupName,
        status: 'research',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create company');
      console.error(error);
      return;
    }

    setCompanies(prev => [data as CrmCompany, ...prev]);
    setNewCompanyName('');
    setAddingToGroup(null);
    toast.success('Company added');
  };

  const handleUpdate = async (id: string, updates: Partial<CrmCompany>) => {
    const { error } = await supabase
      .from('crm_companies')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update company');
      console.error(error);
      return;
    }

    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('crm_companies')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete company');
      console.error(error);
      return;
    }

    setCompanies(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast.success('Company deleted');
  };

  const startEdit = (company: CrmCompany) => {
    setEditingId(company.id);
    setEditValues(company);
  };

  const toggleGroup = (group: GroupName) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groupedCompanies = GROUP_OPTIONS.reduce((acc, group) => {
    acc[group.value] = companies.filter(c => c.group_name === group.value);
    return acc;
  }, {} as Record<GroupName, CrmCompany[]>);

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
                    {groupedCompanies[group.value]?.length || 0}
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
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Market Cap</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Geography</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addingToGroup === group.value && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newCompanyName}
                            onChange={e => setNewCompanyName(e.target.value)}
                            placeholder="Company name..."
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
                  {groupedCompanies[group.value]?.length === 0 && addingToGroup !== group.value && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No companies in this group
                      </TableCell>
                    </TableRow>
                  )}
                  {groupedCompanies[group.value]?.map(company => (
                    <TableRow key={company.id} className="group">
                      <TableCell>
                        {editingId === company.id ? (
                          <Input
                            value={editValues.company_name || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, company_name: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{company.company_name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === company.id ? (
                          <Input
                            value={editValues.market_cap || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, market_cap: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          company.market_cap || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === company.id ? (
                          <Input
                            value={editValues.sector || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, sector: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          company.sector || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === company.id ? (
                          <Input
                            value={editValues.geography || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, geography: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          company.geography || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === company.id ? (
                          <Select
                            value={editValues.status}
                            onValueChange={v => setEditValues(prev => ({ ...prev, status: v as CompanyStatus }))}
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COMPANY_STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <CompanyStatusBadge status={company.status} />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {editingId === company.id ? (
                          <Input
                            value={editValues.notes || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          company.notes || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          {editingId === company.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdate(company.id, editValues)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <MoreHorizontal size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEdit(company)}>
                                  <Pencil size={14} className="mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Move to</div>
                                {GROUP_OPTIONS.filter(g => g.value !== company.group_name).map(g => (
                                  <DropdownMenuItem 
                                    key={g.value} 
                                    onClick={() => handleUpdate(company.id, { group_name: g.value })}
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
