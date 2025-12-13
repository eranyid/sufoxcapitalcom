import { useState, useMemo } from 'react';
import { Trash2, Check, X, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrmCompany, CompanyStatus, COMPANY_STATUS_OPTIONS } from '@/types/crm';
import { CompanyStatusBadge } from './CompanyStatusBadge';
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

interface CompaniesTableProps {
  companies: CrmCompany[];
  onUpdate: (id: string, updates: Partial<CrmCompany>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

type SortField = 'company_name' | 'market_cap' | 'sector' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function CompaniesTable({ companies, onUpdate, onDelete }: CompaniesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CrmCompany>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | 'all'>('all');

  const startEdit = (company: CrmCompany) => {
    setEditingId(company.id);
    setEditValues({
      company_name: company.company_name,
      market_cap: company.market_cap,
      sector: company.sector,
      geography: company.geography,
      investment_thesis: company.investment_thesis,
      status: company.status,
      notes: company.notes,
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

  const filteredAndSortedCompanies = useMemo(() => {
    let result = [...companies];

    if (filterStatus !== 'all') {
      result = result.filter(c => c.status === filterStatus);
    }

    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'company_name':
          comparison = a.company_name.localeCompare(b.company_name);
          break;
        case 'market_cap':
          comparison = (a.market_cap || '').localeCompare(b.market_cap || '');
          break;
        case 'sector':
          comparison = (a.sector || '').localeCompare(b.sector || '');
          break;
        case 'status':
          const statusOrder = { research: 0, contacted: 1, monitoring: 2, rejected: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [companies, filterStatus, sortField, sortDir]);

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
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as CompanyStatus | 'all')}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Statuses</SelectItem>
            {COMPANY_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterStatus !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setFilterStatus('all')}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[180px]">
                <SortableHeader field="company_name">Company</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="market_cap">Market Cap</SortableHeader>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="sector">Sector</SortableHeader>
              </TableHead>
              <TableHead className="w-[100px]">Geography</TableHead>
              <TableHead className="w-[180px]">Investment Thesis</TableHead>
              <TableHead className="w-[110px]">
                <SortableHeader field="status">Status</SortableHeader>
              </TableHead>
              <TableHead className="w-[140px]">Notes</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCompanies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No companies found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedCompanies.map((company) => (
                <TableRow 
                  key={company.id} 
                  className={cn('group', editingId === company.id && 'bg-muted/30')}
                >
                  <TableCell>
                    {editingId === company.id ? (
                      <Input
                        value={editValues.company_name || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, company_name: e.target.value }))}
                        className="h-8 text-sm bg-background"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer text-primary hover:text-primary/80 transition-colors font-medium"
                        onClick={() => startEdit(company)}
                      >
                        {company.company_name}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === company.id ? (
                      <Input
                        value={editValues.market_cap || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, market_cap: e.target.value }))}
                        className="h-8 text-xs bg-background"
                        placeholder="e.g. $5B"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => startEdit(company)}>
                        {company.market_cap || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === company.id ? (
                      <Input
                        value={editValues.sector || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, sector: e.target.value }))}
                        className="h-8 text-xs bg-background"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => startEdit(company)}>
                        {company.sector || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === company.id ? (
                      <Input
                        value={editValues.geography || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, geography: e.target.value }))}
                        className="h-8 text-xs bg-background"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer" onClick={() => startEdit(company)}>
                        {company.geography || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === company.id ? (
                      <Textarea
                        value={editValues.investment_thesis || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, investment_thesis: e.target.value }))}
                        className="h-14 text-xs bg-background resize-none"
                        rows={2}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer line-clamp-2" onClick={() => startEdit(company)}>
                        {company.investment_thesis || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === company.id ? (
                      <Select 
                        value={editValues.status} 
                        onValueChange={(v) => setEditValues(prev => ({ ...prev, status: v as CompanyStatus }))}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {COMPANY_STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="cursor-pointer" onClick={() => startEdit(company)}>
                        <CompanyStatusBadge status={company.status} />
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === company.id ? (
                      <Textarea
                        value={editValues.notes || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, notes: e.target.value }))}
                        className="h-14 text-xs bg-background resize-none"
                        rows={2}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground cursor-pointer line-clamp-2" onClick={() => startEdit(company)}>
                        {company.notes || '—'}
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {editingId === company.id ? (
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
                        onClick={() => setDeleteId(company.id)}
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
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this company? This action cannot be undone.
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