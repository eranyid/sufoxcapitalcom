import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EconomicIndicator {
  symbol: string;
  name: string;
  value: string;
  change: number;
  unit: string;
  source: string;
  period: string;
}

// Fallback static data when API is unavailable
const fallbackData: EconomicIndicator[] = [
  { symbol: 'GDP', name: 'Real GDP Growth', value: '2.8', change: 0.3, unit: '%', source: 'BEA', period: 'Q3 2024' },
  { symbol: 'CPI', name: 'CPI YoY', value: '2.7', change: -0.2, unit: '%', source: 'BLS', period: 'Nov 2024' },
  { symbol: 'UNEMP', name: 'Unemployment', value: '4.2', change: 0.1, unit: '%', source: 'BLS', period: 'Nov 2024' },
  { symbol: 'PCE', name: 'Core PCE', value: '2.8', change: 0.0, unit: '%', source: 'BEA', period: 'Oct 2024' },
  { symbol: 'NFP', name: 'Nonfarm Payrolls', value: '+227K', change: 61, unit: '', source: 'BLS', period: 'Nov 2024' },
];

const EconomicIndicators = () => {
  const { user } = useAuth();
  const [indicators, setIndicators] = useState<EconomicIndicator[]>(fallbackData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicators = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-fred-data');
      
      if (fnError) {
        console.error('Error fetching FRED data:', fnError);
        setError('Failed to fetch live data');
        return;
      }
      
      if (data?.indicators && data.indicators.length > 0) {
        setIndicators(data.indicators);
        setLastUpdated(data.lastUpdated);
      }
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError('Failed to fetch live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIndicators();
    }
  }, [user]);

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
    if (symbol === 'NFP') return `${prefix}${Math.round(change)}K`;
    return `${prefix}${change.toFixed(1)}`;
  };

  const formatLastUpdated = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border-b border-border">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          ECONOMIC INDICATORS
        </span>
        {loading && (
          <RefreshCw className="h-3 w-3 text-muted-foreground animate-spin" />
        )}
        {error && (
          <span className="text-[9px] text-destructive">{error}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] text-muted-foreground">
              Updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
          <span className="text-[9px] text-muted-foreground">
            Source: FRED
          </span>
          <button
            onClick={fetchIndicators}
            disabled={loading || !user}
            className="p-1 hover:bg-muted/50 rounded transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`h-3 w-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 divide-x divide-border">
        {indicators.map((indicator) => (
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
                {indicator.value}{indicator.unit && !indicator.value.includes('%') && !indicator.value.includes('K') ? indicator.unit : ''}
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
