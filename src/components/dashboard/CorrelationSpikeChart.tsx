import { useMemo } from 'react';
import { Transaction, MonthlyValuation, AssetType } from '@/types/investment';
import { ScenarioDefinition } from '@/data/scenarios';
import { calculatePositions, getLatestValuations } from '@/lib/calculations';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  ReferenceLine,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrelationSpikeChartProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  scenario: ScenarioDefinition;
}

// Asset class correlation pairs with normal and stressed correlations
interface CorrelationPair {
  name: string;
  pair: string;
  normalCorr: number;
  stressedCorr: number;
  delta: number;
}

// Base correlations under normal market conditions (empirical estimates)
const normalCorrelations: Record<string, Record<string, number>> = {
  equity: { equity: 1.0, bond: -0.2, commodity: 0.3, crypto: 0.5, real_estate: 0.5, alternative: 0.4 },
  bond: { equity: -0.2, bond: 1.0, commodity: 0.0, crypto: -0.1, real_estate: 0.3, alternative: 0.1 },
  commodity: { equity: 0.3, bond: 0.0, commodity: 1.0, crypto: 0.2, real_estate: 0.2, alternative: 0.3 },
  crypto: { equity: 0.5, bond: -0.1, commodity: 0.2, crypto: 1.0, real_estate: 0.2, alternative: 0.3 },
  real_estate: { equity: 0.5, bond: 0.3, commodity: 0.2, crypto: 0.2, real_estate: 1.0, alternative: 0.4 },
  alternative: { equity: 0.4, bond: 0.1, commodity: 0.3, crypto: 0.3, real_estate: 0.4, alternative: 1.0 },
  private_equity: { equity: 0.7, bond: 0.0, commodity: 0.2, crypto: 0.4, real_estate: 0.5, alternative: 0.5 },
  private_debt: { equity: 0.1, bond: 0.6, commodity: 0.1, crypto: 0.0, real_estate: 0.3, alternative: 0.2 },
  hedge_fund: { equity: 0.3, bond: 0.0, commodity: 0.2, crypto: 0.2, real_estate: 0.3, alternative: 0.6 },
};

// Stress multipliers for different scenario types
const stressCorrelationMultipliers: Record<string, number> = {
  liquidityShock: 0.85,    // Highest correlation spike
  historical: 0.75,
  macroShock: 0.70,
  equityCrash: 0.65,
  ratesShock: 0.40,
  fxShock: 0.35,
  custom: 0.50,
};

// Calculate stressed correlation (correlations converge toward 1 during stress)
function calculateStressedCorrelation(normalCorr: number, stressMultiplier: number): number {
  // During stress, correlations move toward 1 (or stay at 1 if already there)
  // Formula: stressed = normal + (1 - |normal|) * multiplier * sign(normal or positive)
  const targetCorr = normalCorr >= 0 ? 1 : 0.3; // Negative correlations become less negative in stress
  const delta = (targetCorr - normalCorr) * stressMultiplier;
  return Math.min(1, Math.max(-1, normalCorr + delta));
}

export function CorrelationSpikeChart({ transactions, valuations, scenario }: CorrelationSpikeChartProps) {
  // Get unique asset types in portfolio
  const portfolioAssetTypes = useMemo(() => {
    const positions = calculatePositions(transactions);
    const latestVals = getLatestValuations(valuations);
    const types = new Set<AssetType>();
    
    for (const [ticker, pos] of Object.entries(positions)) {
      if (pos.quantity <= 0) continue;
      const val = latestVals[ticker];
      const tx = transactions.find(t => t.ticker === ticker);
      if (!val || !tx) continue;
      types.add(tx.assetType);
    }
    
    return Array.from(types);
  }, [transactions, valuations]);

  // Calculate correlation pairs for portfolio asset types
  const correlationData = useMemo((): CorrelationPair[] => {
    const stressMultiplier = stressCorrelationMultipliers[scenario.type] || 0.50;
    const pairs: CorrelationPair[] = [];
    
    // Get simplified asset type names for display
    const simplifyType = (type: AssetType): string => {
      const map: Record<AssetType, string> = {
        equity: 'Equity',
        etf: 'ETF',
        mutual_fund: 'Fund',
        bond: 'Bond',
        commodity: 'Cmdty',
        crypto: 'Crypto',
        real_estate: 'RE',
        cash: 'Cash',
        alternative: 'Alts',
        private_equity: 'PE',
        private_debt: 'PD',
        hedge_fund: 'HF',
      };
      return map[type] || type;
    };
    
    // Map to base categories for correlation lookup
    const toBaseType = (type: AssetType): string => {
      if (['etf', 'mutual_fund'].includes(type)) return 'equity';
      if (['private_equity'].includes(type)) return 'equity';
      if (['private_debt'].includes(type)) return 'bond';
      if (['hedge_fund'].includes(type)) return 'alternative';
      return type;
    };
    
    // Create unique pairs
    for (let i = 0; i < portfolioAssetTypes.length; i++) {
      for (let j = i + 1; j < portfolioAssetTypes.length; j++) {
        const type1 = portfolioAssetTypes[i];
        const type2 = portfolioAssetTypes[j];
        const baseType1 = toBaseType(type1);
        const baseType2 = toBaseType(type2);
        
        const normalCorr = normalCorrelations[baseType1]?.[baseType2] ?? 
                          normalCorrelations[baseType2]?.[baseType1] ?? 0.3;
        const stressedCorr = calculateStressedCorrelation(normalCorr, stressMultiplier);
        
        pairs.push({
          name: `${simplifyType(type1)}/${simplifyType(type2)}`,
          pair: `${type1}-${type2}`,
          normalCorr: Number(normalCorr.toFixed(2)),
          stressedCorr: Number(stressedCorr.toFixed(2)),
          delta: Number((stressedCorr - normalCorr).toFixed(2)),
        });
      }
    }
    
    // Sort by delta (biggest spike first)
    return pairs.sort((a, b) => b.delta - a.delta);
  }, [portfolioAssetTypes, scenario.type]);

  // Calculate average correlation spike
  const avgSpike = useMemo(() => {
    if (correlationData.length === 0) return 0;
    const totalDelta = correlationData.reduce((sum, p) => sum + p.delta, 0);
    return totalDelta / correlationData.length;
  }, [correlationData]);

  // Calculate average stressed correlation
  const avgStressedCorr = useMemo(() => {
    if (correlationData.length === 0) return 0;
    const total = correlationData.reduce((sum, p) => sum + p.stressedCorr, 0);
    return total / correlationData.length;
  }, [correlationData]);

  if (portfolioAssetTypes.length < 2) {
    return (
      <div className="bg-muted/30 rounded p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Need at least 2 asset types to show correlation analysis
        </p>
      </div>
    );
  }

  const isLiquidityScenario = scenario.type === 'liquidityShock';

  return (
    <div className="space-y-3">
      {/* Header with metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">
            Correlation Spike Analysis
          </h4>
        </div>
        {isLiquidityScenario && (
          <div className="flex items-center gap-1 text-orange-400">
            <AlertTriangle className="h-3 w-3" />
            <span className="text-[10px] font-mono">HIGH STRESS</span>
          </div>
        )}
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/30 rounded p-2">
          <p className="text-[10px] text-muted-foreground">Avg Correlation Spike</p>
          <p className={cn(
            "text-lg font-mono font-bold",
            avgSpike > 0.3 ? "text-destructive" : avgSpike > 0.15 ? "text-orange-400" : "text-foreground"
          )}>
            +{(avgSpike * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-muted/30 rounded p-2">
          <p className="text-[10px] text-muted-foreground">Stressed Avg Corr</p>
          <p className={cn(
            "text-lg font-mono font-bold",
            avgStressedCorr > 0.7 ? "text-destructive" : avgStressedCorr > 0.5 ? "text-orange-400" : "text-foreground"
          )}>
            {avgStressedCorr.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bar chart comparing normal vs stressed */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={correlationData.slice(0, 6)} 
            layout="vertical" 
            margin={{ left: 55, right: 10, top: 5, bottom: 5 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis 
              type="number" 
              domain={[-0.5, 1]} 
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} 
              width={50}
            />
            <RechartsTooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                fontSize: 11 
              }}
              formatter={(value: number, name: string) => [
                value.toFixed(2),
                name === 'normalCorr' ? 'Normal' : 'Stressed'
              ]}
            />
            <Legend 
              wrapperStyle={{ fontSize: 10 }}
              formatter={(value) => (
                <span className="text-foreground">
                  {value === 'normalCorr' ? 'Normal' : 'Stressed'}
                </span>
              )}
            />
            <ReferenceLine x={0} stroke="hsl(var(--border))" />
            <Bar 
              dataKey="normalCorr" 
              fill="hsl(var(--muted-foreground))" 
              radius={[0, 2, 2, 0]}
              name="normalCorr"
            />
            <Bar 
              dataKey="stressedCorr" 
              fill="hsl(var(--destructive))" 
              radius={[0, 2, 2, 0]}
              name="stressedCorr"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1.5 text-muted-foreground font-medium">Pair</th>
              <th className="text-right py-1.5 text-muted-foreground font-medium">Normal</th>
              <th className="text-right py-1.5 text-muted-foreground font-medium">Stressed</th>
              <th className="text-right py-1.5 text-muted-foreground font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {correlationData.map((pair) => (
              <tr key={pair.pair} className="border-b border-border/50">
                <td className="py-1.5 font-mono">{pair.name}</td>
                <td className="py-1.5 text-right font-mono text-muted-foreground">
                  {pair.normalCorr.toFixed(2)}
                </td>
                <td className={cn(
                  "py-1.5 text-right font-mono",
                  pair.stressedCorr > 0.7 ? "text-destructive" : "text-foreground"
                )}>
                  {pair.stressedCorr.toFixed(2)}
                </td>
                <td className={cn(
                  "py-1.5 text-right font-mono",
                  pair.delta > 0.3 ? "text-destructive" : pair.delta > 0.15 ? "text-orange-400" : "text-positive"
                )}>
                  +{(pair.delta * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warning for high correlation */}
      {avgStressedCorr > 0.6 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded p-2 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
          <p className="text-[10px] text-destructive">
            <span className="font-semibold">Diversification Breakdown:</span> During this stress scenario, 
            cross-asset correlations spike significantly, reducing portfolio diversification benefits. 
            Consider adding uncorrelated assets or hedges.
          </p>
        </div>
      )}
    </div>
  );
}
