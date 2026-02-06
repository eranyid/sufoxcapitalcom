import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, TrendingUp, TrendingDown, BarChart3, AlertTriangle } from 'lucide-react';
import { BloombergPanel } from '@/components/ui/bloomberg-panel';
import { cn } from '@/lib/utils';
import {
  type AssetScenarioReturns,
  type AssetERResult,
  type ScenarioProbabilities,
  type ScenarioKey,
  SCENARIO_LABELS,
  SCENARIO_COLORS,
  SCENARIO_KEYS,
  DEFAULT_PROBABILITIES,
  calculateAssetER,
  calculatePortfolioER,
} from '@/types/constructionPipeline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Cell, ReferenceLine, Legend, Tooltip as RechartsTooltip,
} from 'recharts';

interface ScenarioERStepProps {
  /** Asset classes from Phase 1 with their target weights */
  assetClasses: { name: string; weight: number }[];
  /** Risk-free rate */
  riskFreeRate: number;
  /** Callback when E(R) results are calculated */
  onResultsChange: (results: AssetERResult[]) => void;
  /** Called when user completes this phase */
  onComplete: () => void;
}

// Default scenario returns by asset class type
function getDefaultReturns(name: string): Record<ScenarioKey, number> {
  const n = name.toLowerCase();
  if (n.includes('equit') || n.includes('stock')) {
    return { large_growth: 31, normal_growth: 14, mild_recession: -6.75, severe_recession: -52 };
  }
  if (n.includes('bond') || n.includes('fixed')) {
    return { large_growth: 8, normal_growth: 5, mild_recession: 2, severe_recession: -5 };
  }
  if (n.includes('real estate') || n.includes('reit')) {
    return { large_growth: 22, normal_growth: 10, mild_recession: -8, severe_recession: -35 };
  }
  if (n.includes('commodit') || n.includes('gold')) {
    return { large_growth: 15, normal_growth: 5, mild_recession: -3, severe_recession: 10 };
  }
  if (n.includes('cash') || n.includes('money')) {
    return { large_growth: 2, normal_growth: 2, mild_recession: 2, severe_recession: 2 };
  }
  if (n.includes('hedge') || n.includes('alternative')) {
    return { large_growth: 18, normal_growth: 8, mild_recession: -4, severe_recession: -20 };
  }
  // Default
  return { large_growth: 15, normal_growth: 8, mild_recession: -3, severe_recession: -15 };
}

const SCENARIO_ICONS: Record<ScenarioKey, typeof TrendingUp> = {
  large_growth: TrendingUp,
  normal_growth: TrendingUp,
  mild_recession: TrendingDown,
  severe_recession: TrendingDown,
};

export function ScenarioERStep({ assetClasses, riskFreeRate, onResultsChange, onComplete }: ScenarioERStepProps) {
  const [probabilities, setProbabilities] = useState<ScenarioProbabilities>(DEFAULT_PROBABILITIES);
  const [assetReturns, setAssetReturns] = useState<AssetScenarioReturns[]>(() =>
    assetClasses.map(ac => ({
      assetClass: ac.name,
      returns: getDefaultReturns(ac.name),
    }))
  );

  // Calculate results
  const results = useMemo(() => {
    return assetReturns.map(ar =>
      calculateAssetER(ar, probabilities, riskFreeRate)
    );
  }, [assetReturns, probabilities, riskFreeRate]);

  // Portfolio-level metrics
  const weights = useMemo(() => {
    const w: Record<string, number> = {};
    assetClasses.forEach(ac => { w[ac.name] = ac.weight; });
    return w;
  }, [assetClasses]);

  const portfolioMetrics = useMemo(() =>
    calculatePortfolioER(results, weights),
    [results, weights]
  );

  // Probability sum validation
  const probSum = SCENARIO_KEYS.reduce((s, k) => s + probabilities[k], 0);
  const probValid = Math.abs(probSum - 1) < 0.001;

  // Update probability
  const updateProbability = (key: ScenarioKey, value: number) => {
    setProbabilities(prev => ({ ...prev, [key]: value }));
  };

  // Update asset return
  const updateReturn = (assetIndex: number, scenario: ScenarioKey, value: number) => {
    setAssetReturns(prev => {
      const next = [...prev];
      next[assetIndex] = {
        ...next[assetIndex],
        returns: { ...next[assetIndex].returns, [scenario]: value },
      };
      return next;
    });
  };

  // Handle complete
  const handleComplete = () => {
    onResultsChange(results);
    onComplete();
  };

  // Chart data for E(r) comparison
  const chartData = results.map((r, i) => ({
    name: r.assetClass.length > 12 ? r.assetClass.slice(0, 12) + '…' : r.assetClass,
    fullName: r.assetClass,
    er: Number(r.expectedReturn.toFixed(2)),
    vol: Number(r.standardDeviation.toFixed(2)),
    weight: assetClasses[i]?.weight || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Probability Distribution */}
      <BloombergPanel
        title="Scenario Probabilities"
        titleIcon={<BarChart3 className="h-4 w-4 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            {!probValid && (
              <div className="flex items-center gap-1 text-destructive text-[10px] font-mono">
                <AlertTriangle className="h-3 w-3" />
                Sum: {(probSum * 100).toFixed(0)}% ≠ 100%
              </div>
            )}
            <span className={cn(
              "font-mono text-xs px-2 py-0.5 rounded",
              probValid ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            )}>
              Σ = {(probSum * 100).toFixed(0)}%
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
          {SCENARIO_KEYS.map(key => {
            const Icon = SCENARIO_ICONS[key];
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" style={{ color: SCENARIO_COLORS[key] }} />
                  <span className="text-xs font-medium">{SCENARIO_LABELS[key]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[probabilities[key] * 100]}
                    onValueChange={([v]) => updateProbability(key, v / 100)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={(probabilities[key] * 100).toFixed(0)}
                    onChange={(e) => updateProbability(key, parseFloat(e.target.value) / 100 || 0)}
                    className="w-16 h-7 text-xs font-mono text-center"
                    step="1"
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
            );
          })}
        </div>
      </BloombergPanel>

      {/* Scenario Returns Table */}
      <BloombergPanel
        title="Scenario Returns by Asset Class"
        titleIcon={<Info className="h-4 w-4 text-primary" />}
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-card z-10 min-w-[140px]">
                  Asset Class
                </th>
                {SCENARIO_KEYS.map(key => (
                  <th key={key} className="px-3 py-3 font-medium text-center min-w-[90px]" style={{ color: SCENARIO_COLORS[key] }}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{SCENARIO_LABELS[key]}</span>
                      <span className="text-[9px] text-muted-foreground/60 font-mono">
                        p={((probabilities[key]) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 font-semibold text-center text-primary min-w-[80px]">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 justify-center mx-auto">
                      E(r) <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>E(r) = Σ p(s) × r(s)</TooltipContent>
                  </Tooltip>
                </th>
                <th className="px-3 py-3 font-semibold text-center text-rose-400 min-w-[70px]">
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1 justify-center mx-auto">
                      σ <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>σ = √(Σ p(s) × [r(s) - E(r)]²)</TooltipContent>
                  </Tooltip>
                </th>
                <th className="px-3 py-3 font-semibold text-center text-amber-400 min-w-[70px]">
                  Sharpe
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {assetReturns.map((asset, i) => {
                const result = results[i];
                return (
                  <tr key={asset.assetClass} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-2.5 font-medium sticky left-0 bg-card group-hover:bg-muted/20 z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 rounded-full bg-primary/30" />
                        <span>{asset.assetClass}</span>
                      </div>
                    </td>
                    {SCENARIO_KEYS.map(key => (
                      <td key={key} className="px-3 py-2.5 text-center">
                        <span className={cn(
                          "font-mono text-xs",
                          asset.returns[key] >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {asset.returns[key].toFixed(1)}%
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "font-mono font-bold text-sm",
                        result.expectedReturn >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {result.expectedReturn.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-mono text-rose-400">
                        {result.standardDeviation.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "font-mono",
                        result.sharpeRatio >= 0.5 ? "text-primary" :
                        result.sharpeRatio >= 0 ? "text-amber-400" : "text-rose-400"
                      )}>
                        {result.sharpeRatio.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Portfolio row */}
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-primary/5">
                <td className="px-4 py-3 font-bold text-primary sticky left-0 bg-primary/5 z-10">
                  Portfolio E(r)
                </td>
                {SCENARIO_KEYS.map(key => (
                  <td key={key} className="px-3 py-3 text-center">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {(assetReturns.reduce((sum, ar, i) => {
                        const w = (assetClasses[i]?.weight || 0) / 100;
                        return sum + w * ar.returns[key];
                      }, 0)).toFixed(2)}%
                    </span>
                  </td>
                ))}
                <td className="px-3 py-3 text-center">
                  <span className="font-mono font-bold text-lg text-primary">
                    {portfolioMetrics.expectedReturn.toFixed(2)}%
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="font-mono text-rose-400">
                    {portfolioMetrics.weightedVolatility.toFixed(2)}%
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="font-mono text-muted-foreground">—</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </BloombergPanel>

      {/* E(r) Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart: E(r) per asset */}
        <BloombergPanel title="Expected Return by Asset" titleIcon={<TrendingUp className="h-4 w-4 text-emerald-400" />}>
          <div className="h-[280px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={100}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name === 'er' ? 'E(r)' : 'Vol']}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.name === label);
                    return item?.fullName || label;
                  }}
                />
                <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" opacity={0.5} />
                <Bar dataKey="er" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.er >= 0 ? 'hsl(var(--primary))' : 'hsl(0, 72%, 51%)'}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BloombergPanel>

        {/* Risk-Return Scatter-like comparison */}
        <BloombergPanel title="Risk vs Return" titleIcon={<BarChart3 className="h-4 w-4 text-amber-400" />}>
          <div className="h-[280px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`,
                    name === 'er' ? 'Expected Return' : 'Volatility'
                  ]}
                />
                <Legend
                  formatter={(value) => value === 'er' ? 'E(r)' : 'Volatility (σ)'}
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Bar dataKey="er" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="vol" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} maxBarSize={24} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BloombergPanel>
      </div>

      {/* Formula Reference */}
      <Card className="border-border/30 bg-muted/10">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground space-y-1 font-mono">
              <p><strong>E(r)</strong> = Σ p(s) × r(s) — Probability-weighted expected return</p>
              <p><strong>σ²</strong> = Σ p(s) × [r(s) - E(r)]² — Variance of returns</p>
              <p><strong>Sharpe</strong> = [E(r) - Rf] / σ — Risk-adjusted return (Rf = {riskFreeRate}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          onClick={handleComplete}
          disabled={!probValid}
          size="lg"
          className="gap-2 font-mono"
        >
          CONFIRM E(R) & CONTINUE
        </Button>
      </div>
    </div>
  );
}
