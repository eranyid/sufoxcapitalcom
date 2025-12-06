import { useState, useCallback } from 'react';
import { Search, TrendingUp, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TradingViewChart from './TradingViewChart';

type MarketType = 'stocks' | 'crypto' | 'fx' | 'index';
type Timeframe = 'D' | 'W' | 'M' | '12M';

const MARKET_PREFIXES: Record<MarketType, string> = {
  stocks: 'NASDAQ',
  crypto: 'BINANCE',
  fx: 'FX',
  index: 'TVC',
};

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
  { value: 'M', label: '1M' },
  { value: '12M', label: '1Y' },
];

const ChartLab = () => {
  const [symbolInput, setSymbolInput] = useState('AAPL');
  const [marketType, setMarketType] = useState<MarketType>('stocks');
  const [timeframe, setTimeframe] = useState<Timeframe>('D');
  const [activeSymbol, setActiveSymbol] = useState('NASDAQ:AAPL');
  const [activeInterval, setActiveInterval] = useState('D');
  const [error, setError] = useState('');

  const formatSymbol = useCallback((input: string, market: MarketType): string => {
    const cleanSymbol = input.trim().toUpperCase();
    
    // If user already included exchange prefix, use as-is
    if (cleanSymbol.includes(':')) {
      return cleanSymbol;
    }

    // Add appropriate prefix based on market type
    const prefix = MARKET_PREFIXES[market];
    
    // Special handling for crypto pairs
    if (market === 'crypto') {
      // If it doesn't end with common quote currencies, append USDT
      if (!cleanSymbol.match(/(USD|USDT|BTC|ETH|EUR)$/)) {
        return `${prefix}:${cleanSymbol}USDT`;
      }
      return `${prefix}:${cleanSymbol}`;
    }

    // Special handling for FX pairs
    if (market === 'fx') {
      return `${prefix}:${cleanSymbol}`;
    }

    // Special handling for indices
    if (market === 'index') {
      // Common index mappings
      const indexMappings: Record<string, string> = {
        'SPX': 'TVC:SPX',
        'SP500': 'TVC:SPX',
        'NDX': 'NASDAQ:NDX',
        'DJI': 'TVC:DJI',
        'VIX': 'TVC:VIX',
        'DXY': 'TVC:DXY',
      };
      return indexMappings[cleanSymbol] || `${prefix}:${cleanSymbol}`;
    }

    return `${prefix}:${cleanSymbol}`;
  }, []);

  const handleLoadChart = useCallback(() => {
    if (!symbolInput.trim()) {
      setError('Please enter a symbol.');
      return;
    }
    
    setError('');
    const formattedSymbol = formatSymbol(symbolInput, marketType);
    setActiveSymbol(formattedSymbol);
    setActiveInterval(timeframe);
  }, [symbolInput, marketType, timeframe, formatSymbol]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLoadChart();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle>Chart Lab</CardTitle>
        </div>
        <CardDescription>
          Interactive TradingView charts for any symbol.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          {/* Symbol Input */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
              Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={symbolInput}
                onChange={(e) => {
                  setSymbolInput(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter symbol (e.g. AAPL, NVDA, SPX, BTCUSD)"
                className="pl-9 font-mono bg-background/50"
              />
            </div>
            {error && (
              <p className="text-xs text-destructive font-mono">{error}</p>
            )}
          </div>

          {/* Market Type Selector */}
          <div className="w-full sm:w-32 space-y-1.5">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
              Market
            </label>
            <Select value={marketType} onValueChange={(v) => setMarketType(v as MarketType)}>
              <SelectTrigger className="bg-background/50 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stocks">Stocks</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="fx">FX</SelectItem>
                <SelectItem value="index">Index</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-1 sm:gap-1.5">
            {TIMEFRAME_OPTIONS.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className="font-mono text-xs px-3"
              >
                {tf.label}
              </Button>
            ))}
          </div>

          {/* Load Chart Button */}
          <Button onClick={handleLoadChart} className="gap-2 font-mono">
            <RefreshCw className="h-4 w-4" />
            Load Chart
          </Button>
        </div>

        {/* Current Symbol Display */}
        <div className="flex items-center gap-2 py-2 px-3 bg-background/30 border border-border/50 rounded">
          <span className="text-xs font-mono text-muted-foreground">ACTIVE:</span>
          <span className="text-sm font-mono text-primary font-semibold">{activeSymbol}</span>
          <span className="text-xs font-mono text-muted-foreground ml-auto">
            Interval: {activeInterval}
          </span>
        </div>

        {/* TradingView Chart */}
        <div className="border border-border rounded overflow-hidden bg-[#0B0E11]">
          <TradingViewChart 
            symbol={activeSymbol} 
            interval={activeInterval}
            theme="dark"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartLab;
