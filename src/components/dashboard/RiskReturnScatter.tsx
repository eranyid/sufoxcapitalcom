import { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { RiskReturnPoint } from '@/lib/portfolioEngine';
import { useIsMobile } from '@/hooks/use-mobile';

interface RiskReturnScatterProps {
  holdings: RiskReturnPoint[];
  portfolio: {
    annualizedReturn: number;
    annualizedVolatility: number;
  };
  excludedCount: number;
}

const HOLDING_COLOR = '#4A90D9';
const PORTFOLIO_COLOR = '#FF8C00';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RiskReturnPoint & { isPortfolio?: boolean };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload[0]) return null;
  
  const data = payload[0].payload;
  
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="font-mono text-sm font-semibold text-foreground mb-2">
        {data.isPortfolio ? '📊 Portfolio' : data.ticker}
      </p>
      {!data.isPortfolio && (
        <p className="text-[10px] text-muted-foreground mb-2 truncate max-w-[150px]">
          {data.name}
        </p>
      )}
      <div className="space-y-1 text-[11px] font-mono">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Return:</span>
          <span className={data.annualizedReturn >= 0 ? 'text-emerald-500' : 'text-red-500'}>
            {data.annualizedReturn >= 0 ? '+' : ''}{data.annualizedReturn.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Volatility:</span>
          <span className="text-foreground">{data.annualizedVolatility.toFixed(2)}%</span>
        </div>
        {!data.isPortfolio && (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Weight:</span>
              <span className="text-foreground">{data.weight.toFixed(1)}%</span>
            </div>
            {data.sharpeRatio !== undefined && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Sharpe:</span>
                <span className={data.sharpeRatio >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {data.sharpeRatio.toFixed(2)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function RiskReturnScatter({ holdings, portfolio, excludedCount }: RiskReturnScatterProps) {
  const isMobile = useIsMobile();
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const holdingPoints = holdings.map(h => ({
      ...h,
      isPortfolio: false
    }));
    
    // Add portfolio point
    const portfolioPoint = {
      ticker: 'Portfolio',
      name: 'Portfolio',
      annualizedReturn: portfolio.annualizedReturn,
      annualizedVolatility: portfolio.annualizedVolatility,
      weight: 100,
      sharpeRatio: portfolio.annualizedVolatility > 0 
        ? (portfolio.annualizedReturn - 4.5) / portfolio.annualizedVolatility 
        : 0,
      isPortfolio: true
    };
    
    return { holdingPoints, portfolioPoint };
  }, [holdings, portfolio]);
  
  // Calculate axis domains
  const { xDomain, yDomain } = useMemo(() => {
    const allPoints = [...chartData.holdingPoints, chartData.portfolioPoint];
    
    if (allPoints.length === 0) {
      return { xDomain: [0, 30], yDomain: [-10, 30] };
    }
    
    const volValues = allPoints.map(p => p.annualizedVolatility);
    const retValues = allPoints.map(p => p.annualizedReturn);
    
    const minVol = Math.min(...volValues);
    const maxVol = Math.max(...volValues);
    const minRet = Math.min(...retValues);
    const maxRet = Math.max(...retValues);
    
    // Add padding
    const volPadding = (maxVol - minVol) * 0.15 || 5;
    const retPadding = (maxRet - minRet) * 0.15 || 5;
    
    return {
      xDomain: [Math.max(0, minVol - volPadding), maxVol + volPadding],
      yDomain: [minRet - retPadding, maxRet + retPadding]
    };
  }, [chartData]);
  
  // Empty state
  if (holdings.length < 2) {
    return (
      <div className="bg-card/50 border border-border/40 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Risk / Return Map
          </h3>
        </div>
        <div className="p-8 text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Not enough holdings with history to build a Risk / Return map yet.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card/50 border border-border/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Risk / Return Map – Holdings
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Mapping each holding by risk (volatility) and return. The orange point represents the overall portfolio.
            </p>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-4">
        <div className={`w-full ${isMobile ? 'h-[280px]' : 'h-[350px]'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: isMobile ? 40 : 50 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis 
                type="number" 
                dataKey="annualizedVolatility" 
                name="Volatility"
                domain={xDomain}
                tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                label={{ 
                  value: isMobile ? 'Volatility' : 'Volatility (Annualized)', 
                  position: 'bottom', 
                  offset: 20,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  fill: 'hsl(var(--muted-foreground))'
                }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="number" 
                dataKey="annualizedReturn" 
                name="Return"
                domain={yDomain}
                tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                label={{ 
                  value: isMobile ? 'Return' : 'Return (Annualized CAGR)', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: isMobile ? -5 : 0,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono',
                  fill: 'hsl(var(--muted-foreground))'
                }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line at 0% return */}
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                opacity={0.5}
              />
              
              {/* Holdings scatter */}
              <Scatter 
                name="Holdings" 
                data={chartData.holdingPoints}
                fill={HOLDING_COLOR}
              >
                {chartData.holdingPoints.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={HOLDING_COLOR}
                    fillOpacity={0.8}
                    stroke={HOLDING_COLOR}
                    strokeWidth={1}
                    r={Math.max(4, Math.min(12, entry.weight * 0.8))}
                  />
                ))}
              </Scatter>
              
              {/* Portfolio point */}
              <Scatter 
                name="Portfolio" 
                data={[chartData.portfolioPoint]}
                fill={PORTFOLIO_COLOR}
              >
                <Cell 
                  fill={PORTFOLIO_COLOR}
                  stroke="#fff"
                  strokeWidth={2}
                  r={10}
                />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: HOLDING_COLOR }}
            />
            <span className="text-[11px] font-mono text-muted-foreground">Holdings</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border-2 border-white" 
              style={{ backgroundColor: PORTFOLIO_COLOR }}
            />
            <span className="text-[11px] font-mono text-muted-foreground">Portfolio</span>
          </div>
        </div>
        
        {/* Excluded holdings note */}
        {excludedCount > 0 && (
          <div className="flex items-center gap-2 mt-3 p-2 bg-muted/30 rounded text-[10px] text-muted-foreground">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>
              {excludedCount} holding{excludedCount > 1 ? 's' : ''} excluded due to insufficient price history.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
