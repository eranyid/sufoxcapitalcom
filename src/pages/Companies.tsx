import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Building2, Plus, Search, FlaskConical, Eye, TrendingUp, Pause, LogOut, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  market_cap: string | null;
  status: string;
  asset_type: string | null;
  sector: string | null;
  confidence_level: string | null;
  updated_at: string;
}

// Conviction level config
const CONVICTION_CONFIG: Record<string, { label: string; color: string }> = {
  speculative: { label: 'Speculative', color: 'text-red-400 bg-red-500/20' },
  starter: { label: 'Starter', color: 'text-orange-400 bg-orange-500/20' },
  core: { label: 'Core', color: 'text-blue-400 bg-blue-500/20' },
  high_conviction: { label: 'High Conviction', color: 'text-emerald-400 bg-emerald-500/20' },
  top: { label: 'Top', color: 'text-amber-400 bg-amber-500/20' },
};

// Map URL params to asset_type values (supports multiple DB values per category)
const ASSET_CLASS_MAP: Record<string, { label: string; dbValues: string[] }> = {
  'equities': { label: 'Public Equities', dbValues: ['equity', 'equities', 'stock'] },
  'funds': { label: 'Funds (ETFs & Mutual Funds)', dbValues: ['etf', 'mutual_fund', 'fund', 'funds', 'bond'] },
  'alternatives': { label: 'Alternatives', dbValues: ['alternative', 'alternatives', 'hedge_fund', 'private_equity', 'venture_capital', 'private_debt', 'real_estate', 'commodity', 'crypto'] },
  'cash': { label: 'Cash & Deposits', dbValues: ['cash', 'deposit', 'money_market', 't_bill', 'makam'] },
  'all': { label: 'All Companies', dbValues: [] },
};

// All asset type options for dropdowns
export const ASSET_TYPE_OPTIONS = [
  { value: 'equity', label: 'Equity' },
  { value: 'etf', label: 'ETF' },
  { value: 'bond', label: 'Bond' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'private_equity', label: 'Private Equity' },
  { value: 'venture_capital', label: 'Venture Capital' },
  { value: 'private_debt', label: 'Private Debt' },
  { value: 'hedge_fund', label: 'Hedge Fund' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'commodity', label: 'Commodity' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'alternative', label: 'Alternative' },
  { value: 'cash', label: 'Cash' },
  { value: 'deposit', label: 'Deposit' },
  { value: 't_bill', label: 'T-Bill / Makam' },
  { value: 'money_market', label: 'Money Market' },
];

// Aligned with BoardStatusBadge labels
const STATUS_CONFIG: Record<string, { icon: React.ReactNode; bg: string; text: string; label: string }> = {
  research: {
    icon: <FlaskConical size={14} />,
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    label: 'research',
  },
  working_on_it: {
    icon: <TrendingUp size={14} />,
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    label: 'active',
  },
  monitoring: {
    icon: <Eye size={14} />,
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    label: 'monitoring',
  },
  done: {
    icon: <LogOut size={14} />,
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    label: 'exited',
  },
  on_hold: {
    icon: <Pause size={14} />,
    bg: 'bg-slate-500/20',
    text: 'text-slate-400',
    label: 'on hold',
  },
};

export default function Companies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assetClass } = useParams<{ assetClass: string }>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newAssetType, setNewAssetType] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const assetClassConfig = assetClass ? ASSET_CLASS_MAP[assetClass] : null;
  const pageTitle = assetClassConfig?.label || 'All Companies';

  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('crm_companies')
        .select('id, company_name, ticker, market_cap, status, asset_type, sector, confidence_level, updated_at')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) {
        toast.error('Failed to load companies');
        console.error(error);
      } else {
        setCompanies((data as Company[]) || []);
      }
      setLoading(false);
    };

    fetchCompanies();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newCompanyName.trim()) return;

    setCreating(true);
    // Use selected asset type, or fallback to first dbValue from filtered view
    const assetTypeValue = newAssetType || 
      (assetClassConfig && assetClassConfig.dbValues.length > 0 
        ? assetClassConfig.dbValues[0] 
        : null);
    
    const { data, error } = await supabase
      .from('crm_companies')
      .insert({
        user_id: user.id,
        company_name: newCompanyName.trim(),
        status: 'research',
        asset_type: assetTypeValue,
      })
      .select('id, company_name, ticker, market_cap, status, asset_type, sector, confidence_level, updated_at')
      .single();

    if (error) {
      toast.error('Failed to create company');
      console.error(error);
      setCreating(false);
      return;
    }

    setCompanies(prev => [data as Company, ...prev]);
    setNewCompanyName('');
    setNewAssetType('');
    setCreateOpen(false);
    setCreating(false);
    toast.success('Company created');
    navigate(`/analysis/company/${data.id}`);
  };

  // Filter by asset class if specified (supports multiple DB values per category)
  const assetFilteredCompanies = assetClassConfig && assetClassConfig.dbValues.length > 0
    ? companies.filter(c => c.asset_type && assetClassConfig.dbValues.includes(c.asset_type))
    : companies;

  // Filter by search query
  const filteredCompanies = assetFilteredCompanies.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(query) ||
      (c.ticker && c.ticker.toLowerCase().includes(query))
    );
  });

  // Status order: active → research → monitoring → on_hold → exited
  const STATUS_ORDER = ['working_on_it', 'research', 'monitoring', 'on_hold', 'done'];

  // Group companies by status
  const groupedCompanies = STATUS_ORDER.map(status => ({
    status,
    companies: filteredCompanies.filter(c => c.status === status),
  })).filter(group => group.companies.length > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            to="/analysis" 
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{pageTitle}</h2>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Company</span>
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Companies Table */}
      {groupedCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">No companies yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {assetClassConfig && assetClassConfig.dbValues.length > 0
              ? `Add your first ${assetClassConfig.label.toLowerCase()} company.`
              : 'Add your first company to start tracking investments.'}
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
            <Plus size={16} />
            Add Company
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Desktop Table */}
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold w-[30%]">Company Name</TableHead>
                <TableHead className="font-semibold w-[10%]">Ticker</TableHead>
                <TableHead className="font-semibold w-[15%]">Sector</TableHead>
                <TableHead className="font-semibold w-[12%]">Conviction</TableHead>
                <TableHead className="font-semibold w-[13%]">Market Cap</TableHead>
                <TableHead className="font-semibold w-[15%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedCompanies.map((group, groupIndex) => {
                const config = STATUS_CONFIG[group.status];
                return (
                  <React.Fragment key={group.status}>
                    <TableRow className="hover:bg-transparent bg-muted/10">
                      <TableCell 
                        colSpan={6} 
                        className={`py-2 border-t-2 ${groupIndex === 0 ? 'border-t-0' : ''} border-border/50`}
                      >
                        <div className={`inline-flex items-center gap-2 ${config?.text || 'text-muted-foreground'}`}>
                          {config?.icon}
                          <span className="text-xs font-semibold uppercase tracking-wider">
                            {config?.label || group.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({group.companies.length})
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.companies.map(company => {
                      const convictionConfig = CONVICTION_CONFIG[company.confidence_level || 'core'];
                      return (
                        <TableRow
                          key={company.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/analysis/company/${company.id}`)}
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
                          <TableCell className="text-sm text-muted-foreground">
                            {company.sector || '—'}
                          </TableCell>
                          <TableCell>
                            {convictionConfig ? (
                              <span className={`text-xs px-2 py-0.5 rounded ${convictionConfig.color}`}>
                                {convictionConfig.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {company.market_cap || '—'}
                          </TableCell>
                          <TableCell>
                            {config ? (
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${config.bg} ${config.text}`}>
                                {config.icon}
                                <span className="text-sm font-medium">{config.label}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {company.status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-border">
            {groupedCompanies.map((group, groupIndex) => {
              const config = STATUS_CONFIG[group.status];
              return (
                <React.Fragment key={group.status}>
                  <div className={`px-3 py-2 bg-muted/10 ${groupIndex > 0 ? 'border-t-2 border-border/50' : ''}`}>
                    <div className={`inline-flex items-center gap-2 ${config?.text || 'text-muted-foreground'}`}>
                      {config?.icon}
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {config?.label || group.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({group.companies.length})
                      </span>
                    </div>
                  </div>
                  {group.companies.map(company => {
                    const convictionConfig = CONVICTION_CONFIG[company.confidence_level || 'core'];
                    return (
                      <div
                        key={company.id}
                        className="px-3 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors"
                        onClick={() => navigate(`/analysis/company/${company.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{company.company_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {company.ticker && (
                              <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                                {company.ticker}
                              </span>
                            )}
                            {company.sector && (
                              <span className="text-[11px] text-muted-foreground truncate">{company.sector}</span>
                            )}
                          </div>
                        </div>
                        {convictionConfig && (
                          <span className={`text-[11px] px-2 py-0.5 rounded whitespace-nowrap ${convictionConfig.color}`}>
                            {convictionConfig.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={e => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newCompanyName.trim()) handleCreate();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-type">Asset Class</Label>
              <Select 
                value={newAssetType} 
                onValueChange={setNewAssetType}
              >
                <SelectTrigger id="asset-type">
                  <SelectValue placeholder="Select asset class" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
