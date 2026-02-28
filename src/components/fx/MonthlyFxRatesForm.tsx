import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Loader2, Copy, Save, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CashCurrency } from '@/types/investment';
import { getDefaultFxRate } from '@/lib/fxService';
import { usePortfolio } from '@/context/PortfolioContext';
// All currencies except USD (which is the base)
const CURRENCIES_TO_USD: CashCurrency[] = ['EUR', 'ILS', 'GBP', 'CHF', 'JPY'];

const CURRENCY_NAMES: Record<CashCurrency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  ILS: 'Israeli Shekel',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  JPY: 'Japanese Yen'
};

interface MonthlyFxRatesFormProps {
  onRatesSaved?: () => void;
}

interface ValueComparison {
  before: number;
  after: number;
  diff: number;
  diffPercent: number;
}

export function MonthlyFxRatesForm({ onRatesSaved }: MonthlyFxRatesFormProps) {
  const { user } = useAuth();
  const { computedData, refreshFxRates } = usePortfolio();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [rates, setRates] = useState<Record<CashCurrency, string>>({
    USD: '1',
    EUR: '',
    ILS: '',
    GBP: '',
    CHF: '',
    JPY: ''
  });
  const [lastMonthRates, setLastMonthRates] = useState<Record<CashCurrency, number | null>>({
    USD: 1,
    EUR: null,
    ILS: null,
    GBP: null,
    CHF: null,
    JPY: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [valueComparison, setValueComparison] = useState<ValueComparison | null>(null);
  
  // Track value before save to show accurate comparison after state updates
  const pendingComparisonRef = useRef<{ before: number } | null>(null);

  // Generate month options (last 24 months)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return format(startOfMonth(date), 'yyyy-MM');
  });

  // Load existing rates for selected month and last month's rates
  useEffect(() => {
    const loadRates = async () => {
      if (!user) return;
      setIsLoading(true);

      try {
        // Load rates for selected month
        const rateDate = `${selectedMonth}-01`;
        const { data: currentMonthData } = await supabase
          .from('fx_rates')
          .select('to_currency, rate')
          .eq('user_id', user.id)
          .eq('from_currency', 'USD')
          .eq('rate_date', rateDate);

        const newRates: Record<CashCurrency, string> = {
          USD: '1',
          EUR: '',
          ILS: '',
          GBP: '',
          CHF: '',
          JPY: ''
        };

        if (currentMonthData) {
          for (const row of currentMonthData) {
            const currency = row.to_currency as CashCurrency;
            if (currency in newRates && currency !== 'USD') {
              newRates[currency] = Number(row.rate).toString();
            }
          }
        }
        setRates(newRates);

        // Load last month's rates for reference
        const lastMonthDate = format(subMonths(new Date(`${selectedMonth}-01`), 1), 'yyyy-MM-01');
        const { data: lastMonthData } = await supabase
          .from('fx_rates')
          .select('to_currency, rate')
          .eq('user_id', user.id)
          .eq('from_currency', 'USD')
          .eq('rate_date', lastMonthDate);

        const lastRates: Record<CashCurrency, number | null> = {
          USD: 1,
          EUR: null,
          ILS: null,
          GBP: null,
          CHF: null,
          JPY: null
        };

        if (lastMonthData) {
          for (const row of lastMonthData) {
            const currency = row.to_currency as CashCurrency;
            if (currency in lastRates && currency !== 'USD') {
              lastRates[currency] = Number(row.rate);
            }
          }
        }
        setLastMonthRates(lastRates);
      } catch (error) {
        console.error('Failed to load FX rates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRates();
  }, [user, selectedMonth]);

  // Clear comparison when month changes
  useEffect(() => {
    setValueComparison(null);
    pendingComparisonRef.current = null;
  }, [selectedMonth]);

  // Update comparison when portfolio value changes after save
  useEffect(() => {
    if (pendingComparisonRef.current) {
      const before = pendingComparisonRef.current.before;
      const after = computedData.totalPortfolioValue;
      const diff = after - before;
      const diffPercent = before > 0 ? (diff / before) * 100 : 0;
      
      setValueComparison({ before, after, diff, diffPercent });
      pendingComparisonRef.current = null;
    }
  }, [computedData.totalPortfolioValue]);

  const handleUseLastMonth = () => {
    const newRates: Record<CashCurrency, string> = { ...rates };
    for (const currency of CURRENCIES_TO_USD) {
      if (lastMonthRates[currency] !== null) {
        newRates[currency] = lastMonthRates[currency]!.toString();
      }
    }
    setRates(newRates);
    toast.success('Copied rates from last month');
  };

  const handleUseDefaults = () => {
    const newRates: Record<CashCurrency, string> = { ...rates };
    for (const currency of CURRENCIES_TO_USD) {
      const defaultRate = getDefaultFxRate(currency, 'USD');
      newRates[currency] = defaultRate.toFixed(4);
    }
    setRates(newRates);
    toast.success('Filled with default rates');
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSaveAll = async () => {
    if (!user) return;

    // Capture value BEFORE saving
    const valueBefore = computedData.totalPortfolioValue;

    // Validate all rates
    const ratesToSave: Array<{ fromCurrency: string; rate: number }> = [];
    for (const currency of CURRENCIES_TO_USD) {
      const rateValue = parseFloat(rates[currency]);
      if (isNaN(rateValue) || rateValue <= 0) {
        toast.error(`Invalid rate for ${currency}`);
        return;
      }
      ratesToSave.push({ fromCurrency: currency, rate: rateValue });
    }

    setIsSaving(true);
    try {
      const rateDate = `${selectedMonth}-01`;

      // Delete existing rates for this month first (both directions for cleanup)
      await supabase
        .from('fx_rates')
        .delete()
        .eq('user_id', user.id)
        .eq('from_currency', 'USD')
        .eq('rate_date', rateDate)
        .in('to_currency', CURRENCIES_TO_USD);

      // Also clean up legacy wrong-direction entries
      await supabase
        .from('fx_rates')
        .delete()
        .eq('user_id', user.id)
        .eq('to_currency', 'USD')
        .eq('rate_date', rateDate)
        .in('from_currency', CURRENCIES_TO_USD);

      // Insert new rates in correct direction: USD → Currency
      const insertData = ratesToSave.map(r => ({
        user_id: user.id,
        from_currency: 'USD',
        to_currency: r.fromCurrency,
        rate: r.rate,
        rate_date: rateDate,
        source: 'manual'
      }));

      const { error } = await supabase
        .from('fx_rates')
        .insert(insertData);

      if (error) throw error;

      // Store the before value - the useEffect will update the comparison 
      // when computedData.totalPortfolioValue changes after refreshFxRates
      pendingComparisonRef.current = { before: valueBefore };

      // Refresh FX rates in context - this will trigger recalculation
      await refreshFxRates();
      
      toast.success(`Saved FX rates for ${selectedMonth}`);
      onRatesSaved?.();

    } catch (error: any) {
      toast.error(error.message || 'Failed to save rates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={`bg-card/50 border-primary/20 ${!isEnabled ? 'opacity-80' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Monthly FX Rates
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">
              {isEnabled ? 'Manual Entry' : 'Disabled'}
            </span>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </div>
      </CardHeader>
      {isEnabled && <CardContent className="space-y-4">
        {/* Value Comparison Banner */}
        {valueComparison && (
          <div className={`rounded-lg p-3 border ${valueComparison.diff >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {valueComparison.diff >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs font-medium">Portfolio Value Updated</span>
              </div>
              <button 
                onClick={() => setValueComparison(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm font-mono">
              <span className="text-muted-foreground">{formatCurrency(valueComparison.before)}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold">{formatCurrency(computedData.totalPortfolioValue)}</span>
              <span className={`text-xs ${valueComparison.diff >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                ({valueComparison.diff >= 0 ? '+' : ''}{formatCurrency(computedData.totalPortfolioValue - valueComparison.before)})
              </span>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(month => (
                <SelectItem key={month} value={month}>
                  {format(new Date(`${month}-01`), 'MMM yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseLastMonth}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Last Month
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUseDefaults}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            Defaults
          </Button>
        </div>

        {/* Rate Grid */}
        <div className="grid grid-cols-5 gap-2">
          {CURRENCIES_TO_USD.map(currency => (
            <div key={currency} className="space-y-1">
              <label className="text-[10px] text-muted-foreground font-mono">
                USD/{currency}
              </label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={rates[currency]}
                onChange={(e) => setRates(prev => ({ ...prev, [currency]: e.target.value }))}
                placeholder={getDefaultFxRate(currency, 'USD').toFixed(4)}
                className="h-8 text-xs font-mono"
                disabled={isLoading}
              />
              {lastMonthRates[currency] !== null && (
                <p className="text-[9px] text-muted-foreground">
                  Last: {lastMonthRates[currency]!.toFixed(4)}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveAll}
          disabled={isSaving || isLoading}
          className="w-full h-8"
          size="sm"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Rates
        </Button>

        <p className="text-[9px] text-muted-foreground text-center">
          Enter rate as: 1 USD = X {'{Currency}'} (e.g., 1 USD = 3.6 ILS)
        </p>
      </CardContent>}
    </Card>
  );
}
