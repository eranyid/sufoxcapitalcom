import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { RiskReturnPoint } from '@/lib/portfolioEngine';

interface ReturnVolatilitySlopeChartProps {
  holdings: RiskReturnPoint[];
}

// Colors
const IMPROVED_COLOR = '#4A90D9'; // Blue - improved rank (lower vol or higher return rank)
const WORSENED_COLOR = '#F59E0B'; // Orange/Yellow - worsened rank

interface SlopeData {
  ticker: string;
  name: string;
  returnValue: number;
  volatilityValue: number;
  returnRank: number;
  volatilityRank: number;
  rankChange: number; // positive = improved (lower vol rank than return rank)
}

export function ReturnVolatilitySlopeChart({ holdings }: ReturnVolatilitySlopeChartProps) {
  const isMobile = useIsMobile();
  
  // Calculate ranks and prepare data
  const slopeData = useMemo(() => {
    if (holdings.length < 2) return [];
    
    // Sort by return (descending) to get return ranks
    const byReturn = [...holdings].sort((a, b) => b.annualizedReturn - a.annualizedReturn);
    const returnRanks = new Map<string, number>();
    byReturn.forEach((h, i) => returnRanks.set(h.ticker, i + 1));
    
    // Sort by volatility (ascending - lower is better) to get volatility ranks
    const byVolatility = [...holdings].sort((a, b) => a.annualizedVolatility - b.annualizedVolatility);
    const volatilityRanks = new Map<string, number>();
    byVolatility.forEach((h, i) => volatilityRanks.set(h.ticker, i + 1));
    
    // Build slope data
    const data: SlopeData[] = holdings.map(h => {
      const returnRank = returnRanks.get(h.ticker) || 0;
      const volatilityRank = volatilityRanks.get(h.ticker) || 0;
      return {
        ticker: h.ticker,
        name: h.name,
        returnValue: h.annualizedReturn,
        volatilityValue: h.annualizedVolatility,
        returnRank,
        volatilityRank,
        rankChange: returnRank - volatilityRank // positive = better vol rank than return rank
      };
    });
    
    // Sort by return rank for consistent display
    return data.sort((a, b) => a.returnRank - b.returnRank);
  }, [holdings]);
  
  // Chart dimensions
  const chartHeight = Math.max(300, slopeData.length * 20);
  const leftX = isMobile ? 80 : 120;
  const rightX = isMobile ? 220 : 320;
  const topPadding = 40;
  const bottomPadding = 30;
  const usableHeight = chartHeight - topPadding - bottomPadding;
  
  // Calculate Y position for a rank
  const getY = (rank: number) => {
    const step = usableHeight / (slopeData.length + 1);
    return topPadding + step * rank;
  };
  
  // Empty state
  if (slopeData.length < 2) {
    return (
      <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-secondary">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Return vs Volatility Ranking
          </h3>
        </div>
        <div className="p-8 text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Not enough holdings with history to show rank comparison.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card border border-border/40 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 bg-secondary flex-shrink-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Return vs Volatility Ranking
        </h3>
        <p className="text-[9px] text-muted-foreground font-mono mt-0.5 leading-tight">
          Compare holdings rank by return vs. by volatility (lower = better)
        </p>
      </div>
      
      {/* Chart */}
      <div className={`flex-1 min-h-0 ${isMobile ? 'px-2 py-3' : 'px-4 py-4'}`}>
        <svg 
          width="100%" 
          height={chartHeight}
          viewBox={`0 0 ${isMobile ? 280 : 400} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Column Headers */}
          <text 
            x={leftX} 
            y={20} 
            textAnchor="middle" 
            className="fill-muted-foreground"
            fontSize={isMobile ? 9 : 11}
            fontFamily="JetBrains Mono, monospace"
          >
            Return Rank
          </text>
          <text 
            x={rightX} 
            y={20} 
            textAnchor="middle" 
            className="fill-muted-foreground"
            fontSize={isMobile ? 9 : 11}
            fontFamily="JetBrains Mono, monospace"
          >
            Volatility Rank
          </text>
          
          {/* Vertical axis lines */}
          <line 
            x1={leftX} 
            y1={topPadding} 
            x2={leftX} 
            y2={chartHeight - bottomPadding}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="2 2"
            opacity={0.5}
          />
          <line 
            x1={rightX} 
            y1={topPadding} 
            x2={rightX} 
            y2={chartHeight - bottomPadding}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray="2 2"
            opacity={0.5}
          />
          
          {/* Slope lines and dots */}
          {slopeData.map((d, _i) => {
            const y1 = getY(d.returnRank);
            const y2 = getY(d.volatilityRank);
            const isImproved = d.rankChange >= 0; // vol rank <= return rank (better risk-adjusted)
            const color = isImproved ? IMPROVED_COLOR : WORSENED_COLOR;
            
            return (
              <g key={d.ticker}>
                {/* Connection line */}
                <line
                  x1={leftX}
                  y1={y1}
                  x2={rightX}
                  y2={y2}
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.7}
                />
                
                {/* Left dot (Return rank) */}
                <circle
                  cx={leftX}
                  cy={y1}
                  r={isMobile ? 4 : 5}
                  fill={color}
                />
                
                {/* Right dot (Volatility rank) */}
                <circle
                  cx={rightX}
                  cy={y2}
                  r={isMobile ? 4 : 5}
                  fill={color}
                />
                
                {/* Ticker label (left side) */}
                <text
                  x={leftX - (isMobile ? 8 : 12)}
                  y={y1}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-foreground"
                  fontSize={isMobile ? 8 : 10}
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight={500}
                >
                  {d.ticker}
                </text>
                
                {/* Return value (next to left dot) */}
                <text
                  x={leftX + (isMobile ? 8 : 12)}
                  y={y1}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  fontSize={isMobile ? 7 : 9}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.returnValue >= 0 ? '+' : ''}{d.returnValue.toFixed(0)}%
                </text>
                
                {/* Volatility value (next to right dot) */}
                <text
                  x={rightX + (isMobile ? 8 : 12)}
                  y={y2}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  fontSize={isMobile ? 7 : 9}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {d.volatilityValue.toFixed(0)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className={`flex items-center justify-center gap-6 ${isMobile ? 'py-2 px-2' : 'py-3 px-3'} border-t border-border/30 flex-shrink-0`}>
        <div className="flex items-center gap-1.5">
          <TrendingUp className={`${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} style={{ color: IMPROVED_COLOR }} />
          <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-mono text-muted-foreground`}>
            Better Risk-Adjusted
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className={`${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} style={{ color: WORSENED_COLOR }} />
          <span className={`${isMobile ? 'text-[9px]' : 'text-[10px]'} font-mono text-muted-foreground`}>
            Worse Risk-Adjusted
          </span>
        </div>
      </div>
    </div>
  );
}
