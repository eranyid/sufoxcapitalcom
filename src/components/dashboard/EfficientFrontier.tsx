import { useState, useMemo, useCallback } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateEfficientFrontier, EfficientFrontierResult, FrontierOptions, PortfolioPoint } from '@/lib/efficientFrontier';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend, Line, ComposedChart } from 'recharts';
import { TrendingUp, AlertTriangle, RefreshCw, Target, Crosshair, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
    numPortfolios: 2000,
    allowLeverage: false,
    allowShortSelling: false
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<EfficientFrontierResult | null>(null);
  
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
  
  // Initial calculation on mount
  useMemo(() => {
    if (transactions.length > 0 && valuations.length > 0 && !result) {
      calculate();
    }
  }, [transactions.length, valuations.length]);
  
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!result) return [];
    
    const data: ChartDataPoint[] = [];
    
    // Add frontier points
    result.frontier.forEach(p => {
      data.push({
        x: p.volatility,
        y: p.return,
        type: 'frontier',
        data: p
      });
    });
    
    // Add special points
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
  
  // Calculate CML (Capital Market Line) data points
  const cmlData = useMemo(() => {
    if (!result?.maxSharpePortfolio) return [];
    
    const maxSharpe = result.maxSharpePortfolio;
    const rf = options.riskFreeRate;
    
    // CML equation: Return = Rf + (Sharpe * Volatility)
    // Line from (0, Rf) through (maxSharpe.volatility, maxSharpe.return)
    const slope = maxSharpe.sharpe;
    
    // Extend the line beyond max Sharpe point
    const maxX = Math.max(...chartData.map(d => d.x), maxSharpe.volatility * 1.5);
    
    return [
      { x: 0, y: rf },
      { x: maxSharpe.volatility, y: maxSharpe.return },
      { x: maxX, y: rf + slope * maxX }
    ];
  }, [result, options.riskFreeRate, chartData]);
  
  const getPointColor = (type: string) => {
    switch (type) {
      case 'current': return 'hsl(30, 100%, 50%)'; // Primary orange
      case 'minVar': return 'hsl(210, 100%, 55%)'; // Blue
      case 'maxSharpe': return 'hsl(120, 60%, 40%)'; // Green
      default: return 'hsl(0, 0%, 50%)'; // Gray for frontier
    }
  };
  
  const getPointSize = (type: string) => {
    switch (type) {
      case 'current': return 120;
      case 'minVar': return 100;
      case 'maxSharpe': return 100;
      default: return 20;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      
      // Skip tooltip for CML line points (they don't have the 'data' property)
      if (!point || !point.data) {
        return null;
      }
      
      const data = point.data;
      
      const typeLabels: Record<string, string> = {
        frontier: 'Frontier Portfolio',
        current: 'Current Portfolio',
        minVar: 'Min Variance',
        maxSharpe: 'Max Sharpe'
      };
      
      return (
        <div className="bg-secondary border border-border p-3 rounded-sm shadow-lg">
          <p className="font-mono text-xs font-medium text-primary mb-2">
            {typeLabels[point.type] || 'Portfolio'}
          </p>
          <div className="space-y-1">
            <p className="font-mono text-[10px] text-foreground">
              Return: <span className="text-chart-positive">{data.return.toFixed(2)}%</span>
            </p>
            <p className="font-mono text-[10px] text-foreground">
              Volatility: <span className="text-muted-foreground">{data.volatility.toFixed(2)}%</span>
            </p>
            <p className="font-mono text-[10px] text-foreground">
              Sharpe: <span className={data.sharpe > 0 ? 'text-chart-positive' : 'text-chart-negative'}>
                {data.sharpe.toFixed(3)}
              </span>
            </p>
            <p className="font-mono text-[10px] text-muted-foreground">
              Assets: {data.numAssets}
            </p>
          </div>
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
    <div className="bloomberg-panel">
      <div className="bloomberg-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary">■</span> Efficient Frontier
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={calculate}
          disabled={isCalculating}
          className="h-7 text-[10px]"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isCalculating ? 'animate-spin' : ''}`} />
          {isCalculating ? 'Calculating...' : 'Recalculate'}
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
            <Label className="text-[10px] text-muted-foreground font-mono">Simulated Portfolios</Label>
            <Input
              type="number"
              step="500"
              min="500"
              max="10000"
              value={options.numPortfolios}
              onChange={(e) => setOptions(prev => ({ ...prev, numPortfolios: parseInt(e.target.value) || 2000 }))}
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
            <div className="h-[320px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 22%)" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Volatility"
                    unit="%"
                    domain={[0, 'auto']}
                    tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: 'hsl(0, 0%, 22%)' }}
                    label={{ 
                      value: 'Volatility (%)', 
                      position: 'bottom', 
                      fill: 'hsl(0, 0%, 50%)',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Return"
                    unit="%"
                    domain={['auto', 'auto']}
                    tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: 'hsl(0, 0%, 22%)' }}
                    label={{ 
                      value: 'Expected Return (%)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: 'hsl(0, 0%, 50%)',
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Risk-free rate line */}
                  <ReferenceLine 
                    y={options.riskFreeRate} 
                    stroke="hsl(0, 0%, 40%)" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: `Rf: ${options.riskFreeRate}%`, 
                      fill: 'hsl(0, 0%, 50%)',
                      fontSize: 9,
                      fontFamily: 'JetBrains Mono'
                    }}
                  />
                  
                  {/* Capital Market Line (CML) */}
                  {cmlData.length > 0 && (
                    <Line
                      data={cmlData}
                      type="linear"
                      dataKey="y"
                      stroke="hsl(45, 100%, 50%)"
                      strokeWidth={2}
                      strokeDasharray="8 4"
                      dot={false}
                      name="CML"
                      legendType="none"
                    />
                  )}
                  
                  <Scatter name="Portfolios" data={chartData} shape="circle">
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getPointColor(entry.type)}
                        r={Math.sqrt(getPointSize(entry.type) / Math.PI)}
                      />
                    ))}
                  </Scatter>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <CircleDot className="h-3 w-3" style={{ color: 'hsl(0, 0%, 50%)' }} />
                <span className="text-muted-foreground">Frontier</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5" style={{ background: 'hsl(45, 100%, 50%)', borderStyle: 'dashed' }} />
                <span style={{ color: 'hsl(45, 100%, 50%)' }}>CML</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3" style={{ color: 'hsl(30, 100%, 50%)' }} />
                <span className="text-primary">Current Portfolio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Crosshair className="h-3 w-3" style={{ color: 'hsl(210, 100%, 55%)' }} />
                <span style={{ color: 'hsl(210, 100%, 55%)' }}>Min Variance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" style={{ color: 'hsl(120, 60%, 40%)' }} />
                <span style={{ color: 'hsl(120, 60%, 40%)' }}>Max Sharpe</span>
              </div>
            </div>
            
            {/* Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="terminal-label text-left py-2">Portfolio</th>
                    <th className="terminal-label text-right py-2">Return</th>
                    <th className="terminal-label text-right py-2">Volatility</th>
                    <th className="terminal-label text-right py-2">Sharpe</th>
                    <th className="terminal-label text-right py-2">Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {result.currentPortfolio && (
                    <tr className="border-b border-border/20 bg-primary/5">
                      <td className="py-2 font-mono text-xs flex items-center gap-2">
                        <Target className="h-3 w-3 text-primary" />
                        <span className="text-primary font-medium">Current</span>
                      </td>
                      <td className={`font-mono text-xs text-right tabular-nums ${result.currentPortfolio.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                        {result.currentPortfolio.return.toFixed(2)}%
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                        {result.currentPortfolio.volatility.toFixed(2)}%
                      </td>
                      <td className={`font-mono text-xs text-right tabular-nums ${result.currentPortfolio.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                        {result.currentPortfolio.sharpe.toFixed(3)}
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                        {result.currentPortfolio.numAssets}
                      </td>
                    </tr>
                  )}
                  {result.minVariancePortfolio && (
                    <tr className="border-b border-border/20">
                      <td className="py-2 font-mono text-xs flex items-center gap-2">
                        <Crosshair className="h-3 w-3" style={{ color: 'hsl(210, 100%, 55%)' }} />
                        <span style={{ color: 'hsl(210, 100%, 55%)' }}>Min Variance</span>
                      </td>
                      <td className={`font-mono text-xs text-right tabular-nums ${result.minVariancePortfolio.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                        {result.minVariancePortfolio.return.toFixed(2)}%
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                        {result.minVariancePortfolio.volatility.toFixed(2)}%
                      </td>
                      <td className={`font-mono text-xs text-right tabular-nums ${result.minVariancePortfolio.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                        {result.minVariancePortfolio.sharpe.toFixed(3)}
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                        {result.minVariancePortfolio.numAssets}
                      </td>
                    </tr>
                  )}
                  {result.maxSharpePortfolio && (
                    <tr className="border-b border-border/20">
                      <td className="py-2 font-mono text-xs flex items-center gap-2">
                        <TrendingUp className="h-3 w-3" style={{ color: 'hsl(120, 60%, 40%)' }} />
                        <span style={{ color: 'hsl(120, 60%, 40%)' }}>Max Sharpe</span>
                      </td>
                      <td className={`font-mono text-xs text-right tabular-nums ${result.maxSharpePortfolio.return >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                        {result.maxSharpePortfolio.return.toFixed(2)}%
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                        {result.maxSharpePortfolio.volatility.toFixed(2)}%
                      </td>
                      <td className={`font-mono text-xs text-right tabular-nums ${result.maxSharpePortfolio.sharpe >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                        {result.maxSharpePortfolio.sharpe.toFixed(3)}
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                        {result.maxSharpePortfolio.numAssets}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Asset Details */}
            {result.assets.length > 0 && (
              <div className="mt-4">
                <p className="terminal-label mb-2">Asset Statistics</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="terminal-label text-left py-2">Ticker</th>
                        <th className="terminal-label text-right py-2">E[Return]</th>
                        <th className="terminal-label text-right py-2">Volatility</th>
                        <th className="terminal-label text-right py-2">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.assets.sort((a, b) => b.weight - a.weight).map(asset => (
                        <tr key={asset.ticker} className="border-b border-border/20 hover:bg-primary/5">
                          <td className="py-1.5 font-mono text-xs text-primary">{asset.ticker}</td>
                          <td className={`font-mono text-xs text-right tabular-nums ${asset.expectedReturn >= 0 ? 'text-chart-positive' : 'text-chart-negative'}`}>
                            {asset.expectedReturn.toFixed(2)}%
                          </td>
                          <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                            {asset.volatility.toFixed(2)}%
                          </td>
                          <td className="font-mono text-xs text-right tabular-nums">
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
              Unable to calculate efficient frontier. Check that you have sufficient price history for your assets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
