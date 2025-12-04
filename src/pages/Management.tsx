import { useState } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculatePositions, getLatestValuations, calculateVolatility, calculateMonthlyReturns } from '@/lib/calculations';
import { Settings2, TrendingDown, Calculator, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssetType } from '@/types/investment';

interface ScenarioHolding {
  ticker: string;
  name: string;
  currentValue: number;
  currentWeight: number;
  scenarioWeight: number;
  scenarioDelta: number;
}

// Historical crash drawdowns by asset type (null = didn't exist)
const HISTORICAL_CRASHES: Record<string, { name: string; year: string; drawdowns: Record<AssetType, number | null> }> = {
  'dotcom_2000': {
    name: 'Dot-Com Crash',
    year: '2000-2002',
    drawdowns: {
      equity: -49,
      etf: -45,
      mutual_fund: -40,
      crypto: null, // didn't exist
      bond: 5,
      commodity: 10,
      real_estate: -5,
      cash: 0,
      alternative: -20
    }
  },
  'financial_2008': {
    name: 'Financial Crisis',
    year: '2008-2009',
    drawdowns: {
      equity: -57,
      etf: -55,
      mutual_fund: -50,
      crypto: null, // didn't exist
      bond: -5,
      commodity: -35,
      real_estate: -40,
      cash: 0,
      alternative: -30
    }
  },
  'covid_2020': {
    name: 'COVID-19 Crash',
    year: 'Mar 2020',
    drawdowns: {
      equity: -34,
      etf: -32,
      mutual_fund: -30,
      crypto: -50,
      bond: 2,
      commodity: -30,
      real_estate: -25,
      cash: 0,
      alternative: -20
    }
  },
  'tech_2022': {
    name: 'Tech Selloff',
    year: '2022',
    drawdowns: {
      equity: -25,
      etf: -20,
      mutual_fund: -18,
      crypto: -75,
      bond: -15,
      commodity: 15,
      real_estate: -20,
      cash: 0,
      alternative: -15
    }
  }
};

export default function Management() {
  const { transactions, valuations, performanceMetrics } = usePortfolio();
  const [backtestYears, setBacktestYears] = useState<number>(5);
  const [expectedReturn, setExpectedReturn] = useState<number>(8);
  const [scenarioHoldings, setScenarioHoldings] = useState<ScenarioHolding[]>([]);

  const positions = calculatePositions(transactions);
  const latestVals = getLatestValuations(valuations);
  
  // Calculate current holdings with asset type
  const holdings: { ticker: string; name: string; value: number; weight: number; assetType: AssetType }[] = [];
  let totalValue = 0;

  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.quantity <= 0) continue;
    const val = latestVals[ticker];
    const tx = transactions.find(t => t.ticker === ticker);
    if (!val || !tx) continue;
    
    const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
    totalValue += value;
    holdings.push({ ticker, name: tx.assetName, value, weight: 0, assetType: tx.assetType });
  }

  holdings.forEach(h => h.weight = (h.value / totalValue) * 100);
  holdings.sort((a, b) => b.value - a.value);

  // Calculate crash impact for portfolio
  const calculateCrashImpact = (crashId: string) => {
    const crash = HISTORICAL_CRASHES[crashId];
    if (!crash) return { totalLoss: 0, newValue: totalValue, holdings: [], existingValue: totalValue };

    let totalLoss = 0;
    let existingValue = 0; // Value of assets that existed during the crash
    
    const impactedHoldings = holdings.map(h => {
      const drawdown = crash.drawdowns[h.assetType];
      
      // If asset didn't exist (null), don't include in calculations
      if (drawdown === null) {
        return {
          ticker: h.ticker,
          name: h.name,
          currentValue: h.value,
          drawdown: null as number | null,
          loss: 0,
          newValue: null as number | null,
          existed: false
        };
      }
      
      const loss = h.value * (drawdown / 100);
      totalLoss += loss;
      existingValue += h.value;
      
      return {
        ticker: h.ticker,
        name: h.name,
        currentValue: h.value,
        drawdown,
        loss,
        newValue: h.value + loss,
        existed: true
      };
    });

    return {
      totalLoss,
      newValue: existingValue + totalLoss,
      existingValue,
      holdings: impactedHoldings
    };
  };

  // Initialize scenario holdings if empty
  const initScenario = () => {
    setScenarioHoldings(holdings.map(h => ({
      ticker: h.ticker,
      name: h.name,
      currentValue: h.value,
      currentWeight: h.weight,
      scenarioWeight: h.weight,
      scenarioDelta: 0
    })));
  };

  const updateScenarioWeight = (ticker: string, newWeight: number) => {
    setScenarioHoldings(prev => prev.map(h => 
      h.ticker === ticker 
        ? { ...h, scenarioWeight: newWeight, scenarioDelta: newWeight - h.currentWeight }
        : h
    ));
  };

  // Calculate backtest projection
  const monthlyReturns = calculateMonthlyReturns(transactions, valuations);
  const currentVol = calculateVolatility(monthlyReturns.map(r => r.return));
  
  const calculateBacktest = () => {
    const years = backtestYears;
    const annualReturn = expectedReturn / 100;
    const projections: { year: number; base: number; optimistic: number; pessimistic: number }[] = [];
    
    for (let i = 0; i <= years; i++) {
      const base = totalValue * Math.pow(1 + annualReturn, i);
      const optimistic = totalValue * Math.pow(1 + annualReturn + 0.05, i);
      const pessimistic = totalValue * Math.pow(1 + annualReturn - 0.05, i);
      projections.push({ year: i, base, optimistic, pessimistic });
    }
    
    return projections;
  };

  const projections = calculateBacktest();
  const hasData = holdings.length > 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="terminal-label text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Portfolio Management
          </h1>
          <p className="text-muted-foreground text-[10px] font-mono mt-0.5">
            Scenario analysis and portfolio projections
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="space-y-4">
          {/* Backtest Projection */}
          <div className="bloomberg-panel">
            <div className="bloomberg-header flex items-center justify-between">
              <div>
                <span className="text-primary">■</span> Portfolio Projection
              </div>
              <div className="flex items-center gap-2">
                <Select value={backtestYears.toString()} onValueChange={(v) => setBacktestYears(Number(v))}>
                  <SelectTrigger className="h-6 w-20 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Return:</span>
                  <Input 
                    type="number" 
                    value={expectedReturn} 
                    onChange={(e) => setExpectedReturn(Number(e.target.value))}
                    className="h-6 w-14 text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="terminal-label text-left py-2">Year</th>
                    <th className="terminal-label text-right py-2">Pessimistic</th>
                    <th className="terminal-label text-right py-2">Base Case</th>
                    <th className="terminal-label text-right py-2">Optimistic</th>
                  </tr>
                </thead>
                <tbody>
                  {projections.map((p) => (
                    <tr key={p.year} className="border-b border-border/20 hover:bg-primary/5">
                      <td className="font-mono text-xs py-2">{p.year === 0 ? 'Now' : `Year ${p.year}`}</td>
                      <td className="font-mono text-xs text-right tabular-nums text-destructive">
                        ${p.pessimistic.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-primary font-medium">
                        ${p.base.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="font-mono text-xs text-right tabular-nums text-success">
                        ${p.optimistic.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-muted-foreground mt-3 font-mono">
                Base: {expectedReturn}% annual return | Optimistic: +5% | Pessimistic: -5%
              </p>
            </div>
          </div>

          {/* Historical Crash Scenarios */}
          <div className="bloomberg-panel">
            <div className="bloomberg-header">
              <span className="text-primary">■</span> Historical Crash Scenarios
              <span className="text-muted-foreground text-[10px] ml-2">Impact on current holdings</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {Object.entries(HISTORICAL_CRASHES).map(([crashId, crash]) => {
                  const impact = calculateCrashImpact(crashId);
                  const pctChange = ((impact.newValue - totalValue) / totalValue) * 100;
                  
                  return (
                    <div key={crashId} className="bg-muted/20 border border-border/30 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <div>
                          <p className="text-xs font-medium text-primary">{crash.name}</p>
                          <p className="text-[10px] text-muted-foreground">{crash.year}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">Current Value:</span>
                          <span className="font-mono">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-muted-foreground">After Crash:</span>
                          <span className="font-mono text-destructive">${impact.newValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-muted-foreground">Loss:</span>
                          <span className="font-mono text-destructive">{pctChange.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="mt-2 h-2 bg-muted/30 rounded-sm overflow-hidden">
                        <div 
                          className="h-full bg-destructive/70 rounded-sm"
                          style={{ width: `${Math.abs(pctChange)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detailed breakdown */}
              <div className="mt-4 border-t border-border/30 pt-4">
                <p className="terminal-label mb-2">Detailed Impact by Holding</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="terminal-label text-left py-2">Asset</th>
                        <th className="terminal-label text-right py-2">Current</th>
                        {Object.entries(HISTORICAL_CRASHES).map(([id, crash]) => (
                          <th key={id} className="terminal-label text-right py-2">{crash.name.split(' ')[0]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.slice(0, 8).map((h) => (
                        <tr key={h.ticker} className="border-b border-border/20 hover:bg-primary/5">
                          <td className="py-1.5">
                            <span className="font-mono text-primary">{h.ticker}</span>
                          </td>
                          <td className="font-mono text-right tabular-nums">
                            ${h.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </td>
                          {Object.entries(HISTORICAL_CRASHES).map(([id, crash]) => {
                            const drawdown = crash.drawdowns[h.assetType];
                            
                            // Show X if asset didn't exist during this crash
                            if (drawdown === null) {
                              return (
                                <td key={id} className="font-mono text-right tabular-nums text-muted-foreground">
                                  <span className="text-warning">X</span>
                                  <span className="text-[9px] ml-1 text-muted-foreground/50">(N/A)</span>
                                </td>
                              );
                            }
                            
                            const newVal = h.value * (1 + drawdown / 100);
                            return (
                              <td key={id} className={`font-mono text-right tabular-nums ${drawdown < 0 ? 'text-destructive' : 'text-success'}`}>
                                ${newVal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                <span className="text-[9px] ml-1">({drawdown > 0 ? '+' : ''}{drawdown}%)</span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="bloomberg-panel">
            <div className="bloomberg-header flex items-center justify-between">
              <div>
                <span className="text-primary">■</span> Allocation Scenario
              </div>
              <Button size="sm" variant="outline" onClick={initScenario} className="h-6 text-xs">
                <Calculator className="h-3 w-3 mr-1" />
                Load Current
              </Button>
            </div>
            <div className="p-4">
              {scenarioHoldings.length > 0 ? (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="terminal-label text-left py-2">Asset</th>
                        <th className="terminal-label text-right py-2">Current %</th>
                        <th className="terminal-label text-right py-2">Target %</th>
                        <th className="terminal-label text-right py-2">Delta</th>
                        <th className="terminal-label text-right py-2">Trade Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenarioHoldings.map((h) => (
                        <tr key={h.ticker} className="border-b border-border/20 hover:bg-primary/5">
                          <td className="py-2">
                            <span className="font-mono text-xs text-primary font-medium">{h.ticker}</span>
                          </td>
                          <td className="font-mono text-xs text-right tabular-nums text-muted-foreground">
                            {h.currentWeight.toFixed(2)}%
                          </td>
                          <td className="py-2 text-right">
                            <Input 
                              type="number" 
                              value={h.scenarioWeight.toFixed(2)} 
                              onChange={(e) => updateScenarioWeight(h.ticker, Number(e.target.value))}
                              className="h-6 w-20 text-xs text-right ml-auto"
                            />
                          </td>
                          <td className={`font-mono text-xs text-right tabular-nums ${h.scenarioDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {h.scenarioDelta >= 0 ? '+' : ''}{h.scenarioDelta.toFixed(2)}%
                          </td>
                          <td className={`font-mono text-xs text-right tabular-nums ${h.scenarioDelta >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {h.scenarioDelta >= 0 ? '+' : ''}${((h.scenarioDelta / 100) * totalValue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 p-3 bg-muted/20 rounded">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total Weight:</span>
                      <span className={`font-mono ${Math.abs(scenarioHoldings.reduce((s, h) => s + h.scenarioWeight, 0) - 100) < 0.1 ? 'text-success' : 'text-warning'}`}>
                        {scenarioHoldings.reduce((s, h) => s + h.scenarioWeight, 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Calculator className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-xs">Click "Load Current" to start scenario analysis</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Stats */}
          <div className="bloomberg-panel">
            <div className="bloomberg-header">
              <span className="text-primary">■</span> Current Portfolio Stats
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="terminal-label">Total Value</p>
                <p className="font-mono text-lg text-primary">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="terminal-label">Holdings</p>
                <p className="font-mono text-lg">{holdings.length}</p>
              </div>
              <div>
                <p className="terminal-label">Volatility</p>
                <p className="font-mono text-lg">{currentVol.toFixed(2)}%</p>
              </div>
              <div>
                <p className="terminal-label">Total Return</p>
                <p className={`font-mono text-lg ${(performanceMetrics?.totalReturn || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {performanceMetrics?.totalReturn.toFixed(2) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bloomberg-panel p-8 text-center">
          <Settings2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">No Portfolio Data</h3>
          <p className="text-muted-foreground text-xs">Add transactions and valuations to use management tools.</p>
        </div>
      )}
    </div>
  );
}