import { useState, useEffect } from 'react';
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

  // Fetch data when symbol or period changes
  useEffect(() => {
    const fetchAllData = async () => {
      // Clear previous data before fetching new
      setIncomeData(null);
      setBalanceData(null);
      setCashFlowData(null);
      
      const [income, balance, cashflow] = await Promise.all([
        fetchIncomeStatement(symbol, period, 5),
        fetchBalanceSheet(symbol, period, 5),
        fetchCashFlow(symbol, period, 5),
      ]);
      
      setIncomeData(income);
      setBalanceData(balance);
      setCashFlowData(cashflow);
    };
    
    fetchAllData();
  }, [symbol, period, fetchIncomeStatement, fetchBalanceSheet, fetchCashFlow]);

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
      <CardHeader className="pb-2 sm:pb-4 px-3 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <CardTitle className="font-mono text-sm sm:text-lg">FINANCIALS</CardTitle>
              {isMockData && (
                <Badge variant="outline" className="text-[10px] sm:text-xs text-yellow-500 border-yellow-500/50">
                  SAMPLE
                </Badge>
              )}
            </div>
            
            {/* Symbol Search */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Input
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="Symbol"
                className="w-20 sm:w-28 font-mono text-xs sm:text-sm h-7 sm:h-8"
              />
              <Button 
                onClick={handleSearch} 
                size="sm" 
                variant="outline"
                disabled={loading}
                className="h-7 sm:h-8 w-7 sm:w-8 p-0"
              >
                {loading ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Search className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
            </div>
          </div>

          {/* Current Symbol Display */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg sm:text-2xl text-primary">{symbol}</span>
            
            {/* Period Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={period === 'quarterly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('quarterly')}
                className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
              >
                Q
              </Button>
              <Button
                variant={period === 'annual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod('annual')}
                className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
              >
                Y
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6 pt-0">
        {error && (
          <div className="flex items-center gap-2 text-destructive mb-3 sm:mb-4 p-2 sm:p-3 bg-destructive/10 rounded-md">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Statement Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-3 sm:mb-4 bg-muted/50 h-8 sm:h-10">
            <TabsTrigger value="income" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-primary/20 text-[10px] sm:text-sm px-1 sm:px-3">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Income</span>
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-primary/20 text-[10px] sm:text-sm px-1 sm:px-3">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Balance</span>
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="flex items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-primary/20 text-[10px] sm:text-sm px-1 sm:px-3">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Cash</span>
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
