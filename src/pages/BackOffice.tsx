import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Company {
  id: string;
  company_name: string;
  ticker: string | null;
  status: string;
  updated_at: string;
}

interface HoldingData {
  ticker: string;
  currentValue: number;
}

const STATUS_COLORS: Record<string, string> = {
  working_on_it: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  stuck: 'bg-red-500/20 text-red-400 border-red-500/30',
  research: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  monitoring: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function BackOffice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, valuations } = usePortfolio();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);

  // Calculate holdings from transactions for value display
  const holdingsMap = useMemo(() => {
    const map = new Map<string, HoldingData>();
    
    transactions.forEach(tx => {
      const ticker = tx.ticker.toUpperCase();
      const existing = map.get(ticker);
      
      if (tx.transactionType === 'buy') {
        if (existing) {
          map.set(ticker, {
            ticker,
            currentValue: existing.currentValue + tx.quantity * tx.pricePerUnit,
          });
        } else {
          map.set(ticker, {
            ticker,
            currentValue: tx.quantity * tx.pricePerUnit,
          });
        }
      } else if (existing) {
        map.set(ticker, {
          ticker,
          currentValue: Math.max(0, existing.currentValue - tx.quantity * tx.pricePerUnit),
        });
      }
    });

    // Update with latest valuations
    const quantityMap = new Map<string, number>();
    transactions.forEach(tx => {
      const ticker = tx.ticker.toUpperCase();
      const existing = quantityMap.get(ticker) || 0;
      if (tx.transactionType === 'buy') {
        quantityMap.set(ticker, existing + tx.quantity);
      } else {
        quantityMap.set(ticker, existing - tx.quantity);
      }
    });

    valuations.forEach(val => {
      const ticker = val.ticker.toUpperCase();
      const qty = quantityMap.get(ticker) || 0;
      if (qty > 0) {
        map.set(ticker, {
          ticker,
          currentValue: qty * val.pricePerUnit,
        });
      }
    });

    return map;
  }, [transactions, valuations]);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('crm_companies')
        .select('id, company_name, ticker, status, updated_at')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) {
        toast.error('Failed to load companies');
        console.error(error);
      } else {
        setCompanies(data || []);
      }
      setLoading(false);
    };

    fetchCompanies();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newCompanyName.trim()) return;

    setCreating(true);
    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        company_name: newCompanyName.trim(),
        status: 'research',
      })
      .select('id, company_name, ticker, status, updated_at')
      .single();

    if (error) {
      toast.error('Failed to create company');
      console.error(error);
      setCreating(false);
      return;
    }

    setCompanies(prev => [data, ...prev]);
    setNewCompanyName('');
    setCreateOpen(false);
    setCreating(false);
    toast.success('Company created');
    navigate(`/backoffice/company/${data.id}`);
  };

  const getCompanyValue = (ticker: string | null): number | null => {
    if (!ticker) return null;
    const holding = holdingsMap.get(ticker.toUpperCase());
    return holding?.currentValue || null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredCompanies = companies.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(query) ||
      (c.ticker && c.ticker.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Back Office</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Companies Table */}
      {filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">No companies yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Add your first company to start tracking investments.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
            <Plus size={16} />
            Add Company
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Company Name</TableHead>
                <TableHead className="font-semibold w-[100px]">Ticker</TableHead>
                <TableHead className="font-semibold w-[140px] text-right">Value</TableHead>
                <TableHead className="font-semibold w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map(company => {
                const value = getCompanyValue(company.ticker);
                return (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/backoffice/company/${company.id}`)}
                  >
                    <TableCell className="font-medium">{company.company_name}</TableCell>
                    <TableCell>
                      {company.ticker ? (
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {company.ticker}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {value !== null ? formatCurrency(value) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[company.status] || 'bg-muted text-muted-foreground'}
                      >
                        {company.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
              placeholder="Company name"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && newCompanyName.trim()) handleCreate();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newCompanyName.trim() || creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
