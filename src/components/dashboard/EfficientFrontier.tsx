import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateEfficientFrontier, EfficientFrontierResult, FrontierOptions, PortfolioPoint } from '@/lib/efficientFrontier';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Line, ComposedChart, LineChart } from 'recharts';
import { TrendingUp, AlertTriangle, RefreshCw, Target, Crosshair, CircleDot, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PortfolioWeightsModal } from './PortfolioWeightsModal';

interface ChartDataPoint {
  x: number;
  y: number;
  type: 'frontier' | 'current' | 'minVar' | 'maxSharpe';
  data: PortfolioPoint;
}

export function EfficientFrontier() {
  const { transactions, valuations, settings } = usePortfolio();
  
  const [options, setOptions] = useState<FrontierOptions>({
    riskFreeRate: settings.riskFreeRate,
    numPortfolios: 50, // Now represents frontier points, not random samples
    allowLeverage: false,
    allowShortSelling: false
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<EfficientFrontierResult | null>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<{
    portfolio: PortfolioPoint | null;
    type: 'current' | 'minVar' | 'maxSharpe' | null;
  }>({ portfolio: null, type: null });
  
  // Calculate frontier
  const calculate = useCallback(() => {
    setIsCalculating(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const frontierResult = calculateEfficientFrontier(transactions, valuations, options);
      setResult(frontierResult);
      setIsCalculating(false);
    }, 50);
  }, [transactions, valuations, options]);
  
  // Track if initial calculation was done
  const hasCalculated = useRef(false);
  
  // Initial calculation on mount (only once)
  useEffect(() => {
    if (transactions.length > 0 && valuations.length > 0 && !hasCalculated.current) {
      hasCalculated.current = true;
      calculate();
    }
  }, [transactions.length, valuations.length, calculate]);
  
  // Prepare frontier curve data (separate from scatter points)
  const frontierCurveData = useMemo(() => {
    if (!result) return [];
    return result.frontier.map(p => ({
      x: p.volatility,
      y: p.return
    }));
  }, [result]);
  
  // Prepare special points data (Current, MinVar, MaxSharpe)
  const specialPointsData = useMemo(() => {
    if (!result) return [];
    
    const data: ChartDataPoint[] = [];
    
    if (result.currentPortfolio) {
      data.push({
        x: result.currentPortfolio.volatility,
        y: result.currentPortfolio.return,
        type: 'current',
        data: result.currentPortfolio
      });
    }
    
    if (result.minVariancePortfolio) {
      data.push({
        x: result.minVariancePortfolio.volatility,
        y: result.minVariancePortfolio.return,
        type: 'minVar',
        data: result.minVariancePortfolio
      });
    }
    
    if (result.maxSharpePortfolio) {
      data.push({
        x: result.maxSharpePortfolio.volatility,
        y: result.maxSharpePortfolio.return,
        type: 'maxSharpe',
        data: result.maxSharpePortfolio
      });
    }
    
    return data;
  }, [result]);
  
  // Calculate CML (Capital Market Line) data points - precise from optimizer
  const cmlData = useMemo(() => {
    if (!result?.maxSharpePortfolio) return [];
    
    const maxSharpe = result.maxSharpePortfolio;
    const rf = options.riskFreeRate;
    
    // CML equation: Return = Rf + (Sharpe * Volatility)
    const slope = maxSharpe.sharpe;
    
    // Extend beyond max volatility in the data
    const maxFrontierVol = Math.max(...result.frontier.map(p => p.volatility), maxSharpe.volatility);
    const extendedMaxVol = maxFrontierVol * 1.3;
    
    return [
      { x: 0, y: rf },
      { x: maxSharpe.volatility, y: maxSharpe.return },
      { x: extendedMaxVol, y: rf + slope * extendedMaxVol }
    ];
  }, [result, options.riskFreeRate]);
  
  const getPointColor = (type: string) => {
    switch (type) {
      case 'current': return 'hsl(30, 100%, 50%)';
      case 'minVar': return 'hsl(210, 100%, 55%)';
      case 'maxSharpe': return 'hsl(120, 60%, 40%)';
      default: return 'hsl(0, 0%, 50%)';
    }
  };
  
  const getPointSize = (type: string) => {
    switch (type) {
      case 'current': return 150;
      case 'minVar': return 120;
      case 'maxSharpe': return 120;
      default: return 30;
    }
  };

  const handlePointClick = (data: ChartDataPoint) => {
    if (data.type !== 'frontier') {
      setSelectedPortfolio({
        portfolio: data.data,
        type: data.type
      });
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      
      // Handle frontier curve line points
      if (point && typeof point.x === 'number' && typeof point.y === 'number' && !point.data) {
        return (
          <div className="bg-card border border-border p-2.5 rounded-sm shadow-lg">
            <p className="font-mono text-[10px] font-medium text-muted-foreground mb-1.5">
              Frontier Portfolio
            </p>
            <div className="space-y-0.5">
              <p className="font-mono text-[10px]">
                Return: <span className="text-chart-positive">{point.y.toFixed(2)}%</span>
              </p>
              <p className="font-mono text-[10px]">
                Volatility: <span className="text-muted-foreground">{point.x.toFixed(2)}%</span>
              </p>
            </div>
          </div>
        );
      }
      
      // Skip CML points
      if (!point?.data) return null;
      
      const data = point.data;
      
      const typeLabels: Record<string, string> = {
        frontier: 'Frontier Portfolio',
        current: 'Current Portfolio',
        minVar: 'Minimum Variance',
        maxSharpe: 'Maximum Sharpe'
      };
      
      const typeColors: Record<string, string> = {
        current: 'hsl(30, 100%, 50%)',
        minVar: 'hsl(210, 100%, 55%)',
        maxSharpe: 'hsl(120, 60%, 40%)',
        frontier: 'hsl(0, 0%, 70%)'
      };
      
      return (
        <div className="bg-card border border-border p-3 rounded-sm shadow-lg min-w-[180px]">
          <p className="font-mono text-xs font-medium mb-2" style={{ color: typeColors[point.type] }}>
            {typeLabels[point.type]}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">Return:</span>
              <span className={`font-mono text-[10px] ${data.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                {data.return.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">Volatility:</span>
              <span className="font-mono text-[10px] text-foreground">{data.volatility.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">Sharpe:</span>
              <span className={`font-mono text-[10px] ${data.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                {data.sharpe.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">Assets:</span>
              <span className="font-mono text-[10px] text-foreground">{data.numAssets}</span>
            </div>
          </div>
          {point.type !== 'frontier' && (
            <p className="font-mono text-[9px] text-muted-foreground mt-2 pt-2 border-t border-border/30">
              Click to view weights →
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  const hasData = transactions.length > 0 && valuations.length > 0;
  
  if (!hasData) {
    return (
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="text-primary">■</span> Efficient Frontier
        </div>
        <div className="p-8 text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">No Data Available</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            Add transactions and valuations to generate the efficient frontier analysis.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="bloomberg-panel">
        <div className="bloomberg-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-primary">■</span> 
            Efficient Frontier
            <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm font-mono">
              MARKOWITZ
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={calculate}
            disabled={isCalculating}
            className="h-7 text-[10px]"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Optimizing...' : 'Recalculate'}
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-secondary/30 rounded-sm border border-border/30">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-mono">Risk-Free Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={options.riskFreeRate}
                onChange={(e) => setOptions(prev => ({ ...prev, riskFreeRate: parseFloat(e.target.value) || 0 }))}
                className="h-7 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-mono">Frontier Points</Label>
              <Input
                type="number"
                step="10"
                min="20"
                max="100"
                value={options.numPortfolios}
                onChange={(e) => setOptions(prev => ({ ...prev, numPortfolios: Math.min(100, Math.max(20, parseInt(e.target.value) || 50)) }))}
                className="h-7 text-xs font-mono"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="leverage"
                checked={options.allowLeverage}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, allowLeverage: checked }))}
              />
              <Label htmlFor="leverage" className="text-[10px] text-muted-foreground font-mono">Allow Leverage</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="shorts"
                checked={options.allowShortSelling}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, allowShortSelling: checked }))}
              />
              <Label htmlFor="shorts" className="text-[10px] text-muted-foreground font-mono">Allow Shorts</Label>
            </div>
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-2 p-2 bg-primary/5 border border-primary/20 rounded-sm">
            <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground font-mono">
              Deterministic Markowitz optimization. Results are stable and reproducible—recalculating with the same inputs produces identical output.
            </p>
          </div>
          
          {/* Validation Errors */}
          {result?.validationErrors && result.validationErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs font-mono text-destructive">Validation Issues</span>
              </div>
              <ul className="space-y-1">
                {result.validationErrors.map((err, idx) => (
                  <li key={idx} className="text-[10px] font-mono text-muted-foreground">• {err}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Chart */}
          {result && result.frontier.length > 0 && (
            <>
              <div className="h-[360px] md:h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                    <CartesianGrid 
                      strokeDasharray="2 2" 
                      stroke="hsl(0, 0%, 18%)" 
                      strokeWidth={0.5}
                    />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="Volatility"
                      domain={[0, 'auto']}
                      tickCount={8}
                      tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: 'hsl(0, 0%, 25%)', strokeWidth: 0.5 }}
                      tickLine={{ stroke: 'hsl(0, 0%, 25%)', strokeWidth: 0.5 }}
                      label={{ 
                        value: 'Volatility (% Annual)', 
                        position: 'bottom',
                        offset: 15,
                        fill: 'hsl(0, 0%, 45%)',
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono'
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="Return"
                      domain={['auto', 'auto']}
                      tickCount={8}
                      tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                      axisLine={{ stroke: 'hsl(0, 0%, 25%)', strokeWidth: 0.5 }}
                      tickLine={{ stroke: 'hsl(0, 0%, 25%)', strokeWidth: 0.5 }}
                      label={{ 
                        value: 'Expected Return (% Annual)', 
                        angle: -90, 
                        position: 'insideLeft',
                        offset: 10,
                        fill: 'hsl(0, 0%, 45%)',
                        fontSize: 9,
                        fontFamily: 'JetBrains Mono'
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Risk-free rate reference line */}
                    <ReferenceLine 
                      y={options.riskFreeRate} 
                      stroke="hsl(0, 0%, 35%)" 
                      strokeDasharray="4 4"
                      strokeWidth={0.5}
                      label={{ 
                        value: `Rf: ${options.riskFreeRate}%`, 
                        position: 'right',
                        fill: 'hsl(0, 0%, 45%)',
                        fontSize: 8,
                        fontFamily: 'JetBrains Mono'
                      }}
                    />
                    
                    {/* Capital Market Line */}
                    {cmlData.length > 0 && (
                      <Line
                        data={cmlData}
                        type="linear"
                        dataKey="y"
                        stroke="hsl(45, 100%, 50%)"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                        dot={false}
                        name="CML"
                        legendType="none"
                      />
                    )}
                    
                    {/* Efficient Frontier Curve */}
                    <Line
                      data={frontierCurveData}
                      type="monotone"
                      dataKey="y"
                      stroke="hsl(0, 0%, 60%)"
                      strokeWidth={2}
                      dot={{ r: 2, fill: 'hsl(0, 0%, 60%)' }}
                      activeDot={{ r: 4, fill: 'hsl(0, 0%, 70%)' }}
                      name="Frontier"
                    />
                    
                    {/* Special Points */}
                    <Scatter 
                      name="Portfolios" 
                      data={specialPointsData} 
                      shape="circle"
                      onClick={(data: any) => handlePointClick(data)}
                      cursor="pointer"
                    >
                      {specialPointsData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getPointColor(entry.type)}
                          stroke="hsl(0, 0%, 10%)"
                          strokeWidth={2}
                          r={Math.sqrt(getPointSize(entry.type) / Math.PI)}
                        />
                      ))}
                    </Scatter>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-5 justify-center text-[10px] font-mono py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 bg-muted-foreground rounded-full" />
                  <span className="text-muted-foreground">Efficient Frontier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 rounded-full" style={{ background: 'hsl(45, 100%, 50%)', borderStyle: 'dashed' }} />
                  <span style={{ color: 'hsl(45, 100%, 50%)' }}>Capital Market Line</span>
                </div>
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => result.currentPortfolio && handlePointClick({ x: 0, y: 0, type: 'current', data: result.currentPortfolio })}>
                  <Target className="h-3.5 w-3.5" style={{ color: 'hsl(30, 100%, 50%)' }} />
                  <span className="text-primary">Current Portfolio</span>
                </div>
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => result.minVariancePortfolio && handlePointClick({ x: 0, y: 0, type: 'minVar', data: result.minVariancePortfolio })}>
                  <Crosshair className="h-3.5 w-3.5" style={{ color: 'hsl(210, 100%, 55%)' }} />
                  <span style={{ color: 'hsl(210, 100%, 55%)' }}>Min Variance</span>
                </div>
                <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80" onClick={() => result.maxSharpePortfolio && handlePointClick({ x: 0, y: 0, type: 'maxSharpe', data: result.maxSharpePortfolio })}>
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: 'hsl(120, 60%, 40%)' }} />
                  <span style={{ color: 'hsl(120, 60%, 40%)' }}>Max Sharpe (Tangency)</span>
                </div>
              </div>
              
              {/* Summary Table */}
              <div className="overflow-x-auto border border-border/30 rounded-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th className="text-[10px] text-muted-foreground font-mono text-left py-2 px-3">Portfolio</th>
                      <th className="text-[10px] text-muted-foreground font-mono text-right py-2 px-3">E[Return]</th>
                      <th className="text-[10px] text-muted-foreground font-mono text-right py-2 px-3">Volatility</th>
                      <th className="text-[10px] text-muted-foreground font-mono text-right py-2 px-3">Sharpe</th>
                      <th className="text-[10px] text-muted-foreground font-mono text-right py-2 px-3">Assets</th>
                      <th className="text-[10px] text-muted-foreground font-mono text-center py-2 px-3">Weights</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.currentPortfolio && (
                      <tr className="border-t border-border/20 bg-primary/5 hover:bg-primary/10">
                        <td className="py-2 px-3 font-mono text-xs flex items-center gap-2">
                          <Target className="h-3 w-3 text-primary" />
                          <span className="text-primary font-medium">Current</span>
                        </td>
                        <td className={`font-mono text-xs text-right tabular-nums px-3 ${result.currentPortfolio.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                          {result.currentPortfolio.return.toFixed(2)}%
                        </td>
                        <td className="font-mono text-xs text-right tabular-nums text-muted-foreground px-3">
                          {result.currentPortfolio.volatility.toFixed(2)}%
                        </td>
                        <td className={`font-mono text-xs text-right tabular-nums px-3 ${result.currentPortfolio.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                          {result.currentPortfolio.sharpe.toFixed(3)}
                        </td>
                        <td className="font-mono text-xs text-right tabular-nums text-muted-foreground px-3">
                          {result.currentPortfolio.numAssets}
                        </td>
                        <td className="text-center px-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 text-[9px] px-2"
                            onClick={() => setSelectedPortfolio({ portfolio: result.currentPortfolio, type: 'current' })}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    )}
                    {result.minVariancePortfolio && (
                      <tr className="border-t border-border/20 hover:bg-secondary/30">
                        <td className="py-2 px-3 font-mono text-xs flex items-center gap-2">
                          <Crosshair className="h-3 w-3" style={{ color: 'hsl(210, 100%, 55%)' }} />
                          <span style={{ color: 'hsl(210, 100%, 55%)' }}>Min Variance</span>
                        </td>
                        <td className={`font-mono text-xs text-right tabular-nums px-3 ${result.minVariancePortfolio.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                          {result.minVariancePortfolio.return.toFixed(2)}%
                        </td>
                        <td className="font-mono text-xs text-right tabular-nums text-muted-foreground px-3">
                          {result.minVariancePortfolio.volatility.toFixed(2)}%
                        </td>
                        <td className={`font-mono text-xs text-right tabular-nums px-3 ${result.minVariancePortfolio.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                          {result.minVariancePortfolio.sharpe.toFixed(3)}
                        </td>
                        <td className="font-mono text-xs text-right tabular-nums text-muted-foreground px-3">
                          {result.minVariancePortfolio.numAssets}
                        </td>
                        <td className="text-center px-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 text-[9px] px-2"
                            onClick={() => setSelectedPortfolio({ portfolio: result.minVariancePortfolio, type: 'minVar' })}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    )}
                    {result.maxSharpePortfolio && (
                      <tr className="border-t border-border/20 hover:bg-secondary/30">
                        <td className="py-2 px-3 font-mono text-xs flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" style={{ color: 'hsl(120, 60%, 40%)' }} />
                          <span style={{ color: 'hsl(120, 60%, 40%)' }}>Max Sharpe</span>
                        </td>
                        <td className={`font-mono text-xs text-right tabular-nums px-3 ${result.maxSharpePortfolio.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                          {result.maxSharpePortfolio.return.toFixed(2)}%
                        </td>
                        <td className="font-mono text-xs text-right tabular-nums text-muted-foreground px-3">
                          {result.maxSharpePortfolio.volatility.toFixed(2)}%
                        </td>
                        <td className={`font-mono text-xs text-right tabular-nums px-3 ${result.maxSharpePortfolio.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                          {result.maxSharpePortfolio.sharpe.toFixed(3)}
                        </td>
                        <td className="font-mono text-xs text-right tabular-nums text-muted-foreground px-3">
                          {result.maxSharpePortfolio.numAssets}
                        </td>
                        <td className="text-center px-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 text-[9px] px-2"
                            onClick={() => setSelectedPortfolio({ portfolio: result.maxSharpePortfolio, type: 'maxSharpe' })}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Asset Details */}
              {result.assets.length > 0 && (
                <div className="mt-4">
                  <p className="terminal-label mb-2">Input Asset Statistics</p>
                  <div className="overflow-x-auto border border-border/30 rounded-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-secondary/30">
                          <th className="text-[10px] text-muted-foreground font-mono text-left py-2 px-3">Ticker</th>
                          <th className="text-[10px] text-muted-foreground font-mono text-right py-2 px-3">E[Return]</th>
                          <th className="text-[10px] text-muted-foreground font-mono text-right py-2 px-3">Volatility</th>
                          <th className="text-[10px] text-muted-foreground font-mono text-right py-2 px-3">Current Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.assets.sort((a, b) => b.weight - a.weight).map(asset => (
                          <tr key={asset.ticker} className="border-t border-border/20 hover:bg-secondary/20">
                            <td className="py-1.5 px-3 font-mono text-xs text-primary">{asset.ticker}</td>
                            <td className={`font-mono text-xs text-right tabular-nums px-3 ${asset.expectedReturn >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                              {asset.expectedReturn.toFixed(2)}%
                            </td>
                            <td className="font-mono text-xs text-right tabular-nums text-muted-foreground px-3">
                              {asset.volatility.toFixed(2)}%
                            </td>
                            <td className="font-mono text-xs text-right tabular-nums px-3">
                              {asset.weight.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          
          {result && result.frontier.length === 0 && result.validationErrors.length === 0 && (
            <div className="p-8 text-center">
              <AlertTriangle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-xs">
                Unable to calculate efficient frontier. Ensure you have sufficient price history for your assets.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Weights Modal */}
      <PortfolioWeightsModal
        isOpen={selectedPortfolio.portfolio !== null}
        onClose={() => setSelectedPortfolio({ portfolio: null, type: null })}
        portfolio={selectedPortfolio.portfolio}
        portfolioType={selectedPortfolio.type}
      />
    </>
  );
}
