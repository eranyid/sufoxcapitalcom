import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Building2, Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { useAlpacaFundamentals, IncomeStatementData, BalanceSheetData, CashFlowData } from '@/hooks/useAlpacaFundamentals';
import { IncomeStatementChart } from './IncomeStatementChart';
import { BalanceSheetChart } from './BalanceSheetChart';
import { CashFlowChart } from './CashFlowChart';

export const FinancialsModule = () => {
  const [symbol, setSymbol] = useState('AAPL');
  const [inputSymbol, setInputSymbol] = useState('AAPL');
  const [activeTab, setActiveTab] = useState('income');
  const [period, setPeriod] = useState<'quarterly' | 'annual'>('quarterly');
  
  const [incomeData, setIncomeData] = useState<IncomeStatementData[] | null>(null);
  const [balanceData, setBalanceData] = useState<BalanceSheetData[] | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[] | null>(null);
  
  const { loading, error, isMockData, fetchIncomeStatement, fetchBalanceSheet, fetchCashFlow } = useAlpacaFundamentals();

  const fetchAllData = useCallback(async (sym: string, per: 'quarterly' | 'annual') => {
    const [income, balance, cashflow] = await Promise.all([
      fetchIncomeStatement(sym, per),
      fetchBalanceSheet(sym, per),
      fetchCashFlow(sym, per),
    ]);
    
    setIncomeData(income);
    setBalanceData(balance);
    setCashFlowData(cashflow);
  }, [fetchIncomeStatement, fetchBalanceSheet, fetchCashFlow]);

  useEffect(() => {
    fetchAllData(symbol, period);
  }, [symbol, period, fetchAllData]);

  const handleSearch = () => {
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatNumber = (value: number): string => {
    if (Math.abs(value) >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="font-mono text-lg">FINANCIALS</CardTitle>
            {isMockData && (
              <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/50">
                SAMPLE DATA
              </Badge>
            )}
          </div>
          
          {/* Symbol Search */}
          <div className="flex items-center gap-2">
            <Input
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Enter symbol..."
              className="w-28 sm:w-32 font-mono text-sm h-8"
            />
            <Button 
              onClick={handleSearch} 
              size="sm" 
              variant="outline"
              disabled={loading}
              className="h-8"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Current Symbol Display */}
        <div className="flex items-center gap-4 mt-2">
          <span className="font-mono text-2xl text-primary">{symbol}</span>
          
          {/* Period Toggle */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant={period === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('quarterly')}
              className="h-7 text-xs"
            >
              Quarterly
            </Button>
            <Button
              variant={period === 'annual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('annual')}
              className="h-7 text-xs"
            >
              Annual
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="flex items-center gap-2 text-destructive mb-4 p-3 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Statement Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-muted/50">
            <TabsTrigger value="income" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Income Statement</span>
              <span className="sm:hidden">Income</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Balance Sheet</span>
              <span className="sm:hidden">Balance</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="flex items-center gap-2 data-[state=active]:bg-primary/20">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Cash Flow</span>
              <span className="sm:hidden">Cash</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-0">
            <IncomeStatementChart 
              data={incomeData} 
              loading={loading} 
              formatNumber={formatNumber}
              period={period}
            />
          </TabsContent>

          <TabsContent value="balance" className="mt-0">
            <BalanceSheetChart 
              data={balanceData} 
              loading={loading} 
              formatNumber={formatNumber}
              period={period}
            />
          </TabsContent>

          <TabsContent value="cashflow" className="mt-0">
            <CashFlowChart 
              data={cashFlowData} 
              loading={loading} 
              formatNumber={formatNumber}
              period={period}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
