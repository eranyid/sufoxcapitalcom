import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { AssetClassAllocation, TargetConstraints } from '@/types/construction';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Layers, Check, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetClassStepProps {
  assetClasses: AssetClassAllocation;
  constraints: TargetConstraints;
  onUpdate: (assetClasses: AssetClassAllocation) => void;
}

const ASSET_COLORS: Record<keyof AssetClassAllocation, string> = {
  equities: 'hsl(var(--primary))',
  bonds: 'hsl(210, 80%, 55%)',
  funds: 'hsl(45, 100%, 50%)',
  hedging: 'hsl(280, 60%, 50%)',
  alternatives: 'hsl(160, 60%, 45%)',
  cash: 'hsl(0, 0%, 60%)',
};

const ASSET_LABELS: Record<keyof AssetClassAllocation, string> = {
  equities: 'Equities',
  bonds: 'Bonds',
  funds: 'Funds',
  hedging: 'Hedging',
  alternatives: 'Alternatives',
  cash: 'Cash',
};

export function AssetClassStep({ assetClasses, constraints, onUpdate }: AssetClassStepProps) {
  const total = Object.values(assetClasses).reduce((a, b) => a + b, 0);
  const isValid = Math.abs(total - 100) < 0.01;

  // Constraint validation
  const meetsEquityMin = assetClasses.equities >= constraints.minEquities;
  const meetsCashMin = assetClasses.cash >= constraints.minCash;
  const meetsHedgeMin = assetClasses.hedging >= constraints.minHedge;

  const updateValue = (key: keyof AssetClassAllocation, value: number) => {
    onUpdate({ ...assetClasses, [key]: Math.max(0, Math.min(100, value)) });
  };

  const chartData = Object.entries(assetClasses)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: ASSET_LABELS[key as keyof AssetClassAllocation],
      value,
      fill: ASSET_COLORS[key as keyof AssetClassAllocation],
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Controls */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            Asset Class Allocation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.keys(assetClasses) as (keyof AssetClassAllocation)[]).map((key) => {
            const isConstrained = 
              (key === 'equities' && !meetsEquityMin) ||
              (key === 'cash' && !meetsCashMin) ||
              (key === 'hedging' && !meetsHedgeMin);
            
            const minRequired = 
              key === 'equities' ? constraints.minEquities :
              key === 'cash' ? constraints.minCash :
              key === 'hedging' ? constraints.minHedge : 0;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className={cn(
                    "text-xs flex items-center gap-2",
                    isConstrained && "text-amber-500"
                  )}>
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: ASSET_COLORS[key] }} 
                    />
                    {ASSET_LABELS[key]}
                    {isConstrained && (
                      <span className="text-[10px] text-amber-500">
                        (min {minRequired}%)
                      </span>
                    )}
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {assetClasses[key]}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[assetClasses[key]]}
                    onValueChange={([val]) => updateValue(key, val)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={assetClasses[key]}
                    onChange={(e) => updateValue(key, Number(e.target.value))}
                    className="w-16 h-8 text-center text-xs"
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            );
          })}

          {/* Total */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-md mt-4",
            isValid ? "bg-primary/10" : "bg-destructive/10"
          )}>
            <span className="text-sm font-medium flex items-center gap-2">
              {isValid ? <Check size={14} className="text-primary" /> : <AlertCircle size={14} className="text-destructive" />}
              Total
            </span>
            <span className={cn(
              "text-sm font-mono font-bold",
              isValid ? "text-primary" : "text-destructive"
            )}>
              {total}%
            </span>
          </div>

          {/* Constraint Warnings */}
          {(!meetsEquityMin || !meetsCashMin || !meetsHedgeMin) && (
            <div className="p-3 bg-amber-500/10 rounded-md space-y-1">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-medium">
                <AlertTriangle size={12} />
                Constraint Warnings
              </div>
              {!meetsEquityMin && (
                <p className="text-[10px] text-muted-foreground">
                  Equities below minimum ({constraints.minEquities}%)
                </p>
              )}
              {!meetsCashMin && (
                <p className="text-[10px] text-muted-foreground">
                  Cash below minimum ({constraints.minCash}%)
                </p>
              )}
              {!meetsHedgeMin && (
                <p className="text-[10px] text-muted-foreground">
                  Options/Hedge below minimum ({constraints.minHedge}%)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Allocation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
