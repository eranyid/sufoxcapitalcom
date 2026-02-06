import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileCheck, Download, ArrowRight, CheckCircle2, 
  TrendingUp, Shield, PieChart, Target 
} from 'lucide-react';
import { BloombergPanel } from '@/components/ui/bloomberg-panel';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { WizardData } from '@/types/construction';
import type { AssetERResult } from '@/types/constructionPipeline';
import type { Position } from '@/types/allocationBuilder';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { toast } from 'sonner';
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
} from 'recharts';

interface PipelineSummaryProps {
  wizardData: WizardData;
  erResults: AssetERResult[];
  positions: Position[];
  saveToPolicy?: boolean;
  onOpenAnalysis?: () => void;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 80%, 55%)',
  'hsl(45, 90%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 60%, 50%)',
  'hsl(160, 70%, 45%)',
  'hsl(30, 80%, 50%)',
  'hsl(200, 80%, 50%)',
];

export function PipelineSummary({ wizardData, erResults, positions, saveToPolicy = true, onOpenAnalysis }: PipelineSummaryProps) {
  const navigate = useNavigate();
  const { saveTarget } = useTargetAllocation();

  const totalAllocation = positions.reduce((sum, p) => sum + p.allocation, 0);
  const isBalanced = Math.abs(totalAllocation - 100) < 0.01;

  // Aggregate positions by asset type for pie chart
  const assetTypeData = useMemo(() => {
    const map = new Map<string, number>();
    positions.forEach(p => {
      map.set(p.assetType, (map.get(p.assetType) || 0) + p.allocation);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [positions]);

  // Region data
  const regionData = useMemo(() => {
    const map = new Map<string, number>();
    positions.forEach(p => {
      map.set(p.region, (map.get(p.region) || 0) + p.allocation);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [positions]);

  // Portfolio E(r)
  const portfolioER = useMemo(() => {
    if (erResults.length === 0) return 0;
    // Weight by asset class weights from wizard
    const totalWeight = Object.values(wizardData.assetClasses).reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return 0;
    
    const assetNames = Object.keys(wizardData.assetClasses);
    let weighted = 0;
    erResults.forEach((r, i) => {
      const w = (Object.values(wizardData.assetClasses)[i] || 0) / totalWeight;
      weighted += w * r.expectedReturn;
    });
    return weighted;
  }, [erResults, wizardData]);

  const portfolioVol = useMemo(() => {
    if (erResults.length === 0) return 0;
    const totalWeight = Object.values(wizardData.assetClasses).reduce((a, b) => a + b, 0);
    let weighted = 0;
    erResults.forEach((r, i) => {
      const w = (Object.values(wizardData.assetClasses)[i] || 0) / totalWeight;
      weighted += w * r.standardDeviation;
    });
    return weighted;
  }, [erResults, wizardData]);

  // Save to policy and navigate
  const handleExportToPolicy = async () => {
    try {
      const targetId = await saveTarget(wizardData, 'Pipeline Target');
      if (targetId) {
        toast.success('Target allocation exported to Policy');
        navigate('/policy');
      }
    } catch (err) {
      toast.error('Failed to export');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Pipeline Summary</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {saveToPolicy ? 'Review before exporting to Policy' : 'Review your allocation analysis'}
            </p>
          </div>
        </div>
        {saveToPolicy ? (
          <Button onClick={handleExportToPolicy} size="sm" className="gap-2 w-full sm:w-auto" disabled={!isBalanced}>
            <ArrowRight className="h-4 w-4" />
            Export to Policy
          </Button>
        ) : (
          <Badge variant="outline" className="font-mono text-xs">Analysis Only</Badge>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Portfolio E(r)', value: `${portfolioER.toFixed(2)}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Weighted σ', value: `${portfolioVol.toFixed(2)}%`, icon: Shield, color: 'text-rose-400' },
          { label: 'Positions', value: `${positions.length}`, icon: PieChart, color: 'text-primary' },
          { label: 'Allocation', value: `${totalAllocation.toFixed(1)}%`, icon: Target, color: isBalanced ? 'text-emerald-400' : 'text-amber-400' },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/30">
            <CardContent className="py-4 px-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              </div>
              <span className={cn("font-mono text-2xl font-bold", kpi.color)}>
                {kpi.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Target Allocation Table */}
      <BloombergPanel title="Final Target Allocation" titleIcon={<Target className="h-4 w-4 text-primary" />} contentClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Asset Type</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Region</th>
                <th className="px-3 py-3 text-center font-medium text-muted-foreground">Currency</th>
                <th className="px-3 py-3 text-center font-medium text-primary">Weight %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-5 rounded-full bg-primary/40" />
                      {pos.name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className="text-[10px]">{pos.assetType}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground">{pos.region}</td>
                  <td className="px-3 py-2.5 text-center font-mono">{pos.currency}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-mono font-bold text-primary">{pos.allocation.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-primary/5">
                <td className="px-4 py-3 font-bold text-primary" colSpan={4}>Total</td>
                <td className="px-3 py-3 text-center">
                  <span className={cn(
                    "font-mono font-bold text-lg",
                    isBalanced ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {totalAllocation.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </BloombergPanel>

      {/* E(r) Results Table */}
      {erResults.length > 0 && (
        <BloombergPanel title="Expected Return Analysis" titleIcon={<TrendingUp className="h-4 w-4 text-emerald-400" />} contentClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asset Class</th>
                  <th className="px-3 py-3 text-center font-medium text-emerald-400">E(r)</th>
                  <th className="px-3 py-3 text-center font-medium text-rose-400">σ</th>
                  <th className="px-3 py-3 text-center font-medium text-amber-400">Sharpe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {erResults.map((r) => (
                  <tr key={r.assetClass} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{r.assetClass}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-emerald-400">{r.expectedReturn.toFixed(2)}%</td>
                    <td className="px-3 py-2.5 text-center font-mono text-rose-400">{r.standardDeviation.toFixed(2)}%</td>
                    <td className="px-3 py-2.5 text-center font-mono text-amber-400">{r.sharpeRatio.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BloombergPanel>
      )}

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset Type Pie */}
        <BloombergPanel title="By Asset Type" titleIcon={<PieChart className="h-4 w-4 text-primary" />}>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                  labelLine={false}
                >
                  {assetTypeData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </BloombergPanel>

        {/* Region Bar */}
        <BloombergPanel title="By Region" titleIcon={<BarChart className="h-4 w-4 text-amber-400" />}>
          <div className="h-[250px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={90} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BloombergPanel>
      </div>

      {/* Export Actions */}
      <Separator className="border-primary/20" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isBalanced ? (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Allocation balanced — Ready to export
            </span>
          ) : (
            <span className="text-amber-400">
              Allocation is {totalAllocation.toFixed(1)}% — Adjust to 100%
            </span>
          )}
        </p>
        {saveToPolicy ? (
          <Button onClick={handleExportToPolicy} className="gap-2 font-mono w-full sm:w-auto" disabled={!isBalanced}>
            <Download className="h-4 w-4" />
            DEPLOY TO POLICY
          </Button>
        ) : (
          <Button onClick={() => onOpenAnalysis?.()} className="gap-2 font-mono w-full sm:w-auto">
            <ArrowRight className="h-4 w-4" />
            FULL ANALYSIS
          </Button>
        )}
      </div>
    </div>
  );
}
