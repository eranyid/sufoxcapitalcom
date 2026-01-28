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
import { Banknote, Plus, Pencil, Trash2, Loader2, ArrowRightLeft, RefreshCw, Calendar, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { getSupportedCurrencies, getDefaultFxRate, FxRate } from '@/lib/fxService';
import { CashCurrency } from '@/types/investment';

const CURRENCY_SYMBOLS: Record<CashCurrency, string> = {
  USD: '$',
  EUR: '€',
  ILS: '₪',
  GBP: '£',
  CHF: 'Fr',
  JPY: '¥'
};

const CURRENCY_NAMES: Record<CashCurrency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  ILS: 'Israeli Shekel',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  JPY: 'Japanese Yen'
};

interface FxRateFormData {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  rateDate: string;
  source: string;
}

const initialFormData: FxRateFormData = {
  fromCurrency: 'USD',
  toCurrency: 'ILS',
  rate: '',
  rateDate: new Date().toISOString().split('T')[0],
  source: 'manual',
};

export default function FXRates() {
  const { user } = useAuth();
  const { cashBalances, convertCurrency } = usePortfolio();
  const [rates, setRates] = useState<FxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<FxRate | null>(null);
  const [formData, setFormData] = useState<FxRateFormData>(initialFormData);
  
  // Currency conversion state
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertFrom, setConvertFrom] = useState<CashCurrency>('USD');
  const [convertTo, setConvertTo] = useState<CashCurrency>('ILS');
  const [convertAmount, setConvertAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const currencies = getSupportedCurrencies();

  // Fetch FX rates
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
        (data || []).map((r) => ({
          id: r.id,
          userId: r.user_id,
          fromCurrency: r.from_currency,
          toCurrency: r.to_currency,
          rate: Number(r.rate),
          rateDate: r.rate_date,
          source: r.source || 'manual',
          createdAt: r.created_at,
        }))
      );
    } catch (error: any) {
      toast.error('Failed to load FX rates');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [user]);

  const handleOpenDialog = (rate?: FxRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: rate.rate.toString(),
        rateDate: rate.rateDate,
        source: rate.source,
      });
    } else {
      setEditingRate(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRate(null);
    setFormData(initialFormData);
  };

  // Currency conversion handlers
  const impliedRate = useMemo(() => {
    const from = parseFloat(convertAmount);
    const to = parseFloat(receivedAmount);
    if (!isNaN(from) && from > 0 && !isNaN(to) && to > 0) {
      return to / from;
    }
    return null;
  }, [convertAmount, receivedAmount]);

  const handleConvertCurrency = async () => {
    const fromAmt = parseFloat(convertAmount);
    const toAmt = parseFloat(receivedAmount);
    
    if (isNaN(fromAmt) || fromAmt <= 0) {
      toast.error('Enter a valid amount to convert');
      return;
    }
    if (isNaN(toAmt) || toAmt <= 0) {
      toast.error('Enter a valid received amount');
      return;
    }
    if (convertFrom === convertTo) {
      toast.error('Currencies must be different');
      return;
    }
    if (cashBalances[convertFrom] < fromAmt) {
      toast.error(`Insufficient ${convertFrom} balance`);
      return;
    }

    setIsConverting(true);
    try {
      const success = await convertCurrency(convertFrom, convertTo, fromAmt, toAmt);
      if (success) {
        toast.success(`Converted ${CURRENCY_SYMBOLS[convertFrom]}${fromAmt.toLocaleString()} to ${CURRENCY_SYMBOLS[convertTo]}${toAmt.toLocaleString()}`);
        setIsConvertDialogOpen(false);
        setConvertAmount('');
        setReceivedAmount('');
      } else {
        toast.error('Conversion failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (!formData.fromCurrency || !formData.toCurrency) {
      toast.error('Please select both currencies');
      return;
    }
    if (formData.fromCurrency === formData.toCurrency) {
      toast.error('Currencies must be different');
      return;
    }
    const rateNum = parseFloat(formData.rate);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error('Please enter a valid positive rate');
      return;
    }
    if (!formData.rateDate) {
      toast.error('Please select a date');
      return;
    }

    setIsSaving(true);
    try {
      if (editingRate) {
        // Update existing
        const { error } = await supabase
          .from('fx_rates')
          .update({
            from_currency: formData.fromCurrency,
            to_currency: formData.toCurrency,
            rate: rateNum,
            rate_date: formData.rateDate,
            source: formData.source || 'manual',
          })
          .eq('id', editingRate.id);

        if (error) throw error;
        toast.success('FX rate updated');
      } else {
        // Insert new
        const { error } = await supabase.from('fx_rates').insert({
          user_id: user.id,
          from_currency: formData.fromCurrency,
          to_currency: formData.toCurrency,
          rate: rateNum,
          rate_date: formData.rateDate,
          source: formData.source || 'manual',
        });

        if (error) throw error;
        toast.success('FX rate added');
      }

      handleCloseDialog();
      fetchRates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save FX rate');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('fx_rates').delete().eq('id', id);
      if (error) throw error;
      toast.success('FX rate deleted');
      fetchRates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete FX rate');
    }
  };

  const handleFillDefault = () => {
    const defaultRate = getDefaultFxRate(formData.fromCurrency, formData.toCurrency);
    setFormData((prev) => ({ ...prev, rate: defaultRate.toFixed(4) }));
  };

  // Group rates by currency pair for display
  const groupedByPair = rates.reduce((acc, rate) => {
    const key = `${rate.fromCurrency}/${rate.toCurrency}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rate);
    return acc;
  }, {} as Record<string, FxRate[]>);

  return (
    <div className="section-spacing animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
            <Banknote className="h-6 w-6" />
            FX Rates
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            Manage historical exchange rates for accurate portfolio valuation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRates} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                  {editingRate ? 'Edit FX Rate' : 'Add FX Rate'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Currency Pair */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Currency</Label>
                    <Select
                      value={formData.fromCurrency}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, fromCurrency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Currency</Label>
                    <Select
                      value={formData.toCurrency}
                      onValueChange={(v) => setFormData((prev) => ({ ...prev, toCurrency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Exchange Rate</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleFillDefault}
                      className="h-6 text-xs"
                    >
                      Use Default
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.rate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rate: e.target.value }))}
                    placeholder={`1 ${formData.fromCurrency} = ? ${formData.toCurrency}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    1 {formData.fromCurrency} = {formData.rate || '?'} {formData.toCurrency}
                  </p>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label>Rate Date</Label>
                  <Input
                    type="date"
                    value={formData.rateDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rateDate: e.target.value }))}
                  />
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <Label>Source (Optional)</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, source: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                      <SelectItem value="bloomberg">Bloomberg</SelectItem>
                      <SelectItem value="reuters">Reuters</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingRate ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Convert Currency Dialog */}
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
                {/* From Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Select value={convertFrom} onValueChange={(v) => setConvertFrom(v as CashCurrency)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CURRENCY_NAMES) as CashCurrency[]).map((cur) => (
                          <SelectItem key={cur} value={cur}>
                            {cur} - {CURRENCY_NAMES[cur]}
                          </SelectItem>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CURRENCY_NAMES) as CashCurrency[]).map((cur) => (
                          <SelectItem key={cur} value={cur}>
                            {cur} - {CURRENCY_NAMES[cur]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Balance: {CURRENCY_SYMBOLS[convertTo]}{cashBalances[convertTo].toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Amount to convert */}
                <div className="space-y-2">
                  <Label>Amount to Convert ({convertFrom})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    placeholder={`Amount in ${convertFrom}`}
                  />
                </div>

                {/* Received amount */}
                <div className="space-y-2">
                  <Label>Amount Received ({convertTo})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder={`Amount in ${convertTo}`}
                  />
                </div>

                {/* Implied rate */}
                {impliedRate && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground">Implied Rate</p>
                    <p className="text-lg font-mono font-medium text-primary">
                      1 {convertFrom} = {impliedRate.toFixed(4)} {convertTo}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConvertCurrency} disabled={isConverting || convertFrom === convertTo}>
                  {isConverting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Convert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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

      {/* Rates Table */}
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
                      <TableCell className="text-right font-mono tabular-nums">
                        {rate.rate.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(rate.rateDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {rate.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDialog(rate)}
                          >
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
                                  This will permanently delete the {rate.fromCurrency}/{rate.toCurrency}{' '}
                                  rate from {format(new Date(rate.rateDate), 'MMM d, yyyy')}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(rate.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
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
          <CardDescription>
            Used when no historical rate is available for a given date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {currencies.map((from) => (
              <div key={from} className="text-center p-2 bg-muted/50 rounded">
                <div className="font-mono text-primary font-medium">{from}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {currencies
                    .filter((to) => to !== from)
                    .slice(0, 2)
                    .map((to) => (
                      <div key={to}>
                        → {to}: {getDefaultFxRate(from, to).toFixed(2)}
                      </div>
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
