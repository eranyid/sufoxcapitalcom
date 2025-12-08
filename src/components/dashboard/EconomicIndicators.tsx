import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface EconomicIndicator {
  symbol: string;
  name: string;
  value: string;
  change: number;
  unit: string;
  source: string;
  period: string;
}

// Sample economic data - in production, this would come from FRED API or similar
const economicData: EconomicIndicator[] = [
  {
    symbol: 'GDP',
    name: 'Real GDP Growth',
    value: '2.8',
    change: 0.3,
    unit: '%',
    source: 'BEA',
    period: 'Q3 2024'
  },
  {
    symbol: 'CPI',
    name: 'CPI YoY',
    value: '2.7',
    change: -0.2,
    unit: '%',
    source: 'BLS',
    period: 'Nov 2024'
  },
  {
    symbol: 'UNEMP',
    name: 'Unemployment',
    value: '4.2',
    change: 0.1,
    unit: '%',
    source: 'BLS',
    period: 'Nov 2024'
  },
  {
    symbol: 'PCE',
    name: 'Core PCE',
    value: '2.8',
    change: 0.0,
    unit: '%',
    source: 'BEA',
    period: 'Oct 2024'
  },
  {
    symbol: 'NFP',
    name: 'Nonfarm Payrolls',
    value: '+227K',
    change: 61,
    unit: '',
    source: 'BLS',
    period: 'Nov 2024'
  },
  {
    symbol: 'ISM',
    name: 'ISM Manufacturing',
    value: '48.4',
    change: 1.9,
    unit: '',
    source: 'ISM',
    period: 'Nov 2024'
  }
];

const EconomicIndicators = () => {
  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    if (change < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getChangeColor = (change: number, symbol: string) => {
    // For unemployment, negative change is good (green)
    if (symbol === 'UNEMP') {
      if (change < 0) return 'text-success';
      if (change > 0) return 'text-destructive';
      return 'text-muted-foreground';
    }
    // For most indicators, positive change is good
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const formatChange = (change: number, symbol: string) => {
    if (change === 0) return '0.0';
    const prefix = change > 0 ? '+' : '';
    // NFP uses whole numbers
    if (symbol === 'NFP') return `${prefix}${change}K`;
    return `${prefix}${change.toFixed(1)}`;
  };

  return (
    <div className="w-full bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-b border-border">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          ECONOMIC INDICATORS
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Source: BLS / BEA / ISM
        </span>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-border">
        {economicData.map((indicator) => (
          <div
            key={indicator.symbol}
            className="px-3 py-2.5 hover:bg-muted/20 transition-colors"
          >
            {/* Symbol and Name */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-primary">
                {indicator.symbol}
              </span>
              <span className="text-[9px] text-muted-foreground truncate">
                {indicator.name}
              </span>
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
                {indicator.value}{indicator.unit && !indicator.value.includes('%') ? indicator.unit : ''}
              </span>
              
              {/* Change */}
              <div className={`flex items-center gap-0.5 ${getChangeColor(indicator.change, indicator.symbol)}`}>
                {getChangeIcon(indicator.change)}
                <span className="font-mono text-[10px] tabular-nums">
                  {formatChange(indicator.change, indicator.symbol)}
                </span>
              </div>
            </div>

            {/* Period */}
            <div className="text-[9px] text-muted-foreground mt-0.5">
              {indicator.period}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EconomicIndicators;
