import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Edit2, Plus, Trash2, 
  TrendingUp, AlertTriangle, Target, Clock, DollarSign,
  MapPin, Briefcase, FileText, CheckSquare, Save, X,
  LineChart, Receipt, BarChart3
} from 'lucide-react';
import { CompanyValueChart } from '@/components/crm/CompanyValueChart';
import { DecisionLogSection, Decision, DECISION_TYPE_OPTIONS } from '@/components/crm/DecisionLogSection';
import { CompanyFilesSection } from '@/components/crm/CompanyFilesSection';
import { CompanyActivityLog } from '@/components/crm/CompanyActivityLog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface Company {
  id: string;
  company_name: string;
  ticker: string | null;
  market_cap: string | null;
  sector: string | null;
  geography: string | null;
  status: string;
  notes: string | null;
  investment_thesis: string | null;
  thesis_summary: string | null;
  confidence_level: string | null;
  why_we_own: string | null;
  time_horizon: string | null;
  valuation_logic: string | null;
  exit_criteria: string | null;
  key_risks: string | null;
  business_description: string | null;
  updated_at: string;
  created_at: string;
}

// Decision interface imported from DecisionLogSection

interface Task {
  id: string;
  task_name: string;
  status: string;
  urgency: string;
  due_date: string | null;
}

const CONVICTION_OPTIONS = [
  { value: 'speculative', label: 'Speculative', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  { value: 'low', label: 'Low Conviction', color: 'bg-amber-400/20 text-amber-300 border-amber-400/30' },
  { value: 'core', label: 'Core', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'high', label: 'High Conviction', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'top', label: 'Top Conviction', color: 'bg-green-400/20 text-green-300 border-green-400/30' },
];

const STATUS_OPTIONS = [
  { value: 'research', label: 'Research' },
  { value: 'working_on_it', label: 'Active' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'done', label: 'Exited' },
  { value: 'stuck', label: 'On Hold' },
];

// DECISION_TYPES imported from DecisionLogSection as DECISION_TYPE_OPTIONS

export default function CompanyPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transactions, valuations } = usePortfolio();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Decision state managed by DecisionLogSection

  // Task dialog
  const [taskOpen, setTaskOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Filter transactions and valuations for this company
  const companyTransactions = useMemo(() => {
    if (!company?.ticker) return [];
    const ticker = company.ticker.toUpperCase();
    return transactions
      .filter(tx => tx.ticker.toUpperCase() === ticker)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [company?.ticker, transactions]);

  const companyValuations = useMemo(() => {
    if (!company?.ticker) return [];
    const ticker = company.ticker.toUpperCase();
    return valuations
      .filter(v => v.ticker.toUpperCase() === ticker)
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [company?.ticker, valuations]);

  // Calculate P&L metrics
  const positionMetrics = useMemo(() => {
    if (!company?.ticker) return null;
    const ticker = company.ticker.toUpperCase();
    
    const sortedTxs = [...transactions]
      .filter(tx => tx.ticker.toUpperCase() === ticker)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (sortedTxs.length === 0) return null;

    // Track cost basis using FIFO
    const costBasisQueue: { qty: number; price: number }[] = [];
    let realizedPL = 0;
    let totalBuyCost = 0;
    let totalBuyQty = 0;
    
    sortedTxs.forEach(tx => {
      if (tx.transactionType === 'buy') {
        costBasisQueue.push({ qty: tx.quantity, price: tx.pricePerUnit + (tx.fees || 0) / tx.quantity });
        totalBuyCost += tx.quantity * tx.pricePerUnit + (tx.fees || 0);
        totalBuyQty += tx.quantity;
      } else {
        // Sell - calculate realized P&L using FIFO
        let remainingToSell = tx.quantity;
        const sellPrice = tx.pricePerUnit;
        const sellFees = tx.fees || 0;
        
        while (remainingToSell > 0 && costBasisQueue.length > 0) {
          const oldest = costBasisQueue[0];
          const sellQty = Math.min(remainingToSell, oldest.qty);
          
          // Realized gain = (sell price - cost basis) * qty - proportional fees
          const costBasis = oldest.price * sellQty;
          const sellProceeds = sellPrice * sellQty - (sellFees * sellQty / tx.quantity);
          realizedPL += sellProceeds - costBasis;
          
          oldest.qty -= sellQty;
          remainingToSell -= sellQty;
          
          if (oldest.qty <= 0) {
            costBasisQueue.shift();
          }
        }
      }
    });

    // Current position
    const currentQty = costBasisQueue.reduce((sum, lot) => sum + lot.qty, 0);
    const remainingCost = costBasisQueue.reduce((sum, lot) => sum + lot.qty * lot.price, 0);
    const avgCostPerShare = currentQty > 0 ? remainingCost / currentQty : 0;

    // Get latest price
    const latestVal = valuations
      .filter(v => v.ticker.toUpperCase() === ticker)
      .sort((a, b) => b.month.localeCompare(a.month))[0];

    const currentPrice = latestVal?.pricePerUnit;
    const currentValue = currentPrice && currentQty > 0 ? currentQty * currentPrice : null;
    
    // Calculate unrealized P&L
    const unrealizedPL = currentValue !== null ? currentValue - remainingCost : null;
    const unrealizedPLPercent = unrealizedPL !== null && remainingCost > 0 
      ? (unrealizedPL / remainingCost) * 100 
      : null;

    // Total P&L
    const totalPL = realizedPL + (unrealizedPL || 0);
    const totalPLPercent = totalBuyCost > 0 ? (totalPL / totalBuyCost) * 100 : null;

    // Check if position is fully closed
    const isClosedPosition = currentQty === 0 && realizedPL !== 0;

    return {
      quantity: currentQty,
      avgCostPerShare,
      totalCost: remainingCost,
      currentPrice,
      currentValue,
      unrealizedPL,
      unrealizedPLPercent,
      realizedPL,
      totalPL,
      totalPLPercent,
      totalBuyCost,
      isClosedPosition,
      latestValuationMonth: latestVal?.month,
    };
  }, [company?.ticker, transactions, valuations]);

  // For backward compatibility
  const currentValue = positionMetrics?.currentValue ?? null;

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId || !user) return;

      const [companyRes, decisionsRes, tasksRes] = await Promise.all([
        supabase
          .from('crm_companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle(),
        supabase
          .from('company_decisions')
          .select('*')
          .eq('company_id', companyId)
          .order('decision_date', { ascending: false }),
        supabase
          .from('crm_tasks')
          .select('id, task_name, status, urgency, due_date')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
      ]);

      if (companyRes.error || !companyRes.data) {
        toast.error('Company not found');
        navigate('/backoffice');
        return;
      }

      setCompany(companyRes.data as Company);
      setDecisions((decisionsRes.data as Decision[]) || []);
      setTasks((tasksRes.data as Task[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [companyId, user, navigate]);

  const handleUpdate = async (field: keyof Company, value: string | null) => {
    if (!company || !user) return;

    const oldValue = company[field];
    setSaving(true);
    const { error } = await supabase
      .from('crm_companies')
      .update({ [field]: value })
      .eq('id', company.id);

    if (error) {
      toast.error('Failed to update');
      console.error(error);
    } else {
      setCompany(prev => prev ? { ...prev, [field]: value, updated_at: new Date().toISOString() } : null);
      
      // Log status changes to company_decisions as a special "status_change" type
      if (field === 'status' && oldValue !== value) {
        const oldLabel = STATUS_OPTIONS.find(o => o.value === oldValue)?.label || oldValue;
        const newLabel = STATUS_OPTIONS.find(o => o.value === value)?.label || value;
        
        await supabase.from('company_decisions').insert({
          user_id: user.id,
          company_id: company.id,
          decision_type: 'status_change',
          rationale: `Status changed from "${oldLabel}" to "${newLabel}"`,
          decision_date: new Date().toISOString().split('T')[0],
        });
      }
    }
    setSaving(false);
    setEditMode(null);
  };

  const handleDelete = async () => {
    if (!company) return;

    const { error } = await supabase
      .from('crm_companies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', company.id);

    if (error) {
      toast.error('Failed to delete company');
      return;
    }

    toast.success('Company deleted');
    navigate('/backoffice');
  };

  // handleAddDecision and handleDeleteDecision moved to DecisionLogSection

  const handleAddTask = async () => {
    if (!company || !user || !newTaskName.trim()) return;

    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        user_id: user.id,
        company_id: company.id,
        task_name: newTaskName.trim(),
        status: 'in_progress',
        urgency: 'medium',
        due_date: newTaskDueDate || null,
      })
      .select('id, task_name, status, urgency, due_date')
      .single();

    if (error) {
      toast.error('Failed to create task');
      console.error(error);
      return;
    }

    setTasks(prev => [data as Task, ...prev]);
    setTaskOpen(false);
    setNewTaskName('');
    setNewTaskDueDate('');
    toast.success('Task created');
  };

  const handleUnlinkTask = async (taskId: string) => {
    const { error } = await supabase
      .from('crm_tasks')
      .update({ company_id: null })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to unlink task');
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Task unlinked');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getConvictionColor = (level: string | null) => {
    const opt = CONVICTION_OPTIONS.find(o => o.value === level);
    return opt?.color || 'bg-orange-500/20 text-orange-400 border-orange-500/30'; // Default to Core color
  };

  const startEdit = (field: string, value: string | null) => {
    setEditMode(field);
    setEditValue(value || '');
  };

  const saveEdit = (field: keyof Company) => {
    handleUpdate(field, editValue || null);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditValue('');
  };

  if (loading || !company) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/backoffice')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{company.company_name}</h1>
            {company.ticker && (
              <span className="font-mono text-sm text-muted-foreground">
                {company.ticker}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CompanyActivityLog companyId={company.id} companyName={company.company_name} />
          <Select
            value={company.status}
            onValueChange={v => handleUpdate('status', v)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="destructive" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp size={18} className="text-primary" />
              Executive Summary
            </CardTitle>
            <Select
              value={company.confidence_level || 'core'}
              onValueChange={v => handleUpdate('confidence_level', v)}
            >
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0 w-auto">
                <Badge variant="outline" className={`${getConvictionColor(company.confidence_level)} cursor-pointer hover:brightness-110 transition-all`}>
                  {CONVICTION_OPTIONS.find(o => o.value === company.confidence_level)?.label || 'Core'}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {CONVICTION_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Snapshot */}
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Snapshot</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Market Cap */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Market Cap</label>
                {editMode === 'market_cap' ? (
                  <div className="flex gap-1">
                    <Input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      placeholder="e.g., $50B"
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit('market_cap')}><Save size={12} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}><X size={12} /></Button>
                  </div>
                ) : (
                  <p 
                    className="text-sm font-medium cursor-pointer hover:bg-muted/50 p-1 rounded -mx-1"
                    onClick={() => startEdit('market_cap', company.market_cap)}
                  >
                    {company.market_cap || '—'}
                  </p>
                )}
              </div>

              {/* Sector */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Briefcase size={10} /> Sector
                </label>
                {editMode === 'sector' ? (
                  <div className="flex gap-1">
                    <Input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit('sector')}><Save size={12} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}><X size={12} /></Button>
                  </div>
                ) : (
                  <p 
                    className="text-sm font-medium cursor-pointer hover:bg-muted/50 p-1 rounded -mx-1"
                    onClick={() => startEdit('sector', company.sector)}
                  >
                    {company.sector || '—'}
                  </p>
                )}
              </div>

              {/* Geography */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={10} /> Geography
                </label>
                {editMode === 'geography' ? (
                  <div className="flex gap-1">
                    <Input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit('geography')}><Save size={12} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}><X size={12} /></Button>
                  </div>
                ) : (
                  <p 
                    className="text-sm font-medium cursor-pointer hover:bg-muted/50 p-1 rounded -mx-1"
                    onClick={() => startEdit('geography', company.geography)}
                  >
                    {company.geography || '—'}
                  </p>
                )}
              </div>

              {/* Ticker */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Ticker</label>
                {editMode === 'ticker' ? (
                  <div className="flex gap-1">
                    <Input
                      value={editValue}
                      onChange={e => setEditValue(e.target.value.toUpperCase())}
                      className="h-7 text-sm font-mono"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit('ticker')}><Save size={12} /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}><X size={12} /></Button>
                  </div>
                ) : (
                  <p 
                    className="text-sm font-mono cursor-pointer hover:bg-muted/50 p-1 rounded -mx-1"
                    onClick={() => startEdit('ticker', company.ticker)}
                  >
                    {company.ticker || '—'}
                  </p>
                )}
              </div>
            </div>

            {/* Business Description */}
            <div className="mt-3 space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Business Description</label>
              {editMode === 'business_description' ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit('business_description')}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-sm cursor-pointer hover:bg-muted/50 p-1 rounded -mx-1 line-clamp-2"
                  onClick={() => startEdit('business_description', company.business_description)}
                >
                  {company.business_description || <span className="text-muted-foreground italic">Click to add...</span>}
                </p>
              )}
            </div>
          </div>

          {/* P&L Summary */}
          {positionMetrics && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {positionMetrics.isClosedPosition ? 'Closed Position P&L' : 'Position P&L'}
                </h4>
                {!positionMetrics.isClosedPosition && currentValue !== null && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="text-lg font-semibold font-mono text-primary">{formatCurrency(currentValue)}</p>
                  </div>
                )}
              </div>
              
              {/* Position details - only show for open positions */}
              {!positionMetrics.isClosedPosition && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Shares Held</p>
                      <p className="font-mono font-semibold">{positionMetrics.quantity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Cost</p>
                      <p className="font-mono font-semibold">${positionMetrics.avgCostPerShare.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Price</p>
                      <p className="font-mono font-semibold">
                        {positionMetrics.currentPrice ? `$${positionMetrics.currentPrice.toLocaleString()}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cost Basis</p>
                      <p className="font-mono font-semibold">{formatCurrency(positionMetrics.totalCost)}</p>
                    </div>
                  </div>
                  <Separator className="my-3" />
                </>
              )}

              {/* P&L breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Realized P&L */}
                <div>
                  <p className="text-xs text-muted-foreground">Realized P&L</p>
                  <p className={`text-lg font-mono font-bold ${positionMetrics.realizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {positionMetrics.realizedPL >= 0 ? '+' : ''}{formatCurrency(positionMetrics.realizedPL)}
                  </p>
                </div>

                {/* Unrealized P&L - only for open positions */}
                {!positionMetrics.isClosedPosition && (
                  <div>
                    <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                    {positionMetrics.unrealizedPL !== null ? (
                      <p className={`text-lg font-mono font-bold ${positionMetrics.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {positionMetrics.unrealizedPL >= 0 ? '+' : ''}{formatCurrency(positionMetrics.unrealizedPL)}
                      </p>
                    ) : (
                      <p className="text-lg font-mono text-muted-foreground">—</p>
                    )}
                  </div>
                )}

                {/* Total P&L */}
                <div>
                  <p className="text-xs text-muted-foreground">Total P&L</p>
                  <p className={`text-lg font-mono font-bold ${positionMetrics.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {positionMetrics.totalPL >= 0 ? '+' : ''}{formatCurrency(positionMetrics.totalPL)}
                  </p>
                </div>

                {/* Total Return % */}
                <div>
                  <p className="text-xs text-muted-foreground">Total Return</p>
                  {positionMetrics.totalPLPercent !== null ? (
                    <p className={`text-lg font-mono font-bold ${positionMetrics.totalPLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positionMetrics.totalPLPercent >= 0 ? '+' : ''}{positionMetrics.totalPLPercent.toFixed(2)}%
                    </p>
                  ) : (
                    <p className="text-lg font-mono text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>Total invested: {formatCurrency(positionMetrics.totalBuyCost)}</span>
                {positionMetrics.latestValuationMonth && !positionMetrics.isClosedPosition && (
                  <span>Valuation: {format(new Date(positionMetrics.latestValuationMonth + '-01'), 'MMM yyyy')}</span>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Last updated: {format(new Date(company.updated_at), 'MMM d, yyyy h:mm a')}
          </p>
        </CardContent>
      </Card>

      {/* Investment Thesis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target size={18} className="text-primary" />
            Investment Thesis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Why We Own */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <DollarSign size={12} /> Why We Own It
              </label>
              {editMode === 'why_we_own' ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit('why_we_own')}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2 min-h-[60px] whitespace-pre-wrap"
                  onClick={() => startEdit('why_we_own', company.why_we_own)}
                >
                  {company.why_we_own || <span className="text-muted-foreground italic">Click to add...</span>}
                </p>
              )}
            </div>

            {/* Time Horizon */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} /> Time Horizon
              </label>
              {editMode === 'time_horizon' ? (
                <div className="flex gap-2">
                  <Input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    placeholder="e.g., 2-3 years"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={() => saveEdit('time_horizon')}><Save size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={cancelEdit}><X size={14} /></Button>
                </div>
              ) : (
                <p 
                  className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                  onClick={() => startEdit('time_horizon', company.time_horizon)}
                >
                  {company.time_horizon || <span className="text-muted-foreground italic">Click to add...</span>}
                </p>
              )}
            </div>

            {/* Valuation Logic */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp size={12} /> Valuation Logic
              </label>
              {editMode === 'valuation_logic' ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit('valuation_logic')}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2 min-h-[60px] whitespace-pre-wrap"
                  onClick={() => startEdit('valuation_logic', company.valuation_logic)}
                >
                  {company.valuation_logic || <span className="text-muted-foreground italic">Click to add...</span>}
                </p>
              )}
            </div>

            {/* Exit Criteria */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Target size={12} /> Exit Criteria
              </label>
              {editMode === 'exit_criteria' ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit('exit_criteria')}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2 min-h-[60px] whitespace-pre-wrap"
                  onClick={() => startEdit('exit_criteria', company.exit_criteria)}
                >
                  {company.exit_criteria || <span className="text-muted-foreground italic">Click to add...</span>}
                </p>
              )}
            </div>

            {/* Key Risks */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} /> Key Risks
              </label>
              {editMode === 'key_risks' ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit('key_risks')}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className="text-sm cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2 whitespace-pre-wrap"
                  onClick={() => startEdit('key_risks', company.key_risks)}
                >
                  {company.key_risks || <span className="text-muted-foreground italic">Click to add...</span>}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Position Value Chart */}
      {company.ticker && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart size={18} className="text-primary" />
                Position Value
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Based on {companyValuations.length} valuations
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CompanyValueChart
              transactions={transactions}
              valuations={valuations}
              ticker={company.ticker}
            />
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt size={18} className="text-primary" />
              Transactions
            </CardTitle>
            <Link to="/transactions">
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                View All →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!company.ticker ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add a ticker to sync transactions
            </p>
          ) : companyTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions for {company.ticker}
            </p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {companyTransactions.slice(0, 10).map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={tx.transactionType === 'buy' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }
                    >
                      {tx.transactionType.toUpperCase()}
                    </Badge>
                    <span>{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{tx.quantity.toLocaleString()} × ${tx.pricePerUnit.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(tx.quantity * tx.pricePerUnit).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {companyTransactions.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{companyTransactions.length - 10} more transactions
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valuations */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 size={18} className="text-primary" />
              Valuations
            </CardTitle>
            <Link to="/valuations">
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                View All →
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!company.ticker ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add a ticker to sync valuations
            </p>
          ) : companyValuations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No valuations for {company.ticker}
            </p>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {companyValuations.slice(0, 10).map(val => (
                <div key={val.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                  <span>{format(new Date(val.month + '-01'), 'MMMM yyyy')}</span>
                  <span className="font-mono">${val.pricePerUnit.toLocaleString()}</span>
                </div>
              ))}
              {companyValuations.length > 10 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{companyValuations.length - 10} more valuations
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Decision Log */}
      <DecisionLogSection
        companyId={company.id}
        companyTicker={company.ticker}
        decisions={decisions}
        onDecisionsChange={setDecisions}
      />

      {/* Files */}
      <CompanyFilesSection companyId={company.id} />

      {/* Linked Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare size={18} className="text-primary" />
              Linked Tasks
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)} className="gap-1">
              <Plus size={14} />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">
                No tasks linked to this company
              </p>
              <Button size="sm" variant="secondary" onClick={() => setTaskOpen(true)} className="gap-1">
                <Plus size={14} />
                Create First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-muted/30 rounded group">
                  <span className="text-sm">{task.task_name}</span>
                  <div className="flex items-center gap-2">
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {task.status.replace(/_/g, ' ')}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6"
                      onClick={() => handleUnlinkTask(task.id)}
                      title="Unlink task"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move "{company.company_name}" to trash.
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

      {/* Decision Dialog handled by DecisionLogSection */}

      {/* Task Dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task for {company.company_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Name</label>
              <Input
                value={newTaskName}
                onChange={e => setNewTaskName(e.target.value)}
                placeholder="e.g., Review Q3 earnings"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && newTaskName.trim()) handleAddTask();
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date (optional)</label>
              <Input
                type="date"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTask} disabled={!newTaskName.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
