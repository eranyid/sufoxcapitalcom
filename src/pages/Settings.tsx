import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Currency } from '@/types/investment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon, Save, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'ZAR', 'OTHER'];

export default function Settings() {
  const { settings, updateSettings, transactions, valuations, refreshMetrics } = usePortfolio();
  
  const [riskFreeRate, setRiskFreeRate] = useState(settings.riskFreeRate.toString());
  const [baseCurrency, setBaseCurrency] = useState<Currency>(settings.baseCurrency);
  const [benchmarkReturns, setBenchmarkReturns] = useState(
    settings.benchmarkReturns.join(', ')
  );

  const handleSave = () => {
    const returns = benchmarkReturns
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n));

    updateSettings({
      riskFreeRate: parseFloat(riskFreeRate) || 4.5,
      baseCurrency,
      benchmarkReturns: returns
    });
    
    toast.success('Settings saved');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure portfolio parameters</p>
      </div>

      {/* Risk Parameters */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Risk Parameters
          </CardTitle>
          <CardDescription>
            Configure risk-free rate and benchmark for Sharpe ratio and Beta calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Risk-Free Rate (%)</Label>
              <Input 
                type="number"
                step="0.1"
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(e.target.value)}
                placeholder="4.5"
              />
              <p className="text-xs text-muted-foreground">
                Annual risk-free rate (e.g., 10Y Treasury yield)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Base Currency</Label>
              <Select value={baseCurrency} onValueChange={(v: Currency) => setBaseCurrency(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Reporting currency for all metrics
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Benchmark Monthly Returns (%)</Label>
            <Textarea 
              value={benchmarkReturns}
              onChange={(e) => setBenchmarkReturns(e.target.value)}
              placeholder="1.2, 0.8, -0.5, 2.1, 1.5..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Enter comma-separated monthly benchmark returns for Beta calculation (e.g., S&P 500 monthly returns)
            </p>
          </div>

          <Button onClick={handleSave} className="gradient-gold text-primary-foreground">
            <Save className="h-4 w-4 mr-2" /> Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Transactions</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{valuations.length}</p>
              <p className="text-sm text-muted-foreground">Valuations</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {new Set(transactions.map(t => t.ticker)).size}
              </p>
              <p className="text-sm text-muted-foreground">Unique Assets</p>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={refreshMetrics}>
              <RefreshCw className="h-4 w-4 mr-2" /> Recalculate Metrics
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              <Trash2 className="h-4 w-4 mr-2" /> Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-1">1. Add Transactions</h4>
            <p>Record all buy and sell transactions with date, quantity, price, and fees.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">2. Add Monthly Valuations</h4>
            <p>At month-end, record the NAV or market price for each asset. Include FX rates if applicable.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">3. Set Risk Parameters</h4>
            <p>Configure the risk-free rate (current Treasury yield) and optionally add benchmark returns for Beta calculation.</p>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">4. Review Analytics</h4>
            <p>The dashboard automatically calculates P/L, returns, volatility, Sharpe, drawdowns, VaR, and more.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
