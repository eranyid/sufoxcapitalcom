import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Loader2, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CashCurrency } from '@/types/investment';
import { getDefaultFxRate } from '@/lib/fxService';

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

export function MonthlyFxRatesForm({ onRatesSaved }: MonthlyFxRatesFormProps) {
  const { user } = useAuth();
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
  const [isLoading, setIsLoading] = useState(true);

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
          .select('from_currency, rate')
          .eq('user_id', user.id)
          .eq('to_currency', 'USD')
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
            const currency = row.from_currency as CashCurrency;
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
          .select('from_currency, rate')
          .eq('user_id', user.id)
          .eq('to_currency', 'USD')
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
            const currency = row.from_currency as CashCurrency;
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

  const handleSaveAll = async () => {
    if (!user) return;

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

      // Delete existing rates for this month first
      await supabase
        .from('fx_rates')
        .delete()
        .eq('user_id', user.id)
        .eq('to_currency', 'USD')
        .eq('rate_date', rateDate)
        .in('from_currency', CURRENCIES_TO_USD);

      // Insert new rates
      const insertData = ratesToSave.map(r => ({
        user_id: user.id,
        from_currency: r.fromCurrency,
        to_currency: 'USD',
        rate: r.rate,
        rate_date: rateDate,
        source: 'manual'
      }));

      const { error } = await supabase
        .from('fx_rates')
        .insert(insertData);

      if (error) throw error;

      toast.success(`Saved FX rates for ${selectedMonth}`);
      onRatesSaved?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save rates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Monthly FX Rates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                {currency}/USD
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
          Enter rate as: 1 {'{Currency}'} = X USD (e.g., 1 EUR = 1.08 USD)
        </p>
      </CardContent>
    </Card>
  );
}
