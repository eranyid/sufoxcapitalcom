import { useState, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, BarChart, Bar, Cell, ComposedChart, Line
} from 'recharts';
import { Dice6, Settings2, TrendingUp, TrendingDown, Target, AlertTriangle, Zap, Database, Pencil, GitBranch, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AssetParameters,
  SimulationMode,
  DataQualityLevel,
  MultivariateConfig,
  assessDataQuality,
  determineSimulationMode,
  buildMultivariateConfig,
  runMultivariateSimulation,
  runUnivariateSimulation,
  generatePercentilePathsMultivariate,
  extractAssetParameters,
  MultivariateSimulationResult,
  isStructuredError,
} from '@/lib/monteCarloEngine';

interface MonteCarloSimulationProps {
  monthlyReturns: number[];
  currentValue: number;
  // Portfolio statistics passed from parent
  portfolioCAGR?: number;     // Annualized expected return
  portfolioVolatility?: number; // Annualized volatility
  portfolioSharpe?: number;   // Sharpe ratio
  riskFreeRate?: number;      // Risk-free rate for calculations
  // NEW: Asset-level data for multivariate simulation
  assetReturns?: Record<string, { month: string; return: number }[]>;
  correlationMatrix?: { tickers: string[]; matrix: number[][] };
  assetWeights?: Record<string, number>;
  assetNames?: Record<string, string>;
}

type InputMode = 'portfolio' | 'manual';
type SimMode = 'auto' | 'univariate' | 'multivariate';
type RebalancingMode = 'constant' | 'buy_and_hold';

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

function getQualityBadgeProps(level: DataQualityLevel): { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className: string } {
  switch (level) {
    case 'high':
      return { variant: 'default', label: 'High Confidence', className: 'bg-success/20 text-success border-success/30' };
    case 'medium':
      return { variant: 'secondary', label: 'Medium Confidence', className: 'bg-warning/20 text-warning border-warning/30' };
    case 'low':
      return { variant: 'destructive', label: 'Low Confidence', className: 'bg-destructive/20 text-destructive border-destructive/30' };
    case 'insufficient':
      return { variant: 'outline', label: 'Insufficient Data', className: 'bg-muted text-muted-foreground' };
  }
}

interface SimulationResults {
  fanChartData: PercentilePath[];
  horizonResults: HorizonResult[];
  distribution: DistributionBin[];
  mode: SimulationMode;
  diversificationBenefit?: number;
}

export function MonteCarloSimulation({ 
  monthlyReturns, 
  currentValue,
  portfolioCAGR,
  portfolioVolatility,
  portfolioSharpe,
  riskFreeRate = 4.5,
  assetReturns,
  correlationMatrix,
  assetWeights,
  assetNames,
}: MonteCarloSimulationProps) {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [inputMode, setInputMode] = useState<InputMode>('portfolio');
  const [simModeOverride, setSimModeOverride] = useState<SimMode>('auto');
  const [rebalancing, setRebalancing] = useState<RebalancingMode>('constant');
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  
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
  
  // Build asset parameters for multivariate simulation
  const assetParams = useMemo((): AssetParameters[] => {
    if (!assetReturns || !assetWeights || !assetNames) return [];
    return extractAssetParameters(assetReturns, assetWeights, assetNames);
  }, [assetReturns, assetWeights, assetNames]);
  
  // Assess data quality
  const dataQuality = useMemo(() => assessDataQuality(assetParams), [assetParams]);
  
  // Determine simulation mode
  const autoSimMode = useMemo((): SimulationMode => {
    if (!correlationMatrix || correlationMatrix.tickers.length < 2) {
      return { type: 'univariate', reason: 'Correlation matrix not available' };
    }
    return determineSimulationMode(assetParams, correlationMatrix.matrix);
  }, [assetParams, correlationMatrix]);
  
  // Effective simulation mode (considering override)
  const effectiveSimMode = useMemo((): SimulationMode => {
    if (simModeOverride === 'auto') return autoSimMode;
    if (simModeOverride === 'multivariate') {
      if (autoSimMode.type === 'univariate' && autoSimMode.reason?.includes('Insufficient')) {
        return autoSimMode; // Can't override insufficient data
      }
      return { type: 'multivariate' };
    }
    return { type: 'univariate', reason: 'Manual override' };
  }, [simModeOverride, autoSimMode]);
  
  // Build multivariate config
  const multivariateConfig = useMemo((): MultivariateConfig | null => {
    if (effectiveSimMode.type !== 'multivariate') return null;
    if (!correlationMatrix || correlationMatrix.tickers.length < 2) return null;
    
    // Filter assets to match correlation matrix
    let filteredAssets = assetParams.filter(a => correlationMatrix.tickers.includes(a.ticker));
    if (filteredAssets.length < 2) return null;
    
    // CRITICAL: In Manual mode, scale asset parameters to match manual inputs
    // This ensures consistency between Multivariate and Univariate engines
    if (inputMode === 'manual') {
      // Calculate portfolio-level stats from asset parameters
      const totalWeight = filteredAssets.reduce((sum, a) => sum + a.weight, 0);
      const weightedAvgReturn = filteredAssets.reduce((sum, a) => sum + a.weight * a.meanReturn, 0) / (totalWeight || 1);
      const weightedAvgVol = filteredAssets.reduce((sum, a) => sum + a.weight * a.volatility, 0) / (totalWeight || 1);
      
      // Calculate scaling factors to match manual inputs
      const returnScale = weightedAvgReturn !== 0 ? (effectiveCAGR / 100) / weightedAvgReturn : 1;
      const volScale = weightedAvgVol !== 0 ? (effectiveVolatility / 100) / weightedAvgVol : 1;
      
      // Apply scaling to each asset to preserve relative differences
      filteredAssets = filteredAssets.map(asset => ({
        ...asset,
        meanReturn: asset.meanReturn * returnScale,
        volatility: asset.volatility * volScale,
      }));
    }
    
    // Reorder assets to match correlation matrix order
    const orderedAssets = correlationMatrix.tickers
      .map(t => filteredAssets.find(a => a.ticker === t))
      .filter((a): a is AssetParameters => a !== undefined);
    
    return buildMultivariateConfig(orderedAssets, correlationMatrix.matrix, rebalancing);
  }, [effectiveSimMode.type, correlationMatrix, assetParams, rebalancing, inputMode, effectiveCAGR, effectiveVolatility]);
  
  // Run simulation on demand
  const runSimulation = useCallback(() => {
    if (monthlyReturns.length < 3 && inputMode === 'portfolio') return;
    if (hasValidationErrors && inputMode === 'manual') return;
    
    setIsRunning(true);
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const stepsPerYear = config.timeStep === 'monthly' ? 12 : 252;
      const useMultivariate = effectiveSimMode.type === 'multivariate' && multivariateConfig;
      
      // Generate fan chart data
      const fanChartData = generatePercentilePathsMultivariate(
        useMultivariate ? multivariateConfig : null,
        effectiveValue,
        65,
        effectiveCAGR / 100,
        effectiveVolatility / 100,
        Math.min(config.numSimulations, 2000),
        stepsPerYear
      );
      
      // Generate horizon results
      const horizonResults: HorizonResult[] = TIME_HORIZONS.map(horizon => {
        let simResult: MultivariateSimulationResult | null = null;
        
        if (useMultivariate) {
          const result = runMultivariateSimulation(
            multivariateConfig!,
            effectiveValue,
            horizon,
            config.numSimulations,
            stepsPerYear
          );
          if (!result || isStructuredError(result)) {
            // Fallback to univariate on error
            const uniResult = runUnivariateSimulation(
              effectiveValue,
              effectiveCAGR / 100,
              effectiveVolatility / 100,
              horizon,
              config.numSimulations,
              stepsPerYear
            );
            simResult = isStructuredError(uniResult) ? null : uniResult;
          } else {
            simResult = result;
          }
        } else {
          const uniResult = runUnivariateSimulation(
            effectiveValue,
            effectiveCAGR / 100,
            effectiveVolatility / 100,
            horizon,
            config.numSimulations,
            stepsPerYear
          );
          simResult = isStructuredError(uniResult) ? null : uniResult;
        }
        
        if (!simResult) {
          return {
            horizon,
            p5: effectiveValue,
            p25: effectiveValue,
            p50: effectiveValue,
            p75: effectiveValue,
            p95: effectiveValue,
            probGain: 50,
            probLoss: 50,
            var95: 0,
            cvar95: 0,
            expectedValue: effectiveValue,
          };
        }
        
        return {
          horizon,
          p5: simResult.percentiles.p5,
          p25: simResult.percentiles.p25,
          p50: simResult.percentiles.p50,
          p75: simResult.percentiles.p75,
          p95: simResult.percentiles.p95,
          probGain: simResult.riskMetrics.probGain,
          probLoss: simResult.riskMetrics.probLoss,
          var95: simResult.riskMetrics.var95,
          cvar95: simResult.riskMetrics.cvar95,
          expectedValue: simResult.finalValues.reduce((a, b) => a + b, 0) / simResult.finalValues.length,
        };
      });
      
      // Distribution for 20-year horizon
      let distResult: MultivariateSimulationResult | null = null;
      let diversificationBenefit: number | undefined;
      
      if (useMultivariate) {
        const result = runMultivariateSimulation(
          multivariateConfig!,
          effectiveValue,
          20,
          config.numSimulations,
          stepsPerYear
        );
        if (result && !isStructuredError(result)) {
          distResult = result;
          diversificationBenefit = result.diversificationBenefit;
        } else {
          const uniResult = runUnivariateSimulation(
            effectiveValue,
            effectiveCAGR / 100,
            effectiveVolatility / 100,
            20,
            config.numSimulations,
            stepsPerYear
          );
          distResult = isStructuredError(uniResult) ? null : uniResult;
        }
      } else {
        const uniResult = runUnivariateSimulation(
          effectiveValue,
          effectiveCAGR / 100,
          effectiveVolatility / 100,
          20,
          config.numSimulations,
          stepsPerYear
        );
        distResult = isStructuredError(uniResult) ? null : uniResult;
      }
      
      const distribution = distResult ? generateDistribution(distResult.finalValues, 40) : [];
      
      setResults({ 
        fanChartData, 
        horizonResults, 
        distribution, 
        mode: effectiveSimMode,
        diversificationBenefit,
      });
      setHasRun(true);
      setIsRunning(false);
    }, 50);
  }, [monthlyReturns.length, effectiveValue, effectiveCAGR, effectiveVolatility, config, inputMode, hasValidationErrors, effectiveSimMode, multivariateConfig]);
  
  // Update manual inputs when portfolio values change
  const syncWithPortfolio = useCallback(() => {
    setManualInputs({
      cagr: derivedCAGR,
      volatility: derivedVolatility,
      currentValue: currentValue
    });
  }, [derivedCAGR, derivedVolatility, currentValue]);
  
  // Extract results for rendering
  const fanChartData = results?.fanChartData ?? [];
  const horizonResults = results?.horizonResults ?? [];
  const distribution = results?.distribution ?? [];
  
  if (monthlyReturns.length < 3 && inputMode === 'portfolio') {
    return (
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <Dice6 className="h-3.5 w-3.5 text-primary" />
          <span className="bloomberg-header-title">Monte Carlo Risk Engine</span>
        </div>
        <div className="p-6 text-center">
          <Dice6 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-xs">Minimum 3 months of returns required for Monte Carlo simulation</p>
          <button 
            onClick={() => setInputMode('manual')}
            className="mt-2 text-[10px] text-primary hover:underline"
          >
            Or switch to Manual Input mode →
          </button>
        </div>
      </div>
    );
  }

  const qualityBadge = getQualityBadgeProps(dataQuality.level);

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
          <div className="flex items-center gap-2">
            {effectiveSimMode.type === 'multivariate' && (
              <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/30">
                <GitBranch className="h-2.5 w-2.5 mr-1" />
                Multivariate
              </Badge>
            )}
            <span className="text-[9px] text-muted-foreground font-mono">
              {config.numSimulations.toLocaleString()} simulations • {config.timeStep} steps
            </span>
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="px-3 py-2 border-b border-border bg-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Input:</Label>
              <div className="flex h-6 bg-muted rounded-sm p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMode('portfolio')}
                  className={cn(
                    "text-[9px] h-5 px-2 gap-1 rounded-sm",
                    inputMode === 'portfolio' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Database className="h-3 w-3" />
                  Portfolio Data
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMode('manual')}
                  className={cn(
                    "text-[9px] h-5 px-2 gap-1 rounded-sm",
                    inputMode === 'manual' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Pencil className="h-3 w-3" />
                  Manual
                </Button>
              </div>
              
              {/* Simulation Mode Selector */}
              {assetParams.length >= 2 && (
                <>
                  <div className="h-4 w-px bg-border mx-2" />
                  <Label className="text-[9px] uppercase tracking-wider text-muted-foreground">Engine:</Label>
                  <div className="flex h-6 bg-muted rounded-sm p-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSimModeOverride('auto')}
                      className={cn(
                        "text-[9px] h-5 px-2 rounded-sm",
                        simModeOverride === 'auto' 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Auto
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSimModeOverride('multivariate')}
                      disabled={dataQuality.level === 'insufficient'}
                      className={cn(
                        "text-[9px] h-5 px-2 gap-1 rounded-sm",
                        simModeOverride === 'multivariate' 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <GitBranch className="h-3 w-3" />
                      Multi
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSimModeOverride('univariate')}
                      className={cn(
                        "text-[9px] h-5 px-2 gap-1 rounded-sm",
                        simModeOverride === 'univariate' 
                          ? "bg-background text-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Layers className="h-3 w-3" />
                      Uni
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Data Quality Badge */}
              {assetParams.length >= 2 && (
                <Badge variant={qualityBadge.variant} className={cn("text-[8px]", qualityBadge.className)}>
                  {qualityBadge.label} ({dataQuality.minMonths}mo)
                </Badge>
              )}
              
              {inputMode === 'manual' && (
                <button 
                  onClick={syncWithPortfolio}
                  className="text-[9px] text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          
          {/* Mode Description */}
          <div className="flex items-center justify-between mt-1">
            <p className="text-[8px] text-muted-foreground">
              {effectiveSimMode.type === 'multivariate' 
                ? `Multivariate GBM with ${assetParams.length} correlated assets (EnCorr methodology)`
                : 'Portfolio-level GBM simulation'}
              {effectiveSimMode.reason && effectiveSimMode.type === 'univariate' && ` — ${effectiveSimMode.reason}`}
              {inputMode === 'manual' && ' — Manual override'}
            </p>
            
            {assetParams.length >= 2 && (
              <button
                onClick={() => setShowAssetPanel(!showAssetPanel)}
                className="text-[8px] text-primary hover:underline"
              >
                {showAssetPanel ? 'Hide' : 'Show'} Asset Parameters
              </button>
            )}
          </div>
        </div>
        
        {/* Manual Mode Info Banner */}
        {inputMode === 'manual' && hasRun && (
          <div className="px-3 py-1.5 border-b border-warning/20 bg-warning/5">
            <p className="text-[8px] text-warning flex items-center gap-1">
              <Settings2 className="h-3 w-3" />
              Using manual input values. Click "Run Simulation" to generate projections.
            </p>
          </div>
        )}
        
        {/* Asset Parameters Panel (Collapsible) */}
        {showAssetPanel && assetParams.length >= 2 && (
          <div className="px-3 py-2 border-b border-border bg-muted/5">
            <div className="text-[9px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Asset Parameters (Annualized)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-1 px-2">Ticker</th>
                    <th className="text-right py-1 px-2">Weight</th>
                    <th className="text-right py-1 px-2">Mean (μ)</th>
                    <th className="text-right py-1 px-2">Vol (σ)</th>
                    <th className="text-right py-1 px-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {assetParams.map(asset => (
                    <tr key={asset.ticker} className="border-t border-border/30">
                      <td className="py-1 px-2 font-mono font-medium text-primary">{asset.ticker}</td>
                      <td className="py-1 px-2 text-right font-mono">{(asset.weight * 100).toFixed(1)}%</td>
                      <td className={cn(
                        "py-1 px-2 text-right font-mono",
                        asset.meanReturn >= 0 ? "text-success" : "text-destructive"
                      )}>
                        {(asset.meanReturn * 100).toFixed(1)}%
                      </td>
                      <td className="py-1 px-2 text-right font-mono text-warning">
                        {(asset.volatility * 100).toFixed(1)}%
                      </td>
                      <td className={cn(
                        "py-1 px-2 text-right font-mono",
                        asset.monthsOfData >= 12 ? "text-success" : asset.monthsOfData >= 6 ? "text-warning" : "text-destructive"
                      )}>
                        {asset.monthsOfData}mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mini Correlation Matrix */}
            {correlationMatrix && correlationMatrix.tickers.length >= 2 && (
              <div className="mt-3">
                <div className="text-[9px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  Correlation Matrix
                </div>
                <div className="overflow-x-auto">
                  <table className="text-[8px]">
                    <thead>
                      <tr>
                        <th className="py-1 px-1"></th>
                        {correlationMatrix.tickers.slice(0, 6).map(t => (
                          <th key={t} className="py-1 px-1 font-mono text-muted-foreground">{t.slice(0, 4)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationMatrix.tickers.slice(0, 6).map((ticker, i) => (
                        <tr key={ticker}>
                          <td className="py-1 px-1 font-mono text-primary">{ticker.slice(0, 4)}</td>
                          {correlationMatrix.matrix[i].slice(0, 6).map((corr, j) => (
                            <td 
                              key={j} 
                              className={cn(
                                "py-1 px-1 text-center font-mono",
                                i === j ? "text-muted-foreground" :
                                corr >= 0.5 ? "text-success" :
                                corr <= -0.5 ? "text-destructive" : ""
                              )}
                            >
                              {corr.toFixed(2)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
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
          
          {/* Data Points / Assets */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {effectiveSimMode.type === 'multivariate' ? 'Assets' : 'Data Points'}
            </div>
            <div className="font-mono text-sm">
              {effectiveSimMode.type === 'multivariate' 
                ? `${assetParams.length} assets`
                : inputMode === 'portfolio' ? `${monthlyReturns.length} months` : '—'
              }
            </div>
          </div>
          
          {/* Sharpe Estimate / Diversification */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
              {results?.diversificationBenefit !== undefined ? 'Div. Benefit' : 'Sharpe Est.'}
            </div>
            <div className="font-mono text-sm">
              {results?.diversificationBenefit !== undefined 
                ? `${results.diversificationBenefit.toFixed(1)}%`
                : effectiveSharpe !== 0 ? effectiveSharpe.toFixed(2) : 'N/A'
              }
            </div>
          </div>
          
          {/* Model */}
          <div className="space-y-0.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Model</div>
            <div className="font-mono text-[10px] text-muted-foreground">
              {effectiveSimMode.type === 'multivariate' ? 'MV-GBM + Cholesky' : 'Log-Normal GBM'}
            </div>
          </div>
        </div>
        
        {/* Configuration Panel with Run Button */}
        <div className="p-3 grid grid-cols-2 md:grid-cols-6 gap-3 bg-muted/20">
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
          
          {/* Rebalancing (only for multivariate) */}
          {effectiveSimMode.type === 'multivariate' && (
            <div className="space-y-1">
              <Label className="text-[9px] uppercase tracking-wider">Rebalancing</Label>
              <Select 
                value={rebalancing} 
                onValueChange={(v: RebalancingMode) => setRebalancing(v)}
              >
                <SelectTrigger className="h-7 text-[10px] font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="constant">Constant Weights</SelectItem>
                  <SelectItem value="buy_and_hold">Buy & Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-1">
            <Label className="text-[9px] uppercase tracking-wider">&nbsp;</Label>
            <Button 
              onClick={runSimulation}
              disabled={isRunning || hasValidationErrors || (monthlyReturns.length < 3 && inputMode === 'portfolio')}
              className="h-7 text-[10px] font-mono w-full gap-1"
              variant="default"
            >
              {isRunning ? (
                <>
                  <Zap className="h-3 w-3 animate-pulse" />
                  Running...
                </>
              ) : (
                <>
                  <Dice6 className="h-3 w-3" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
          
          <div className={cn("flex items-end", effectiveSimMode.type === 'multivariate' ? "" : "col-span-2")}>
            <div className="text-[8px] text-muted-foreground leading-tight">
              <Settings2 className="h-3 w-3 inline mr-1" />
              {inputMode === 'portfolio' 
                ? 'Using live portfolio statistics.' 
                : 'Using manual input values.'}
              {' '}Click "Run Simulation" to generate projections.
            </div>
          </div>
        </div>
      </div>

      {/* Results Section - Show only after simulation has run */}
      {!hasRun ? (
        <div className="bloomberg-panel p-8 text-center">
          <Dice6 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">Ready to Simulate</h3>
          <p className="text-muted-foreground text-xs">
            Configure your parameters above and click "Run Simulation" to generate Monte Carlo projections.
          </p>
          {effectiveSimMode.type === 'multivariate' && (
            <p className="text-[10px] text-primary mt-2">
              <GitBranch className="h-3 w-3 inline mr-1" />
              Multivariate engine ready with {assetParams.length} correlated assets
            </p>
          )}
        </div>
      ) : (
        <>

      {/* Fan Chart */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Monte Carlo Projection</span>
          <div className="flex items-center gap-2">
            {results?.mode.type === 'multivariate' && (
              <Badge variant="outline" className="text-[8px] bg-primary/10 text-primary border-primary/30">
                Multivariate
              </Badge>
            )}
            <span className="text-[9px] text-muted-foreground font-mono">65-Year Horizon</span>
          </div>
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
        <strong>Model:</strong> {results?.mode.type === 'multivariate' 
          ? `Multivariate GBM with Cholesky decomposition (${assetParams.length} assets, ${rebalancing === 'constant' ? 'constant rebalancing' : 'buy-and-hold'})` 
          : 'Geometric Brownian Motion (GBM) with log-normal returns'
        }. 
        <strong> Parameters:</strong> μ = {formatPercent(effectiveCAGR)} p.a., σ = {effectiveVolatility.toFixed(1)}% p.a.
        <strong> Source:</strong> {inputMode === 'portfolio' ? 'Live portfolio data' : 'Manual input'}.
        {results?.diversificationBenefit !== undefined && results.diversificationBenefit > 0 && (
          <> <strong>Diversification:</strong> {results.diversificationBenefit.toFixed(1)}% risk reduction vs. uncorrelated.</>
        )}
        {' '}Past performance is not indicative of future results. This simulation does not constitute investment advice.
      </div>

      </>
      )}
    </div>
  );
}
