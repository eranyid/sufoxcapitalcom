import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
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
  
  // Get top 3 best risk-adjusted (highest positive rankChange)
  const top3RiskAdjusted = useMemo(() => {
    return [...slopeData]
      .sort((a, b) => b.rankChange - a.rankChange)
      .slice(0, 3);
  }, [slopeData]);
  
  // Chart dimensions - ENLARGED
  const chartHeight = Math.max(380, slopeData.length * 24);
  const leftX = isMobile ? 90 : 180;
  const rightX = isMobile ? 240 : 420;
  const svgWidth = isMobile ? 320 : 580;
  const topPadding = 45;
  const bottomPadding = 35;
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
      
      {/* Content - Two columns */}
      <div className={`flex-1 min-h-0 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-[1fr_200px] gap-6'}`}>
          
          {/* Chart (Left/Main) */}
          <div className="flex justify-center">
            <svg 
              width="100%" 
              height={chartHeight}
              viewBox={`0 0 ${svgWidth} ${chartHeight}`}
              className="overflow-visible"
              style={{ maxWidth: `${svgWidth}px` }}
            >
              {/* Column Headers */}
              <text 
                x={leftX} 
                y={22} 
                textAnchor="middle" 
                className="fill-muted-foreground"
                fontSize={isMobile ? 10 : 12}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={500}
              >
                Return Rank
              </text>
              <text 
                x={rightX} 
                y={22} 
                textAnchor="middle" 
                className="fill-muted-foreground"
                fontSize={isMobile ? 10 : 12}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={500}
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
                      strokeWidth={2}
                      opacity={0.75}
                    />
                    
                    {/* Left dot (Return rank) */}
                    <circle
                      cx={leftX}
                      cy={y1}
                      r={isMobile ? 5 : 6}
                      fill={color}
                    />
                    
                    {/* Right dot (Volatility rank) */}
                    <circle
                      cx={rightX}
                      cy={y2}
                      r={isMobile ? 5 : 6}
                      fill={color}
                    />
                    
                    {/* Ticker label (left side) */}
                    <text
                      x={leftX - (isMobile ? 10 : 14)}
                      y={y1}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-foreground"
                      fontSize={isMobile ? 9 : 11}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={600}
                    >
                      {d.ticker}
                    </text>
                    
                    {/* Return value (next to left dot) */}
                    <text
                      x={leftX + (isMobile ? 10 : 14)}
                      y={y1}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="fill-muted-foreground"
                      fontSize={isMobile ? 8 : 10}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {d.returnValue >= 0 ? '+' : ''}{d.returnValue.toFixed(0)}%
                    </text>
                    
                    {/* Volatility value (next to right dot) */}
                    <text
                      x={rightX + (isMobile ? 10 : 14)}
                      y={y2}
                      textAnchor="start"
                      dominantBaseline="middle"
                      className="fill-muted-foreground"
                      fontSize={isMobile ? 8 : 10}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {d.volatilityValue.toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Top 3 Risk-Adjusted (Right Side) */}
          <div className={`${isMobile ? 'order-first' : ''}`}>
            <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Top 3 Risk-Adjusted
                </span>
              </div>
              
              <div className="space-y-2.5">
                {top3RiskAdjusted.map((item, index) => (
                  <div 
                    key={item.ticker}
                    className="flex items-center gap-3 p-2 bg-card/50 rounded border border-border/20"
                  >
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ 
                        backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                        color: '#1a1a1a'
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-semibold text-foreground truncate">
                        {item.ticker}
                      </p>
                      <p className="font-mono text-[9px] text-muted-foreground truncate">
                        {item.name.length > 15 ? item.name.substring(0, 15) + '…' : item.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-foreground">
                        +{item.rankChange}
                      </p>
                      <p className="font-mono text-[8px] text-muted-foreground">
                        rank Δ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-[8px] text-muted-foreground mt-3 font-mono leading-tight">
                Holdings with better volatility rank than return rank
              </p>
            </div>
          </div>
        </div>
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
