import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Dice6, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface MonteCarloSimulationProps {
  monthlyReturns: number[];
  currentValue: number;
}

interface SimulationResult {
  year: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

const SIMULATION_COUNT = 1000;
const TIME_HORIZONS = [20, 50, 65];

function runMonteCarloSimulation(
  monthlyReturns: number[],
  initialValue: number,
  years: number,
  simulations: number
): number[] {
  if (monthlyReturns.length < 2) return Array(simulations).fill(initialValue);

  const mean = monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length;
  const variance = monthlyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / monthlyReturns.length;
  const stdDev = Math.sqrt(variance);

  const finalValues: number[] = [];

  for (let sim = 0; sim < simulations; sim++) {
    let value = initialValue;
    for (let month = 0; month < years * 12; month++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const monthlyReturn = mean + stdDev * z;
      value *= (1 + monthlyReturn / 100);
    }
    finalValues.push(value);
  }

  return finalValues.sort((a, b) => a - b);
}

function getPercentile(sortedValues: number[], percentile: number): number {
  const index = Math.floor((percentile / 100) * sortedValues.length);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

function generateYearlyProjections(
  monthlyReturns: number[],
  initialValue: number,
  maxYears: number
): SimulationResult[] {
  const results: SimulationResult[] = [];
  
  for (let year = 0; year <= maxYears; year += 5) {
    if (year === 0) {
      results.push({
        year: 0,
        p5: initialValue,
        p25: initialValue,
        p50: initialValue,
        p75: initialValue,
        p95: initialValue,
      });
      continue;
    }

    const simResults = runMonteCarloSimulation(monthlyReturns, initialValue, year, SIMULATION_COUNT);
    results.push({
      year,
      p5: getPercentile(simResults, 5),
      p25: getPercentile(simResults, 25),
      p50: getPercentile(simResults, 50),
      p75: getPercentile(simResults, 75),
      p95: getPercentile(simResults, 95),
    });
  }

  return results;
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function MonteCarloSimulation({ monthlyReturns, currentValue }: MonteCarloSimulationProps) {
  const projections = useMemo(() => {
    return generateYearlyProjections(monthlyReturns, currentValue, 65);
  }, [monthlyReturns, currentValue]);

  const horizonResults = useMemo(() => {
    return TIME_HORIZONS.map(years => {
      const simResults = runMonteCarloSimulation(monthlyReturns, currentValue, years, SIMULATION_COUNT);
      return {
        years,
        p5: getPercentile(simResults, 5),
        p25: getPercentile(simResults, 25),
        p50: getPercentile(simResults, 50),
        p75: getPercentile(simResults, 75),
        p95: getPercentile(simResults, 95),
        probGain: (simResults.filter(v => v > currentValue).length / simResults.length) * 100,
        probDouble: (simResults.filter(v => v > currentValue * 2).length / simResults.length) * 100,
        probTriple: (simResults.filter(v => v > currentValue * 3).length / simResults.length) * 100,
      };
    });
  }, [monthlyReturns, currentValue]);

  if (monthlyReturns.length < 3) {
    return (
      <div className="bloomberg-panel p-6 text-center">
        <Dice6 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-xs">Need at least 3 months of data for Monte Carlo simulation</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Monte Carlo Chart */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <Dice6 className="h-3 w-3" />
            Monte Carlo Simulation ({SIMULATION_COUNT.toLocaleString()} scenarios)
          </span>
        </div>
        <div className="p-3">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projections} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v}Y`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={formatCurrency}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={50}
                  scale="log"
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0',
                    fontSize: '10px',
                    fontFamily: 'JetBrains Mono'
                  }}
                  labelStyle={{ color: 'hsl(var(--primary))' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      p5: '5th %ile (Worst)',
                      p25: '25th %ile',
                      p50: 'Median',
                      p75: '75th %ile',
                      p95: '95th %ile (Best)'
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  labelFormatter={(year) => `Year ${year}`}
                />
                {/* 5-95 percentile range (lightest) */}
                <Area 
                  type="monotone" 
                  dataKey="p95" 
                  stackId="1"
                  stroke="none"
                  fill="hsl(var(--success))"
                  fillOpacity={0.1}
                />
                <Area 
                  type="monotone" 
                  dataKey="p5" 
                  stackId="2"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />
                {/* 25-75 percentile range */}
                <Area 
                  type="monotone" 
                  dataKey="p75" 
                  stackId="3"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                />
                <Area 
                  type="monotone" 
                  dataKey="p25" 
                  stackId="4"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />
                {/* Median line */}
                <Area 
                  type="monotone" 
                  dataKey="p50" 
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="none"
                />
                {/* Reference lines for time horizons */}
                {TIME_HORIZONS.map(year => (
                  <ReferenceLine 
                    key={year}
                    x={year} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="3 3"
                    opacity={0.5}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-primary"></span> Median
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 bg-primary/15"></span> 25-75%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-2 bg-success/10"></span> 5-95%
            </span>
          </div>
        </div>
      </div>

      {/* Probability Tables for Each Horizon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {horizonResults.map((result) => (
          <div key={result.years} className="bloomberg-panel">
            <div className="bloomberg-header">
              <span className="bloomberg-header-title">{result.years}-Year Projection</span>
            </div>
            <div className="p-3 space-y-3">
              {/* Value Distribution */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-success flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Best (95%)
                  </span>
                  <span className="font-mono text-success">{formatCurrency(result.p95)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">75th %ile</span>
                  <span className="font-mono">{formatCurrency(result.p75)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-primary flex items-center gap-1">
                    <Target className="h-3 w-3" /> Median
                  </span>
                  <span className="font-mono text-primary font-semibold">{formatCurrency(result.p50)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">25th %ile</span>
                  <span className="font-mono">{formatCurrency(result.p25)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-destructive flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Worst (5%)
                  </span>
                  <span className="font-mono text-destructive">{formatCurrency(result.p5)}</span>
                </div>
              </div>

              {/* Probability Stats */}
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground">P(Gain)</span>
                  <span className={`font-mono ${result.probGain >= 50 ? 'text-success' : 'text-destructive'}`}>
                    {result.probGain.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground">P(2x)</span>
                  <span className="font-mono">{result.probDouble.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-muted-foreground">P(3x)</span>
                  <span className="font-mono">{result.probTriple.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Methodology Note */}
      <div className="text-[9px] text-muted-foreground px-1">
        * Based on {SIMULATION_COUNT.toLocaleString()} random simulations using historical mean return and volatility. 
        Results assume normal distribution of returns. Past performance does not guarantee future results.
      </div>
    </div>
  );
}
