import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BloombergPanel } from '@/components/ui/bloomberg-panel';
import { cn } from '@/lib/utils';
import {
  TrendingUp, Shield, PieChart, Target, Globe, Layers, BarChart3,
  CheckCircle2, AlertTriangle, Activity, Gauge, Compass, Building2,
  ArrowUpRight, ArrowDownRight, Minus, Zap, Clock, DollarSign
} from 'lucide-react';
import type { WizardData } from '@/types/construction';
import { OBJECTIVE_LABELS, RISK_LABELS, ALTERNATIVE_LABELS } from '@/types/construction';
import type { AssetERResult } from '@/types/constructionPipeline';
import { SCENARIO_LABELS, SCENARIO_KEYS } from '@/types/constructionPipeline';
import type { Position } from '@/types/allocationBuilder';
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area, LineChart, Line, Legend,
  Treemap,
} from 'recharts';

interface PipelineFullAnalysisProps {
  wizardData: WizardData;
  erResults: AssetERResult[];
  positions: Position[];
}

const CHART_COLORS = [
  'hsl(24, 95%, 53%)',   // primary orange
  'hsl(210, 80%, 55%)',  // blue
  'hsl(45, 90%, 50%)',   // gold
  'hsl(160, 70%, 45%)',  // teal
  'hsl(280, 60%, 50%)',  // purple
  'hsl(0, 72%, 51%)',    // red
  'hsl(30, 80%, 50%)',   // amber
  'hsl(200, 80%, 50%)',  // cyan
];

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '11px',
};

export function PipelineFullAnalysis({ wizardData, erResults, positions }: PipelineFullAnalysisProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const totalAllocation = positions.reduce((sum, p) => sum + p.allocation, 0);
  const isBalanced = Math.abs(totalAllocation - 100) < 0.01;

  // === Computed data ===

  const portfolioER = useMemo(() => {
    if (erResults.length === 0) return 0;
    const totalWeight = Object.values(wizardData.assetClasses).reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return 0;
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

  const portfolioSharpe = portfolioVol > 0 ? (portfolioER - 4.5) / portfolioVol : 0;

  // Asset type aggregation
  const assetTypeData = useMemo(() => {
    const map = new Map<string, number>();
    positions.forEach(p => map.set(p.assetType, (map.get(p.assetType) || 0) + p.allocation));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [positions]);

  // Region aggregation
  const regionData = useMemo(() => {
    const map = new Map<string, number>();
    positions.forEach(p => map.set(p.region, (map.get(p.region) || 0) + p.allocation));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [positions]);

  // Currency aggregation
  const currencyData = useMemo(() => {
    const map = new Map<string, number>();
    positions.forEach(p => map.set(p.currency, (map.get(p.currency) || 0) + p.allocation));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [positions]);

  // Sector aggregation
  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    positions.forEach(p => {
      const sector = p.sector || 'Unclassified';
      map.set(sector, (map.get(sector) || 0) + p.allocation);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [positions]);

  // Liquidity aggregation
  const liquidityData = useMemo(() => {
    const map = new Map<string, number>();
    positions.forEach(p => {
      const bucket = p.liquidityBucket || 'Unknown';
      map.set(bucket, (map.get(bucket) || 0) + p.allocation);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [positions]);

  // Treemap data
  const treemapData = useMemo(() => {
    return positions.map((p, i) => ({
      name: p.name,
      size: p.allocation,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [positions]);

  // Wizard target vs actual comparison
  const targetVsActualData = useMemo(() => {
    const labels: Record<string, string> = {
      equities: 'Equities', bonds: 'Fixed Income', hedging: 'Hedging',
      alternatives: 'Alternatives', cash: 'Cash',
    };
    return Object.entries(wizardData.assetClasses)
      .filter(([_, weight]) => weight > 0)
      .map(([key, target]) => {
        // Find actual allocation matching this asset type
        const actualType = labels[key] || key;
        const actual = assetTypeData.find(a => 
          a.name.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(a.name.toLowerCase())
        )?.value || 0;
        return { name: actualType, target, actual, deviation: actual - target };
      });
  }, [wizardData.assetClasses, assetTypeData]);

  // Geography target vs actual
  const geoTargetVsActual = useMemo(() => {
    const geoLabels: Record<string, string> = {
      israel: 'Israel', usa: 'USA', europe: 'Europe', other: 'Other',
    };
    return Object.entries(wizardData.geography)
      .filter(([_, weight]) => weight > 0)
      .map(([key, target]) => {
        const actual = regionData.find(r => 
          r.name.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(r.name.toLowerCase())
        )?.value || 0;
        return { name: geoLabels[key] || key, target, actual, deviation: actual - target };
      });
  }, [wizardData.geography, regionData]);

  // Scenario analysis data for ER chart
  const scenarioChartData = useMemo(() => {
    if (erResults.length === 0) return [];
    return SCENARIO_KEYS.map(key => {
      const row: Record<string, string | number> = { scenario: SCENARIO_LABELS[key] };
      erResults.forEach(r => {
        row[r.assetClass] = r.scenarioReturns[key];
      });
      return row;
    });
  }, [erResults]);

  // Concentration metrics
  const concentrationMetrics = useMemo(() => {
    const sorted = [...positions].sort((a, b) => b.allocation - a.allocation);
    const top3 = sorted.slice(0, 3).reduce((s, p) => s + p.allocation, 0);
    const top5 = sorted.slice(0, 5).reduce((s, p) => s + p.allocation, 0);
    const hhi = positions.reduce((s, p) => s + (p.allocation / 100) ** 2, 0) * 10000;
    const maxPos = sorted[0]?.allocation || 0;
    return { top3, top5, hhi: Math.round(hhi), maxPos, count: positions.length };
  }, [positions]);

  // Alternatives breakdown
  const alternativesBreakdown = useMemo(() => {
    return Object.entries(wizardData.alternatives)
      .filter(([_, v]) => v > 0)
      .map(([key, value]) => ({
        name: ALTERNATIVE_LABELS[key as keyof typeof ALTERNATIVE_LABELS] || key,
        value,
      }));
  }, [wizardData.alternatives]);

  // Radar data for style
  const radarData = useMemo(() => {
    const dimensions = [
      { key: 'Equity', value: wizardData.assetClasses.equities },
      { key: 'Fixed Inc', value: wizardData.assetClasses.bonds },
      { key: 'Hedging', value: wizardData.assetClasses.hedging },
      { key: 'Alts', value: wizardData.assetClasses.alternatives },
      { key: 'Cash', value: wizardData.assetClasses.cash },
    ];
    return dimensions;
  }, [wizardData]);

  return (
    <div className="space-y-6">
      {/* Full Analysis Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
          <Activity size={12} /> FULL PIPELINE ANALYSIS
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Portfolio Construction Report</h2>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Comprehensive breakdown of target allocation, expected returns, risk profile, and portfolio structure
        </p>
      </div>

      {/* Master KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Portfolio E(r)', value: `${portfolioER.toFixed(2)}%`, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Weighted σ', value: `${portfolioVol.toFixed(2)}%`, icon: Shield, color: 'text-rose-400' },
          { label: 'Sharpe Ratio', value: portfolioSharpe.toFixed(2), icon: Gauge, color: 'text-amber-400' },
          { label: 'Positions', value: `${positions.length}`, icon: Layers, color: 'text-primary' },
          { label: 'HHI', value: `${concentrationMetrics.hhi}`, icon: Target, color: concentrationMetrics.hhi > 2500 ? 'text-rose-400' : 'text-emerald-400' },
          { label: 'Allocation', value: `${totalAllocation.toFixed(1)}%`, icon: CheckCircle2, color: isBalanced ? 'text-emerald-400' : 'text-amber-400' },
        ].map((kpi, i) => (
          <Card key={i} className="border-border/30 bg-card/50">
            <CardContent className="py-3 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <kpi.icon className={cn("h-3 w-3", kpi.color)} />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              </div>
              <span className={cn("font-mono text-lg font-bold", kpi.color)}>{kpi.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Analysis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/20 p-1 h-9 w-full grid grid-cols-5">
          <TabsTrigger value="overview" className="text-[10px] sm:text-xs gap-1 data-[state=active]:bg-card">
            <Compass size={12} /> Overview
          </TabsTrigger>
          <TabsTrigger value="returns" className="text-[10px] sm:text-xs gap-1 data-[state=active]:bg-card">
            <TrendingUp size={12} /> Returns
          </TabsTrigger>
          <TabsTrigger value="structure" className="text-[10px] sm:text-xs gap-1 data-[state=active]:bg-card">
            <PieChart size={12} /> Structure
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-[10px] sm:text-xs gap-1 data-[state=active]:bg-card">
            <Shield size={12} /> Risk
          </TabsTrigger>
          <TabsTrigger value="detail" className="text-[10px] sm:text-xs gap-1 data-[state=active]:bg-card">
            <BarChart3 size={12} /> Detail
          </TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-4">
          {/* Strategy Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BloombergPanel title="Investment Profile" titleIcon={<Compass className="h-4 w-4 text-primary" />}>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Objective</span>
                  <Badge variant="outline" className="font-mono">{OBJECTIVE_LABELS[wizardData.objective]}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Horizon</span>
                  <Badge variant="outline" className="font-mono capitalize">{wizardData.horizon.replace('_', ' ')}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Risk Level</span>
                  <Badge variant="outline" className={cn("font-mono", 
                    wizardData.riskLevel === 'high' ? 'border-rose-500/30 text-rose-400' :
                    wizardData.riskLevel === 'low' ? 'border-emerald-500/30 text-emerald-400' :
                    'border-amber-500/30 text-amber-400'
                  )}>
                    {RISK_LABELS[wizardData.riskLevel]}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Liquidity Req.</span>
                  <Badge variant="outline" className="font-mono capitalize">{wizardData.constraints.liquidityRequirement}</Badge>
                </div>
                <Separator className="border-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Min Equities</span>
                  <span className="font-mono text-xs">{wizardData.constraints.minEquities}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Min Cash</span>
                  <span className="font-mono text-xs">{wizardData.constraints.minCash}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Min Hedge</span>
                  <span className="font-mono text-xs">{wizardData.constraints.minHedge}%</span>
                </div>
              </div>
            </BloombergPanel>

            {/* Style Radar */}
            <BloombergPanel title="Allocation Style" titleIcon={<Activity className="h-4 w-4 text-primary" />}>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <PolarAngleAxis dataKey="key" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar name="Target" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </BloombergPanel>

            {/* Concentration */}
            <BloombergPanel title="Concentration Metrics" titleIcon={<Target className="h-4 w-4 text-amber-400" />}>
              <div className="space-y-4">
                {[
                  { label: 'Total Positions', value: concentrationMetrics.count, color: 'text-primary' },
                  { label: 'Max Single Position', value: `${concentrationMetrics.maxPos.toFixed(1)}%`, color: concentrationMetrics.maxPos > 15 ? 'text-rose-400' : 'text-emerald-400' },
                  { label: 'Top 3 Concentration', value: `${concentrationMetrics.top3.toFixed(1)}%`, color: concentrationMetrics.top3 > 50 ? 'text-amber-400' : 'text-emerald-400' },
                  { label: 'Top 5 Concentration', value: `${concentrationMetrics.top5.toFixed(1)}%`, color: concentrationMetrics.top5 > 70 ? 'text-amber-400' : 'text-emerald-400' },
                  { label: 'HHI Index', value: concentrationMetrics.hhi, color: concentrationMetrics.hhi > 2500 ? 'text-rose-400' : concentrationMetrics.hhi > 1500 ? 'text-amber-400' : 'text-emerald-400' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={cn("font-mono font-bold text-sm", item.color)}>{item.value}</span>
                  </div>
                ))}
                <Separator className="border-border/30" />
                <div className="text-[10px] text-muted-foreground">
                  HHI {'<'} 1500: Diversified · 1500-2500: Moderate · {'>'} 2500: Concentrated
                </div>
              </div>
            </BloombergPanel>
          </div>

          {/* Positions Table */}
          <BloombergPanel title="Complete Position List" titleIcon={<Layers className="h-4 w-4 text-primary" />} contentClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-3 py-3 font-medium text-muted-foreground">Position</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Region</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Sector</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Currency</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Liquidity</th>
                    <th className="px-3 py-3 text-center font-medium text-primary">Weight %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {positions.sort((a, b) => b.allocation - a.allocation).map((pos, i) => (
                    <tr key={pos.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-3 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          {pos.name}
                          {'ticker' in pos && (pos as any).ticker && <span className="text-muted-foreground font-mono text-[10px]">({(pos as any).ticker})</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center"><Badge variant="outline" className="text-[10px]">{pos.assetType}</Badge></td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground">{pos.region}</td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground">{pos.sector || '—'}</td>
                      <td className="px-3 py-2.5 text-center font-mono">{pos.currency}</td>
                      <td className="px-3 py-2.5 text-center"><Badge variant="outline" className="text-[10px]">{pos.liquidityBucket || '—'}</Badge></td>
                      <td className="px-3 py-2.5 text-center"><span className="font-mono font-bold text-primary">{pos.allocation.toFixed(1)}%</span></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 bg-primary/5">
                    <td className="px-4 py-3 font-bold text-primary" colSpan={7}>Total</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("font-mono font-bold text-lg", isBalanced ? "text-emerald-400" : "text-amber-400")}>
                        {totalAllocation.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </BloombergPanel>
        </TabsContent>

        {/* ===== RETURNS TAB ===== */}
        <TabsContent value="returns" className="space-y-4">
          {erResults.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center">
                <TrendingUp className="mx-auto mb-3 text-muted-foreground" size={32} />
                <p className="text-sm text-muted-foreground">No Expected Return data — Phase 2 was skipped</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ER Results Table */}
              <BloombergPanel title="Expected Return per Asset Class" titleIcon={<TrendingUp className="h-4 w-4 text-emerald-400" />} contentClassName="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asset Class</th>
                        <th className="px-3 py-3 text-center font-medium text-emerald-400">E(r) %</th>
                        <th className="px-3 py-3 text-center font-medium text-rose-400">σ %</th>
                        <th className="px-3 py-3 text-center font-medium text-amber-400">Sharpe</th>
                        {SCENARIO_KEYS.map(key => (
                          <th key={key} className="px-3 py-3 text-center font-medium text-muted-foreground text-[10px]">
                            {SCENARIO_LABELS[key]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {erResults.map(r => (
                        <tr key={r.assetClass} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium">{r.assetClass}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-emerald-400">{r.expectedReturn.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-rose-400">{r.standardDeviation.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-amber-400">{r.sharpeRatio.toFixed(2)}</td>
                          {SCENARIO_KEYS.map(key => (
                            <td key={key} className="px-3 py-2.5 text-center font-mono">
                              <span className={cn(
                                r.scenarioReturns[key] > 0 ? 'text-emerald-400' : r.scenarioReturns[key] < 0 ? 'text-rose-400' : 'text-muted-foreground'
                              )}>
                                {r.scenarioReturns[key] > 0 ? '+' : ''}{r.scenarioReturns[key].toFixed(1)}%
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </BloombergPanel>

              {/* Scenario Bar Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BloombergPanel title="Return by Scenario" titleIcon={<BarChart3 className="h-4 w-4 text-primary" />}>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scenarioChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="scenario" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        {erResults.map((r, i) => (
                          <Bar key={r.assetClass} dataKey={r.assetClass} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[2, 2, 0, 0]} maxBarSize={20} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </BloombergPanel>

                {/* Risk-Return Scatter */}
                <BloombergPanel title="Risk–Return Profile" titleIcon={<Gauge className="h-4 w-4 text-amber-400" />}>
                  <div className="h-[280px] flex flex-col items-center justify-center gap-4">
                    {erResults.map((r, i) => (
                      <div key={r.assetClass} className="flex items-center gap-3 w-full px-4">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs flex-1">{r.assetClass}</span>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-emerald-400 w-16 text-right">E(r): {r.expectedReturn.toFixed(1)}%</span>
                          <span className="text-rose-400 w-14 text-right">σ: {r.standardDeviation.toFixed(1)}%</span>
                          <span className="text-amber-400 w-16 text-right">SR: {r.sharpeRatio.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <Separator className="border-border/30" />
                    <div className="flex items-center gap-3 w-full px-4">
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                      <span className="text-xs flex-1 font-bold text-primary">Portfolio</span>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-emerald-400 w-16 text-right font-bold">E(r): {portfolioER.toFixed(1)}%</span>
                        <span className="text-rose-400 w-14 text-right font-bold">σ: {portfolioVol.toFixed(1)}%</span>
                        <span className="text-amber-400 w-16 text-right font-bold">SR: {portfolioSharpe.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </BloombergPanel>
              </div>
            </>
          )}
        </TabsContent>

        {/* ===== STRUCTURE TAB ===== */}
        <TabsContent value="structure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Asset Type Pie */}
            <BloombergPanel title="By Asset Type" titleIcon={<PieChart className="h-4 w-4 text-primary" />}>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={assetTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value"
                      label={({ name, value }) => `${name} ${value.toFixed(0)}%`} labelLine={false}>
                      {assetTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </BloombergPanel>

            {/* Region Pie */}
            <BloombergPanel title="By Region" titleIcon={<Globe className="h-4 w-4 text-amber-400" />}>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={regionData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value"
                      label={({ name, value }) => `${name} ${value.toFixed(0)}%`} labelLine={false}>
                      {regionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </BloombergPanel>

            {/* Currency Pie */}
            <BloombergPanel title="By Currency" titleIcon={<DollarSign className="h-4 w-4 text-emerald-400" />}>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={currencyData} cx="50%" cy="50%" innerRadius={45} outerRadius={85} paddingAngle={2} dataKey="value"
                      label={({ name, value }) => `${name} ${value.toFixed(0)}%`} labelLine={false}>
                      {currencyData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </BloombergPanel>

            {/* Sector Bar */}
            <BloombergPanel title="By Sector" titleIcon={<Building2 className="h-4 w-4 text-primary" />}>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </BloombergPanel>
          </div>

          {/* Liquidity Distribution */}
          <BloombergPanel title="Liquidity Distribution" titleIcon={<Clock className="h-4 w-4 text-primary" />}>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={liquidityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="hsl(210, 80%, 55%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BloombergPanel>
        </TabsContent>

        {/* ===== RISK TAB ===== */}
        <TabsContent value="risk" className="space-y-4">
          {/* Target vs Actual - Asset Classes */}
          <BloombergPanel title="Target vs. Actual — Asset Classes" titleIcon={<Target className="h-4 w-4 text-primary" />} contentClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Asset Class</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Target %</th>
                    <th className="px-3 py-3 text-center font-medium text-primary">Actual %</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Deviation</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {targetVsActualData.map(row => (
                    <tr key={row.name} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">{row.target.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-center font-mono text-primary">{row.actual.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-center font-mono">
                        <span className={cn(
                          row.deviation > 0 ? 'text-emerald-400' : row.deviation < 0 ? 'text-rose-400' : 'text-muted-foreground'
                        )}>
                          {row.deviation > 0 ? '+' : ''}{row.deviation.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {Math.abs(row.deviation) < 2 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">On Target</Badge>
                        ) : Math.abs(row.deviation) < 5 ? (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Minor Drift</Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">Off Target</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BloombergPanel>

          {/* Target vs Actual - Geography */}
          <BloombergPanel title="Target vs. Actual — Geography" titleIcon={<Globe className="h-4 w-4 text-amber-400" />} contentClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Region</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Target %</th>
                    <th className="px-3 py-3 text-center font-medium text-primary">Actual %</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Deviation</th>
                    <th className="px-3 py-3 text-center font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {geoTargetVsActual.map(row => (
                    <tr key={row.name} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium">{row.name}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">{row.target.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-center font-mono text-primary">{row.actual.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-center font-mono">
                        <span className={cn(
                          row.deviation > 0 ? 'text-emerald-400' : row.deviation < 0 ? 'text-rose-400' : 'text-muted-foreground'
                        )}>
                          {row.deviation > 0 ? '+' : ''}{row.deviation.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {Math.abs(row.deviation) < 2 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">On Target</Badge>
                        ) : Math.abs(row.deviation) < 5 ? (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Minor Drift</Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">Off Target</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BloombergPanel>

          {/* Alternatives Breakdown */}
          {alternativesBreakdown.length > 0 && wizardData.assetClasses.alternatives > 0 && (
            <BloombergPanel title="Alternatives Breakdown" titleIcon={<Zap className="h-4 w-4 text-primary" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie data={alternativesBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`} labelLine={false}>
                        {alternativesBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 flex flex-col justify-center">
                  {wizardData.alternativeConfigs.map((cfg, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} />
                      <span className="flex-1">{cfg.label}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{cfg.strategy.replace('_', ' ')}</Badge>
                      <span className="font-mono text-muted-foreground">{cfg.geography.toUpperCase()}</span>
                      <span className="font-mono font-bold text-primary">{cfg.targetWeight}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </BloombergPanel>
          )}
        </TabsContent>

        {/* ===== DETAIL TAB ===== */}
        <TabsContent value="detail" className="space-y-4">
          {/* Implementation Buckets */}
          {wizardData.buckets.length > 0 && (
            <BloombergPanel title="Implementation Buckets" titleIcon={<Layers className="h-4 w-4 text-primary" />} contentClassName="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bucket</th>
                      <th className="px-3 py-3 text-center font-medium text-muted-foreground">Weight</th>
                      <th className="px-3 py-3 text-center font-medium text-muted-foreground">Implementation</th>
                      <th className="px-3 py-3 text-center font-medium text-muted-foreground">Benchmark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {wizardData.buckets.map(b => (
                      <tr key={b.key} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{b.label}</td>
                        <td className="px-3 py-2.5 text-center font-mono text-primary font-bold">{b.targetWeight}%</td>
                        <td className="px-3 py-2.5 text-center">
                          <Badge variant="outline" className="text-[10px] capitalize">{b.implementation.replace('_', ' ')}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">{b.benchmark || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </BloombergPanel>
          )}

          {/* Full Wizard Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BloombergPanel title="Target Asset Allocation" titleIcon={<PieChart className="h-4 w-4 text-primary" />}>
              <div className="space-y-3">
                {Object.entries(wizardData.assetClasses).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm capitalize flex-1">{key}</span>
                    <div className="w-32 h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
                    </div>
                    <span className="font-mono text-sm font-bold text-primary w-12 text-right">{value}%</span>
                  </div>
                ))}
              </div>
            </BloombergPanel>

            <BloombergPanel title="Target Geography" titleIcon={<Globe className="h-4 w-4 text-amber-400" />}>
              <div className="space-y-3">
                {Object.entries(wizardData.geography).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-sm capitalize flex-1">{key}</span>
                    <div className="w-32 h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${value}%` }} />
                    </div>
                    <span className="font-mono text-sm font-bold text-amber-400 w-12 text-right">{value}%</span>
                  </div>
                ))}
              </div>
            </BloombergPanel>
          </div>

          {/* Summary Footnote */}
          <Card className="border-border/30 bg-muted/10">
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Disclaimer</p>
                  <p>This analysis is for informational purposes only and does not constitute investment advice. 
                  Past performance and forward-looking estimates do not guarantee future results. 
                  All allocation decisions should be reviewed with qualified investment professionals.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
