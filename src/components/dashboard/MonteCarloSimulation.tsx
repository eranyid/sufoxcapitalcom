import { useState, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, BarChart, Bar, Cell, ComposedChart, Line
} from 'recharts';
import { Dice6, Settings2, TrendingUp, TrendingDown, Target, AlertTriangle, Zap, Database, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MonteCarloSimulationProps {
  monthlyReturns: number[];
  currentValue: number;
  // Portfolio statistics passed from parent
  portfolioCAGR?: number;     // Annualized expected return
  portfolioVolatility?: number; // Annualized volatility
  portfolioSharpe?: number;   // Sharpe ratio
  riskFreeRate?: number;      // Risk-free rate for calculations
}

type InputMode = 'portfolio' | 'manual';

interface SimulationConfig {
  numSimulations: number;
  timeStep: 'monthly' | 'daily';
}

interface ManualInputs {
  cagr: number;
  volatility: number;
  currentValue: number;
}

interface PercentilePath {
  period: number;
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

interface HorizonResult {
  horizon: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  probGain: number;
  probLoss: number;
  var95: number;
  cvar95: number;
  expectedValue: number;
}

interface DistributionBin {
  range: string;
  count: number;
  percentage: number;
  midpoint: number;
}

interface ValidationErrors {
  cagr?: string;
  volatility?: string;
  currentValue?: string;
}

const TIME_HORIZONS = [20, 50, 65];
const DEFAULT_CONFIG: SimulationConfig = {
  numSimulations: 10000,
  timeStep: 'monthly',
};

// Convert simple returns to log returns
function toLogReturns(simpleReturns: number[]): number[] {
  return simpleReturns.map(r => Math.log(1 + r / 100));
}

// Calculate statistics from log returns
function calculateStats(logReturns: number[]): { mean: number; std: number } {
  const n = logReturns.length;
  if (n === 0) return { mean: 0, std: 0 };
  
  const mean = logReturns.reduce((a, b) => a + b, 0) / n;
  const variance = logReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);
  
  return { mean, std };
}

// Box-Muller transform for generating standard normal random numbers
function generateNormalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Run Monte Carlo simulation with proper financial modeling
function runMonteCarloSimulation(
  initialValue: number,
  yearsToSimulate: number,
  annualReturn: number, // Expected annual return (decimal)
  annualVol: number,    // Annual volatility (decimal)
  config: SimulationConfig
): { paths: number[][]; finalValues: number[] } {
  const { numSimulations, timeStep } = config;
  
  // Adjust for time step
  const stepsPerYear = timeStep === 'monthly' ? 12 : 252;
  const totalSteps = yearsToSimulate * stepsPerYear;
  const stepMean = annualReturn / stepsPerYear;
  const stepStd = annualVol / Math.sqrt(stepsPerYear);
  
  const paths: number[][] = [];
  const finalValues: number[] = [];
  
  // Run simulations
  for (let sim = 0; sim < numSimulations; sim++) {
    const path: number[] = [initialValue];
    let value = initialValue;
    
    for (let step = 0; step < totalSteps; step++) {
      // Generate correlated random shock using log-normal model
      const z = generateNormalRandom();
      const logReturn = stepMean - 0.5 * stepStd * stepStd + stepStd * z;
      value = value * Math.exp(logReturn);
      
      // Store path at yearly intervals
      if ((step + 1) % stepsPerYear === 0) {
        path.push(value);
      }
    }
    
    paths.push(path);
    finalValues.push(value);
  }
  
  return { paths, finalValues: finalValues.sort((a, b) => a - b) };
}

// Get percentile from sorted array
function getPercentile(sortedValues: number[], percentile: number): number {
  const index = Math.floor((percentile / 100) * sortedValues.length);
  return sortedValues[Math.min(index, sortedValues.length - 1)];
}

// Calculate VaR and CVaR from simulation results
function calculateRiskMetrics(sortedFinalValues: number[], initialValue: number): { var95: number; cvar95: number } {
  const n = sortedFinalValues.length;
  const cutoffIndex = Math.floor(0.05 * n);
  
  const p5Value = sortedFinalValues[cutoffIndex];
  const var95 = ((p5Value - initialValue) / initialValue) * 100;
  
  // CVaR is the average of all values below VaR
  const tailValues = sortedFinalValues.slice(0, cutoffIndex + 1);
  const avgTailValue = tailValues.reduce((a, b) => a + b, 0) / tailValues.length;
  const cvar95 = ((avgTailValue - initialValue) / initialValue) * 100;
  
  return { var95, cvar95 };
}

// Generate percentile paths for fan chart
function generatePercentilePaths(
  initialValue: number,
  maxYears: number,
  annualReturn: number,
  annualVol: number,
  config: SimulationConfig
): PercentilePath[] {
  const results: PercentilePath[] = [];
  
  for (let year = 0; year <= maxYears; year += (year < 10 ? 1 : 5)) {
    if (year === 0) {
      results.push({
        period: 0,
        p5: initialValue,
        p10: initialValue,
        p25: initialValue,
        p50: initialValue,
        p75: initialValue,
        p90: initialValue,
        p95: initialValue,
      });
      continue;
    }
    
    const { finalValues } = runMonteCarloSimulation(
      initialValue, 
      year, 
      annualReturn, 
      annualVol, 
      { ...config, numSimulations: Math.min(config.numSimulations, 2000) }
    );
    
    results.push({
      period: year,
      p5: getPercentile(finalValues, 5),
      p10: getPercentile(finalValues, 10),
      p25: getPercentile(finalValues, 25),
      p50: getPercentile(finalValues, 50),
      p75: getPercentile(finalValues, 75),
      p90: getPercentile(finalValues, 90),
      p95: getPercentile(finalValues, 95),
    });
  }
  
  return results;
}

// Generate distribution histogram
function generateDistribution(sortedValues: number[], numBins: number = 30): DistributionBin[] {
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const range = max - min;
  const binWidth = range / numBins;
  
  const bins: DistributionBin[] = [];
  
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    const count = sortedValues.filter(v => v >= binStart && v < binEnd).length;
    
    bins.push({
      range: formatCurrency(binStart + binWidth / 2),
      count,
      percentage: (count / sortedValues.length) * 100,
      midpoint: binStart + binWidth / 2,
    });
  }
  
  return bins;
}

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function validateManualInputs(inputs: ManualInputs): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (inputs.cagr < -50 || inputs.cagr > 100) {
    errors.cagr = 'CAGR must be between -50% and +100%';
  }
  
  if (inputs.volatility < 0 || inputs.volatility > 100) {
    errors.volatility = 'Volatility must be between 0% and 100%';
  }
  
  if (inputs.currentValue <= 0) {
    errors.currentValue = 'Current value must be greater than 0';
  }
  
  return errors;
}

export function MonteCarloSimulation({ 
  monthlyReturns, 
  currentValue,
  portfolioCAGR,
  portfolioVolatility,
  portfolioSharpe,
  riskFreeRate = 4.5
}: MonteCarloSimulationProps) {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [inputMode, setInputMode] = useState<InputMode>('portfolio');
  const [isRunning, setIsRunning] = useState(false);
  
  // Calculate stats from monthly returns (fallback if no portfolio stats provided)
  const logReturns = useMemo(() => toLogReturns(monthlyReturns), [monthlyReturns]);
  const historicalStats = useMemo(() => calculateStats(logReturns), [logReturns]);
  
  // Derive portfolio statistics from props or calculate from history
  const derivedCAGR = useMemo(() => {
    if (portfolioCAGR !== undefined) return portfolioCAGR;
    return (Math.exp(historicalStats.mean * 12) - 1) * 100;
  }, [portfolioCAGR, historicalStats.mean]);
  
  const derivedVolatility = useMemo(() => {
    if (portfolioVolatility !== undefined) return portfolioVolatility;
    return historicalStats.std * Math.sqrt(12) * 100;
  }, [portfolioVolatility, historicalStats.std]);
  
  const derivedSharpe = useMemo(() => {
    if (portfolioSharpe !== undefined) return portfolioSharpe;
    if (derivedVolatility === 0) return 0;
    return (derivedCAGR - riskFreeRate) / derivedVolatility;
  }, [portfolioSharpe, derivedCAGR, derivedVolatility, riskFreeRate]);
  
  // Manual inputs state - initialized with portfolio values
  const [manualInputs, setManualInputs] = useState<ManualInputs>({
    cagr: derivedCAGR,
    volatility: derivedVolatility,
    currentValue: currentValue
  });
  
  // Validate manual inputs
  const validationErrors = useMemo(() => 
    inputMode === 'manual' ? validateManualInputs(manualInputs) : {},
    [inputMode, manualInputs]
  );
  
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  
  // Effective values based on mode
  const effectiveCAGR = inputMode === 'portfolio' ? derivedCAGR : manualInputs.cagr;
  const effectiveVolatility = inputMode === 'portfolio' ? derivedVolatility : manualInputs.volatility;
  const effectiveValue = inputMode === 'portfolio' ? currentValue : manualInputs.currentValue;
  const effectiveSharpe = inputMode === 'portfolio' 
    ? derivedSharpe 
    : (manualInputs.volatility > 0 ? (manualInputs.cagr - riskFreeRate) / manualInputs.volatility : 0);
  
  // Generate fan chart data
  const fanChartData = useMemo(() => {
    if (monthlyReturns.length < 3 && inputMode === 'portfolio') return [];
    if (hasValidationErrors && inputMode === 'manual') return [];
    
    setIsRunning(true);
    const data = generatePercentilePaths(
      effectiveValue, 
      65, 
      effectiveCAGR / 100, 
      effectiveVolatility / 100, 
      config
    );
    setIsRunning(false);
    return data;
  }, [monthlyReturns.length, effectiveValue, effectiveCAGR, effectiveVolatility, config, inputMode, hasValidationErrors]);
  
  // Generate horizon results
  const horizonResults = useMemo((): HorizonResult[] => {
    if (monthlyReturns.length < 3 && inputMode === 'portfolio') return [];
    if (hasValidationErrors && inputMode === 'manual') return [];
    
    return TIME_HORIZONS.map(horizon => {
      const { finalValues } = runMonteCarloSimulation(
        effectiveValue, 
        horizon, 
        effectiveCAGR / 100, 
        effectiveVolatility / 100, 
        config
      );
      const { var95, cvar95 } = calculateRiskMetrics(finalValues, effectiveValue);
      
      const probGain = (finalValues.filter(v => v > effectiveValue).length / finalValues.length) * 100;
      const probLoss = 100 - probGain;
      
      return {
        horizon,
        p5: getPercentile(finalValues, 5),
        p25: getPercentile(finalValues, 25),
        p50: getPercentile(finalValues, 50),
        p75: getPercentile(finalValues, 75),
        p95: getPercentile(finalValues, 95),
        probGain,
        probLoss,
        var95,
        cvar95,
        expectedValue: finalValues.reduce((a, b) => a + b, 0) / finalValues.length,
      };
    });
  }, [monthlyReturns.length, effectiveValue, effectiveCAGR, effectiveVolatility, config, inputMode, hasValidationErrors]);
  
  // Distribution for 20-year horizon
  const distribution = useMemo(() => {
    if (monthlyReturns.length < 3 && inputMode === 'portfolio') return [];
    if (hasValidationErrors && inputMode === 'manual') return [];
    
    const { finalValues } = runMonteCarloSimulation(
      effectiveValue, 
      20, 
      effectiveCAGR / 100, 
      effectiveVolatility / 100, 
      config
    );
    return generateDistribution(finalValues, 40);
  }, [monthlyReturns.length, effectiveValue, effectiveCAGR, effectiveVolatility, config, inputMode, hasValidationErrors]);
  
  // Update manual inputs when portfolio values change
  const syncWithPortfolio = useCallback(() => {
    setManualInputs({
      cagr: derivedCAGR,
      volatility: derivedVolatility,
      currentValue: currentValue
    });
  }, [derivedCAGR, derivedVolatility, currentValue]);
  
  if (monthlyReturns.length < 3 && inputMode === 'portfolio') {
    return (
      <div className="bloomberg-panel p-6 text-center">
        <Dice6 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-xs">Minimum 3 months of returns required for Monte Carlo simulation</p>
        <button 
          onClick={() => setInputMode('manual')}
          className="mt-2 text-[10px] text-primary hover:underline"
        >
          Or switch to Manual Input mode →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with Mode Toggle & Stats */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <Dice6 className="h-3 w-3" />
            Monte Carlo Risk Engine
            {isRunning && <Zap className="h-3 w-3 animate-pulse text-warning" />}
          </span>
          <span className="text-[9px] text-muted-foreground font-mono">
            {config.numSimulations.toLocaleString()} simulations • {config.timeStep} steps
          </span>
        </div>
        
        {/* Mode Toggle */}
        <div className="px-3 py-2 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Mode:</Label>
              <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
                <TabsList className="h-6">
                  <TabsTrigger value="portfolio" className="text-[9px] h-5 px-2 gap-1">
                    <Database className="h-3 w-3" />
                    Use Portfolio Data
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-[9px] h-5 px-2 gap-1">
                    <Pencil className="h-3 w-3" />
                    Manual Input
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {inputMode === 'manual' && (
              <button 
                onClick={syncWithPortfolio}
                className="text-[9px] text-primary hover:underline"
              >
                Reset to portfolio values
              </button>
            )}
          </div>
          <p className="text-[8px] text-muted-foreground mt-1">
            {inputMode === 'portfolio' 
              ? 'Inputs are derived from your current portfolio statistics.' 
              : 'You can experiment with your own assumptions.'}
          </p>
        </div>
        
        {/* Key Stats / Inputs */}
        <div className="p-3 grid grid-cols-2 md:grid-cols-6 gap-3 border-b border-border">
          {/* Expected CAGR */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Expected CAGR</div>
            {inputMode === 'portfolio' ? (
              <div className={`font-mono text-sm font-semibold ${effectiveCAGR >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatPercent(effectiveCAGR)}
              </div>
            ) : (
              <div>
                <Input 
                  type="number"
                  value={manualInputs.cagr}
                  onChange={(e) => setManualInputs(prev => ({ ...prev, cagr: parseFloat(e.target.value) || 0 }))}
                  className="h-7 text-[10px] font-mono w-20"
                  min={-50}
                  max={100}
                  step={0.5}
                />
                {validationErrors.cagr && (
                  <p className="text-[8px] text-destructive mt-0.5">{validationErrors.cagr}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Volatility */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Volatility (σ)</div>
            {inputMode === 'portfolio' ? (
              <div className="font-mono text-sm font-semibold text-warning">{effectiveVolatility.toFixed(1)}%</div>
            ) : (
              <div>
                <Input 
                  type="number"
                  value={manualInputs.volatility}
                  onChange={(e) => setManualInputs(prev => ({ ...prev, volatility: parseFloat(e.target.value) || 0 }))}
                  className="h-7 text-[10px] font-mono w-20"
                  min={0}
                  max={100}
                  step={0.5}
                />
                {validationErrors.volatility && (
                  <p className="text-[8px] text-destructive mt-0.5">{validationErrors.volatility}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Current Value */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Current Value</div>
            {inputMode === 'portfolio' ? (
              <div className="font-mono text-sm font-semibold text-primary">{formatCurrency(effectiveValue)}</div>
            ) : (
              <div>
                <Input 
                  type="number"
                  value={manualInputs.currentValue}
                  onChange={(e) => setManualInputs(prev => ({ ...prev, currentValue: parseFloat(e.target.value) || 0 }))}
                  className="h-7 text-[10px] font-mono w-24"
                  min={0}
                  step={1000}
                />
                {validationErrors.currentValue && (
                  <p className="text-[8px] text-destructive mt-0.5">{validationErrors.currentValue}</p>
                )}
              </div>
            )}
          </div>
          
          {/* Data Points */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Data Points</div>
            <div className="font-mono text-sm">
              {inputMode === 'portfolio' ? `${monthlyReturns.length} months` : '—'}
            </div>
          </div>
          
          {/* Sharpe Estimate */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Sharpe Est.</div>
            <div className="font-mono text-sm">
              {effectiveSharpe !== 0 ? effectiveSharpe.toFixed(2) : 'N/A'}
            </div>
          </div>
          
          {/* Model */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Model</div>
            <div className="font-mono text-[10px] text-muted-foreground">Log-Normal GBM</div>
          </div>
        </div>
        
        {/* Configuration Panel */}
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20">
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider">Simulations</Label>
            <Select 
              value={config.numSimulations.toString()} 
              onValueChange={(v) => setConfig(c => ({ ...c, numSimulations: parseInt(v) }))}
            >
              <SelectTrigger className="h-7 text-[10px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1,000</SelectItem>
                <SelectItem value="5000">5,000</SelectItem>
                <SelectItem value="10000">10,000</SelectItem>
                <SelectItem value="25000">25,000</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider">Time Step</Label>
            <Select 
              value={config.timeStep} 
              onValueChange={(v: 'monthly' | 'daily') => setConfig(c => ({ ...c, timeStep: v }))}
            >
              <SelectTrigger className="h-7 text-[10px] font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="col-span-2 flex items-end">
            <div className="text-[8px] text-muted-foreground leading-tight">
              <Settings2 className="h-3 w-3 inline mr-1" />
              {inputMode === 'portfolio' 
                ? 'Using live portfolio statistics for simulation.' 
                : 'Using manual input values for simulation.'}
              {' '}Model: Geometric Brownian Motion with log-normal returns.
            </div>
          </div>
        </div>
      </div>

      {/* Fan Chart */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Probability Fan Chart • Portfolio Value Projection</span>
          <span className="text-[9px] text-muted-foreground font-mono">65-Year Horizon</span>
        </div>
        <div className="p-3">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fanChartData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v}Y`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={formatCurrency}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={55}
                  scale="log"
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0',
                    fontSize: '9px',
                    fontFamily: 'JetBrains Mono',
                    padding: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--primary))', marginBottom: '4px' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      p5: '5th Percentile (Worst)',
                      p10: '10th Percentile',
                      p25: '25th Percentile',
                      p50: 'Median (50th)',
                      p75: '75th Percentile',
                      p90: '90th Percentile',
                      p95: '95th Percentile (Best)'
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  labelFormatter={(year) => `Year ${year}`}
                />
                
                {/* 5-95 band */}
                <Area type="monotone" dataKey="p95" stroke="none" fill="hsl(var(--success))" fillOpacity={0.08} />
                <Area type="monotone" dataKey="p5" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                
                {/* 10-90 band */}
                <Area type="monotone" dataKey="p90" stroke="none" fill="hsl(var(--success))" fillOpacity={0.1} />
                <Area type="monotone" dataKey="p10" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                
                {/* 25-75 band */}
                <Area type="monotone" dataKey="p75" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.15} />
                <Area type="monotone" dataKey="p25" stroke="none" fill="hsl(var(--background))" fillOpacity={1} />
                
                {/* Median line */}
                <Line type="monotone" dataKey="p50" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                
                {/* Horizon markers */}
                {TIME_HORIZONS.map(year => (
                  <ReferenceLine key={year} x={year} stroke="hsl(var(--warning))" strokeDasharray="3 3" opacity={0.6} />
                ))}
                <ReferenceLine y={effectiveValue} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" opacity={0.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[8px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary"></span> Median</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-primary/15 border border-primary/30"></span> 25-75%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-success/10 border border-success/20"></span> 10-90%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-success/5 border border-success/10"></span> 5-95%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warning border-dashed"></span> Horizons</span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Monte Carlo Results by Horizon</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2 font-semibold text-muted-foreground">Horizon</th>
                <th className="text-right p-2 font-semibold text-success">Best (95%)</th>
                <th className="text-right p-2 font-semibold text-muted-foreground">75%</th>
                <th className="text-right p-2 font-semibold text-primary">Median</th>
                <th className="text-right p-2 font-semibold text-muted-foreground">25%</th>
                <th className="text-right p-2 font-semibold text-destructive">Worst (5%)</th>
                <th className="text-right p-2 font-semibold text-success">P(Gain)</th>
                <th className="text-right p-2 font-semibold text-destructive">P(Loss)</th>
                <th className="text-right p-2 font-semibold text-warning">VaR 95%</th>
                <th className="text-right p-2 font-semibold text-warning">CVaR 95%</th>
              </tr>
            </thead>
            <tbody>
              {horizonResults.map((result) => (
                <tr key={result.horizon} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="p-2 font-mono font-semibold">{result.horizon}Y</td>
                  <td className="p-2 text-right font-mono text-success">{formatCurrency(result.p95)}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(result.p75)}</td>
                  <td className="p-2 text-right font-mono text-primary font-semibold">{formatCurrency(result.p50)}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(result.p25)}</td>
                  <td className="p-2 text-right font-mono text-destructive">{formatCurrency(result.p5)}</td>
                  <td className="p-2 text-right font-mono text-success">{result.probGain.toFixed(1)}%</td>
                  <td className="p-2 text-right font-mono text-destructive">{result.probLoss.toFixed(1)}%</td>
                  <td className="p-2 text-right font-mono text-warning">{formatPercent(result.var95)}</td>
                  <td className="p-2 text-right font-mono text-warning">{formatPercent(result.cvar95)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution Histogram */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">20-Year Terminal Value Distribution</span>
          <span className="text-[9px] text-muted-foreground font-mono">{config.numSimulations.toLocaleString()} scenarios</span>
        </div>
        <div className="p-3">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="range"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  interval="preserveStartEnd"
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0',
                    fontSize: '10px',
                    fontFamily: 'JetBrains Mono'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Probability']}
                />
                <Bar dataKey="percentage" radius={[1, 1, 0, 0]}>
                  {distribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.midpoint >= effectiveValue ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
                <ReferenceLine x={formatCurrency(effectiveValue)} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-1 text-[8px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-success/70"></span> Above Initial</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 bg-destructive/70"></span> Below Initial</span>
          </div>
        </div>
      </div>

      {/* Methodology Footer */}
      <div className="px-1 py-2 text-[8px] text-muted-foreground leading-relaxed border-t border-border">
        <AlertTriangle className="h-3 w-3 inline mr-1 text-warning" />
        <strong>Model:</strong> Geometric Brownian Motion (GBM) with log-normal returns. 
        <strong> Parameters:</strong> μ = {formatPercent(effectiveCAGR)} p.a., σ = {effectiveVolatility.toFixed(1)}% p.a.
        <strong> Source:</strong> {inputMode === 'portfolio' ? 'Live portfolio data' : 'Manual input'}.
        <strong> Method:</strong> {config.numSimulations.toLocaleString()} independent paths, {config.timeStep} time steps.
        <strong> Disclaimer:</strong> Past performance does not guarantee future results. This simulation assumes stationary parameters and does not account for regime changes, fat tails, or liquidity constraints.
      </div>
    </div>
  );
}
