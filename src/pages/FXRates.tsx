import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePortfolio } from '@/context/PortfolioContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Banknote, Pencil, Trash2, Loader2, RefreshCw, Calendar, Repeat, CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getSupportedCurrencies, getDefaultFxRate, FxRate } from '@/lib/fxService';
import { CashCurrency } from '@/types/investment';
import { MonthlyFxRatesForm } from '@/components/fx/MonthlyFxRatesForm';

const CURRENCY_SYMBOLS: Record<CashCurrency, string> = {
  USD: '$', EUR: '€', ILS: '₪', GBP: '£', CHF: 'Fr', JPY: '¥'
};

const CURRENCY_NAMES: Record<CashCurrency, string> = {
  USD: 'US Dollar', EUR: 'Euro', ILS: 'Israeli Shekel',
  GBP: 'British Pound', CHF: 'Swiss Franc', JPY: 'Japanese Yen'
};

const AUTO_PAIRS = ['USD/EUR', 'USD/ILS', 'USD/GBP', 'USD/CHF', 'USD/JPY'];

interface FxRateFormData {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  rateDate: string;
  source: string;
}

const initialFormData: FxRateFormData = {
  fromCurrency: 'USD', toCurrency: 'ILS', rate: '',
  rateDate: new Date().toISOString().split('T')[0], source: 'manual',
};

interface AutoRate {
  pair: string;
  rate: number;
  updatedAt: string;
}

export default function FXRates() {
  const { user } = useAuth();
  const { cashBalances, convertCurrency, refreshFxRates } = usePortfolio();
  const [rates, setRates] = useState<FxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<FxRate | null>(null);
  const [formData, setFormData] = useState<FxRateFormData>(initialFormData);

  // Auto FX state
  const [autoRates, setAutoRates] = useState<AutoRate[]>([]);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<'ok' | 'partial' | 'error' | 'idle'>('idle');
  const [isFetching, setIsFetching] = useState(false);
  const [recentAutoUpdates, setRecentAutoUpdates] = useState<any[]>([]);

  // Currency conversion state
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertFrom, setConvertFrom] = useState<CashCurrency>('USD');
  const [convertTo, setConvertTo] = useState<CashCurrency>('ILS');
  const [convertAmount, setConvertAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const currencies = getSupportedCurrencies();

  // Fetch all manual FX rates
  const fetchRates = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('*')
        .eq('user_id', user.id)
        .order('rate_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      setRates(
        (data || []).map((r: any) => ({
          id: r.id, userId: r.user_id, fromCurrency: r.from_currency,
          toCurrency: r.to_currency, rate: Number(r.rate),
          rateDate: r.rate_date, source: r.source || 'manual', createdAt: r.created_at,
        }))
      );
    } catch (error: any) {
      console.error('Error loading FX rates:', error);
      toast.error(error?.message || 'Failed to load FX rates');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch latest auto rates (system + user)
  const fetchAutoRates = async () => {
    if (!user) return;
    try {
      // Get latest rate per pair - both system (null user_id) and user-specific
      const results: AutoRate[] = [];
      const recentRows: any[] = [];

      for (const pair of AUTO_PAIRS) {
        const [from, to] = pair.split('/');
        
        // Try user-specific first, then system
        const { data } = await supabase
          .from('fx_rates')
          .select('*')
          .eq('from_currency', from)
          .eq('to_currency', to)
          .eq('source', 'auto')
          .order('rate_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          const row = data[0] as any;
          results.push({
            pair,
            rate: Number(row.rate),
            updatedAt: row.created_at,
          });
        }
      }

      // Get recent 10 auto updates
      const { data: recent } = await supabase
        .from('fx_rates')
        .select('*')
        .eq('source', 'auto')
        .order('created_at', { ascending: false })
        .limit(10);

      setAutoRates(results);
      setRecentAutoUpdates(recent || []);

      if (results.length > 0) {
        const latest = results.reduce((a, b) => 
          new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
        );
        setLastFetchedAt(latest.updatedAt);
        setFetchStatus(results.length === AUTO_PAIRS.length ? 'ok' : 'partial');
      }
    } catch (err) {
      console.error('[FXRates] Failed to fetch auto rates:', err);
      setFetchStatus('error');
    }
  };

  useEffect(() => {
    fetchRates();
    fetchAutoRates();
  }, [user]);

  // Manual fetch now
  const handleFetchNow = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-fx-rates', {
        body: {},
      });
      
      if (error) throw error;

      if (data?.status === 'ok') {
        toast.success(`All ${data.savedCount} FX rates updated`);
        setFetchStatus('ok');
      } else if (data?.status === 'partial') {
        toast.warning(`${data.savedCount} rates updated, some failed`);
        setFetchStatus('partial');
      } else {
        toast.error('Failed to fetch FX rates');
        setFetchStatus('error');
      }

      setLastFetchedAt(data?.fetchedAt || new Date().toISOString());
      await fetchAutoRates();
      await fetchRates();
      await refreshFxRates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch FX rates');
      setFetchStatus('error');
    } finally {
      setIsFetching(false);
    }
  };

  // Convert currency handlers
  const handleExchangeRateChange = (value: string) => {
    setExchangeRate(value);
    const rate = parseFloat(value);
    const amount = parseFloat(convertAmount);
    if (!isNaN(rate) && rate > 0 && !isNaN(amount) && amount > 0) {
      setReceivedAmount((amount * rate).toFixed(2));
    }
  };

  const handleConvertAmountChange = (value: string) => {
    setConvertAmount(value);
    const rate = parseFloat(exchangeRate);
    const amount = parseFloat(value);
    if (!isNaN(rate) && rate > 0 && !isNaN(amount) && amount > 0) {
      setReceivedAmount((amount * rate).toFixed(2));
    }
  };

  const handleReceivedAmountChange = (value: string) => {
    setReceivedAmount(value);
    const received = parseFloat(value);
    const amount = parseFloat(convertAmount);
    if (!isNaN(received) && received > 0 && !isNaN(amount) && amount > 0) {
      setExchangeRate((received / amount).toFixed(4));
    }
  };

  const impliedRate = useMemo(() => {
    const from = parseFloat(convertAmount);
    const to = parseFloat(receivedAmount);
    if (!isNaN(from) && from > 0 && !isNaN(to) && to > 0) return to / from;
    return null;
  }, [convertAmount, receivedAmount]);

  const handleConvertCurrency = async () => {
    const fromAmt = parseFloat(convertAmount);
    const toAmt = parseFloat(receivedAmount);
    if (isNaN(fromAmt) || fromAmt <= 0) { toast.error('Enter a valid amount to convert'); return; }
    if (isNaN(toAmt) || toAmt <= 0) { toast.error('Enter a valid received amount'); return; }
    if (convertFrom === convertTo) { toast.error('Currencies must be different'); return; }
    if (cashBalances[convertFrom] < fromAmt) { toast.error(`Insufficient ${convertFrom} balance`); return; }
    setIsConverting(true);
    try {
      const success = await convertCurrency(convertFrom, convertTo, fromAmt, toAmt);
      if (success) {
        toast.success(`Converted ${CURRENCY_SYMBOLS[convertFrom]}${fromAmt.toLocaleString()} to ${CURRENCY_SYMBOLS[convertTo]}${toAmt.toLocaleString()}`);
        setIsConvertDialogOpen(false);
        setConvertAmount(''); setReceivedAmount(''); setExchangeRate('');
      } else { toast.error('Conversion failed'); }
    } catch (err: any) { toast.error(err.message || 'Conversion failed'); }
    finally { setIsConverting(false); }
  };

  // Manual rate CRUD
  const handleOpenDialog = (rate?: FxRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({ fromCurrency: rate.fromCurrency, toCurrency: rate.toCurrency,
        rate: rate.rate.toString(), rateDate: rate.rateDate, source: rate.source });
    } else {
      setEditingRate(null); setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => { setIsDialogOpen(false); setEditingRate(null); setFormData(initialFormData); };

  const handleSubmit = async () => {
    if (!user) return;
    if (!formData.fromCurrency || !formData.toCurrency) { toast.error('Please select both currencies'); return; }
    if (formData.fromCurrency === formData.toCurrency) { toast.error('Currencies must be different'); return; }
    const rateNum = parseFloat(formData.rate);
    if (isNaN(rateNum) || rateNum <= 0) { toast.error('Please enter a valid positive rate'); return; }
    if (!formData.rateDate) { toast.error('Please select a date'); return; }

    setIsSaving(true);
    try {
      if (editingRate) {
        const { error } = await supabase.from('fx_rates').update({
          from_currency: formData.fromCurrency, to_currency: formData.toCurrency,
          rate: rateNum, rate_date: formData.rateDate, source: formData.source || 'manual',
        }).eq('id', editingRate.id);
        if (error) throw error;
        toast.success('FX rate updated');
      } else {
        const rateMonth = formData.rateDate.slice(0, 7);
        const { data: existingRates } = await supabase.from('fx_rates').select('id, rate_date')
          .eq('user_id', user.id).eq('from_currency', formData.fromCurrency)
          .eq('to_currency', formData.toCurrency)
          .gte('rate_date', `${rateMonth}-01`).lte('rate_date', `${rateMonth}-31`);

        if (existingRates && existingRates.length > 0) {
          const { error } = await supabase.from('fx_rates').update({
            rate: rateNum, rate_date: formData.rateDate, source: formData.source || 'manual',
          }).eq('id', existingRates[0].id);
          if (error) throw error;
          toast.success('FX rate updated (same month)');
        } else {
          const { error } = await supabase.from('fx_rates').insert({
            user_id: user.id, from_currency: formData.fromCurrency,
            to_currency: formData.toCurrency, rate: rateNum,
            rate_date: formData.rateDate, source: formData.source || 'manual',
          });
          if (error) throw error;
          toast.success('FX rate added');
        }
      }
      handleCloseDialog(); fetchRates();
    } catch (error: any) { toast.error(error.message || 'Failed to save FX rate'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('fx_rates').delete().eq('id', id);
      if (error) throw error;
      toast.success('FX rate deleted'); fetchRates();
    } catch (error: any) { toast.error(error.message || 'Failed to delete FX rate'); }
  };

  const handleFillDefault = () => {
    const defaultRate = getDefaultFxRate(formData.fromCurrency, formData.toCurrency);
    setFormData((prev) => ({ ...prev, rate: defaultRate.toFixed(4) }));
  };

  const groupedByPair = rates.reduce((acc, rate) => {
    const key = `${rate.fromCurrency}/${rate.toCurrency}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rate);
    return acc;
  }, {} as Record<string, FxRate[]>);

  const handleFxRatesSaved = async () => { await fetchRates(); await refreshFxRates(); };

  const StatusIcon = () => {
    switch (fetchStatus) {
      case 'ok': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusLabel = fetchStatus === 'ok' ? 'OK' : fetchStatus === 'partial' ? 'Partial' : fetchStatus === 'error' ? 'Error' : 'Idle';

  return (
    <div className="section-spacing animate-fade-in">
      {/* Monthly FX Rates Quick Entry */}
      <div className="mb-6">
        <MonthlyFxRatesForm onRatesSaved={handleFxRatesSaved} />
      </div>

      {/* Header with status & fetch button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
            <Banknote className="h-6 w-6" />
            FX Rates
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground text-sm font-mono">
              Manage exchange rates for portfolio valuation
            </p>
            <div className="flex items-center gap-1.5">
              <StatusIcon />
              <Badge variant={fetchStatus === 'ok' ? 'default' : fetchStatus === 'partial' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
                {statusLabel}
              </Badge>
            </div>
            {lastFetchedAt && (
              <span className="text-[10px] text-muted-foreground font-mono">
                Last: {format(new Date(lastFetchedAt), 'MMM d, HH:mm')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleFetchNow} 
            disabled={isFetching}
            className="border-primary/30 hover:border-primary"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Fetch FX Now
          </Button>
          <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-primary">
                <Repeat className="h-4 w-4 mr-2" />
                Convert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Repeat className="h-5 w-5 text-primary" />
                  Convert Currency
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Select value={convertFrom} onValueChange={(v) => setConvertFrom(v as CashCurrency)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CURRENCY_NAMES) as CashCurrency[]).map((cur) => (
                          <SelectItem key={cur} value={cur}>{cur} - {CURRENCY_NAMES[cur]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Balance: {CURRENCY_SYMBOLS[convertFrom]}{cashBalances[convertFrom].toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Select value={convertTo} onValueChange={(v) => setConvertTo(v as CashCurrency)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CURRENCY_NAMES) as CashCurrency[]).map((cur) => (
                          <SelectItem key={cur} value={cur}>{cur} - {CURRENCY_NAMES[cur]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Balance: {CURRENCY_SYMBOLS[convertTo]}{cashBalances[convertTo].toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Amount to Convert ({convertFrom})</Label>
                  <Input type="number" step="0.01" min="0" value={convertAmount}
                    onChange={(e) => handleConvertAmountChange(e.target.value)} placeholder={`Amount in ${convertFrom}`} />
                </div>
                <div className="space-y-2">
                  <Label>Exchange Rate</Label>
                  <Input type="number" step="0.0001" min="0" value={exchangeRate}
                    onChange={(e) => handleExchangeRateChange(e.target.value)} placeholder={`1 ${convertFrom} = ? ${convertTo}`} />
                  <p className="text-xs text-muted-foreground">Enter the rate at which the conversion was executed</p>
                </div>
                <div className="space-y-2">
                  <Label>Amount Received ({convertTo})</Label>
                  <Input type="number" step="0.01" min="0" value={receivedAmount}
                    onChange={(e) => handleReceivedAmountChange(e.target.value)} placeholder={`Amount in ${convertTo}`} />
                </div>
                {impliedRate && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground">Final Rate</p>
                    <p className="text-lg font-mono font-medium text-primary">1 {convertFrom} = {impliedRate.toFixed(4)} {convertTo}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConvertCurrency} disabled={isConverting || convertFrom === convertTo}>
                  {isConverting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Convert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Live Auto Rates Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
        {AUTO_PAIRS.map((pair) => {
          const autoRate = autoRates.find((r) => r.pair === pair);
          return (
            <Card key={pair} className="relative">
              <CardContent className="pt-4 pb-3">
                <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">{pair}</div>
                <div className="text-xl font-bold font-mono text-primary tabular-nums">
                  {autoRate ? autoRate.rate.toFixed(4) : '—'}
                </div>
                {autoRate && (
                  <div className="text-[9px] text-muted-foreground font-mono mt-1">
                    Updated {format(new Date(autoRate.updatedAt), 'HH:mm')}
                  </div>
                )}
                {!autoRate && (
                  <div className="text-[9px] text-muted-foreground mt-1">No auto data</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{rates.length}</div>
            <div className="text-xs text-muted-foreground">Total Rates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{Object.keys(groupedByPair).length}</div>
            <div className="text-xs text-muted-foreground">Currency Pairs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{currencies.length}</div>
            <div className="text-xs text-muted-foreground">Supported Currencies</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {rates.length > 0 ? format(new Date(rates[0]?.rateDate || new Date()), 'MMM d') : '-'}
            </div>
            <div className="text-xs text-muted-foreground">Latest Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Auto Updates */}
      {recentAutoUpdates.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              Recent Auto Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Pair</TableHead>
                    <TableHead className="text-xs text-right">Rate</TableHead>
                    <TableHead className="text-xs">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAutoUpdates.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {format(new Date(row.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        <span className="text-primary">{row.from_currency}</span>
                        <span className="text-muted-foreground">/</span>
                        {row.to_currency}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right tabular-nums">
                        {Number(row.rate).toFixed(4)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{row.source}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Rates Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Historical Rates
          </CardTitle>
          <CardDescription>Exchange rates stored for portfolio valuation</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No FX rates recorded yet</p>
              <p className="text-sm mt-1">Add your first exchange rate to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-mono font-medium">
                        <span className="text-primary">{rate.fromCurrency}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span>{rate.toCurrency}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{rate.rate.toFixed(4)}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(rate.rateDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{rate.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(rate)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete FX Rate?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the {rate.fromCurrency}/{rate.toCurrency} rate from {format(new Date(rate.rateDate), 'MMM d, yyyy')}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(rate.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Rates Reference */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Default Rates (Fallback)</CardTitle>
          <CardDescription>Used when no historical rate is available for a given date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {currencies.map((from) => (
              <div key={from} className="text-center p-2 bg-muted/50 rounded">
                <div className="font-mono text-primary font-medium">{from}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {currencies.filter((to) => to !== from).slice(0, 2).map((to) => (
                    <div key={to}>→ {to}: {getDefaultFxRate(from, to).toFixed(2)}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
