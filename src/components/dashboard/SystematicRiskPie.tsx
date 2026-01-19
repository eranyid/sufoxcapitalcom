import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState } from '@/components/ui/empty-state';
import { ShieldQuestion } from 'lucide-react';

interface SystematicRiskPieProps {
  systematicPct: number;
  specificPct: number;
  residualVolatility: number;
}

export function SystematicRiskPie({ 
  systematicPct, 
  specificPct, 
  residualVolatility 
}: SystematicRiskPieProps) {
  // Check if there's no meaningful data
  const hasNoData = systematicPct === 0 && specificPct === 0;
  
  const data = [
    { name: 'Systematic Risk', value: systematicPct, color: 'hsl(var(--primary))' },
    { name: 'Specific Risk', value: specificPct, color: 'hsl(var(--muted))' }
  ];

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Risk Decomposition</span>
      </div>
      {hasNoData ? (
        <EmptyState 
          icon={ShieldQuestion}
          title="No Risk Data"
          description="Factor analysis requires sufficient historical returns data"
        />
      ) : (
      <div className="p-3">
        <div className="h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono'
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-[9px] text-muted-foreground uppercase">R²</div>
              <div className="text-lg font-mono text-primary font-semibold">
                {systematicPct.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--primary))' }} />
              <span className="text-[10px] text-muted-foreground">Systematic</span>
            </div>
            <div className="text-lg font-mono text-primary font-semibold">
              {systematicPct.toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">Factor-driven risk</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--muted))' }} />
              <span className="text-[10px] text-muted-foreground">Specific</span>
            </div>
            <div className="text-lg font-mono text-foreground font-semibold">
              {specificPct.toFixed(1)}%
            </div>
            <div className="text-[9px] text-muted-foreground">Idiosyncratic risk</div>
          </div>
        </div>
        
        {/* Residual volatility */}
        <div className="mt-3 pt-3 border-t border-border text-center">
          <div className="text-[9px] text-muted-foreground uppercase mb-1">
            Residual Volatility (Ann.)
          </div>
          <div className="font-mono text-sm text-foreground">
            {residualVolatility.toFixed(2)}%
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
