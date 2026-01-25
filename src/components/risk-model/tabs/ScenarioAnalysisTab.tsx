/**
 * Scenario Analysis Tab - Stress testing and scenario simulations
 */

import { useMemo, useState } from 'react';
import { Transaction, MonthlyValuation } from '@/types/investment';
import { RiskModelFilters, calculateScenarioImpact } from '@/lib/riskModelData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TabProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  filters: RiskModelFilters;
  hasData: boolean;
}

const SCENARIOS = [
  { id: 'recession', label: 'Recession', description: 'Economic downturn scenario' },
  { id: 'inflation', label: 'Inflation Spike', description: 'High inflation environment' },
  { id: 'rates_up', label: 'Rates +200bps', description: 'Rising interest rates' },
  { id: 'rates_down', label: 'Rates -100bps', description: 'Falling interest rates' },
] as const;

export function ScenarioAnalysisTab({ transactions, valuations, filters, hasData }: TabProps) {
  const [activeScenario, setActiveScenario] = useState<typeof SCENARIOS[number]['id']>('recession');
  
  const scenarioData = useMemo(() => {
    if (!hasData) return [];
    return calculateScenarioImpact(transactions, valuations, activeScenario);
  }, [transactions, valuations, activeScenario, hasData]);
  
  const totalImpact = useMemo(() => {
    return scenarioData.reduce((sum, d) => sum + d.impact, 0);
  }, [scenarioData]);

  if (!hasData) {
    return (
      <div className="bloomberg-panel p-8">
        <EmptyState 
          icon={Zap}
          title="No Scenario Data"
          description="Add transactions and valuations to run scenario analysis"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Scenario Selector */}
      <div className="bloomberg-panel">
        <div className="p-3">
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((scenario) => (
              <Button
                key={scenario.id}
                variant={activeScenario === scenario.id ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setActiveScenario(scenario.id)}
              >
                {scenario.label}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            {SCENARIOS.find(s => s.id === activeScenario)?.description}
          </p>
        </div>
      </div>
      
      {/* Impact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Total Impact</div>
          <div className={cn(
            "text-2xl font-mono tabular-nums mt-1",
            totalImpact >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {totalImpact >= 0 ? '+' : ''}{totalImpact.toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground">Portfolio P&L</div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Worst Factor</div>
          <div className="text-lg font-mono tabular-nums text-destructive mt-1">
            {scenarioData.length > 0 ? scenarioData.reduce((min, d) => d.impact < min.impact ? d : min, scenarioData[0]).factor : '-'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {scenarioData.length > 0 ? `${Math.min(...scenarioData.map(d => d.impact)).toFixed(1)}%` : ''}
          </div>
        </div>
        <div className="bloomberg-panel p-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">Best Factor</div>
          <div className="text-lg font-mono tabular-nums text-success mt-1">
            {scenarioData.length > 0 ? scenarioData.reduce((max, d) => d.impact > max.impact ? d : max, scenarioData[0]).factor : '-'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {scenarioData.length > 0 ? `+${Math.max(...scenarioData.map(d => d.impact)).toFixed(1)}%` : ''}
          </div>
        </div>
      </div>
      
      {/* Impact Chart */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Scenario Impact by Factor
          </span>
        </div>
        <div className="p-3">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={scenarioData} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v}%`}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <YAxis 
                  type="category"
                  dataKey="factor"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  width={70}
                />
                <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={2} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`,
                    props.payload.description
                  ]}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                  {scenarioData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.impact >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 72%, 51%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Factor Details */}
      <div className="bloomberg-panel">
        <div className="bloomberg-header">
          <span className="bloomberg-header-title">Impact Details</span>
        </div>
        <div className="p-3 space-y-2">
          {scenarioData.map((item) => (
            <div key={item.factor} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div>
                <div className="text-xs font-medium">{item.factor}</div>
                <div className="text-[10px] text-muted-foreground">{item.description}</div>
              </div>
              <div className={cn(
                "text-sm font-mono tabular-nums",
                item.impact >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {item.impact >= 0 ? '+' : ''}{item.impact.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
