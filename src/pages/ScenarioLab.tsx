import { useState, useMemo, useEffect } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Play, 
  Trash2, 
  Copy, 
  Filter, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  FileDown,
  Loader2,
  Cloud
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, PieChart as RechartsPie, Pie, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { 
  ScenarioDefinition, 
  ScenarioType, 
  ScenarioHorizon, 
  ScenarioShock,
  ScenarioShockTarget,
  ScenarioShockUnit,
  systemScenarios, 
  shockTargetMeta, 
  getScenarioTypeColor,
  getHorizonLabel 
} from '@/data/scenarios';
import { runScenario, ScenarioResult, formatCurrency, formatPctWithSign } from '@/lib/scenarioEngine';
import { generateScenarioPDFReport } from '@/lib/pdfReport';
import { cn } from '@/lib/utils';

const scenarioTypeLabels: Record<ScenarioType, string> = {
  historical: 'Historical',
  macroShock: 'Macro',
  equityCrash: 'Equity',
  ratesShock: 'Rates',
  fxShock: 'FX',
  custom: 'Custom'
};

// Database row type
interface DbScenario {
  id: string;
  user_id: string;
  name: string;
  type: string;
  description: string | null;
  horizon: string;
  shocks: ScenarioShock[];
  created_at: string;
  updated_at: string;
}

export default function ScenarioLab() {
  const { transactions, valuations } = usePortfolio();
  const { user } = useAuth();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [filterType, setFilterType] = useState<ScenarioType | 'all'>('all');
  const [customScenarios, setCustomScenarios] = useState<ScenarioDefinition[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for new scenario
  const [newScenario, setNewScenario] = useState<Partial<ScenarioDefinition>>({
    name: '',
    type: 'custom',
    description: '',
    horizon: '1m',
    shocks: []
  });
  const [newShock, setNewShock] = useState<Partial<ScenarioShock>>({
    target: 'global_equity',
    value: -10,
    unit: 'percent'
  });

  // Load custom scenarios from database
  useEffect(() => {
    if (!user) return;

    const loadScenarios = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('custom_scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading scenarios:', error);
        toast({ title: 'Error loading scenarios', variant: 'destructive' });
      } else if (data) {
        const scenarios: ScenarioDefinition[] = (data as unknown as DbScenario[]).map((row) => ({
          id: row.id,
          name: row.name,
          type: row.type as ScenarioType,
          description: row.description || undefined,
          horizon: row.horizon as ScenarioHorizon,
          shocks: (row.shocks || []).map((s: ScenarioShock) => ({
            ...s,
            unit: s.unit as ScenarioShockUnit
          })),
          isSystemPreset: false
        }));
        setCustomScenarios(scenarios);
      }
      setIsLoading(false);
    };

    loadScenarios();
  }, [user]);

  // All scenarios combined
  const allScenarios = useMemo(() => {
    return [...systemScenarios, ...customScenarios];
  }, [customScenarios]);

  // Filtered scenarios
  const filteredScenarios = useMemo(() => {
    if (filterType === 'all') return allScenarios;
    return allScenarios.filter(s => s.type === filterType);
  }, [allScenarios, filterType]);

  // Run selected scenario
  const handleRunScenario = () => {
    if (!selectedScenario) return;
    const scenarioResult = runScenario(selectedScenario, transactions, valuations);
    setResult(scenarioResult);
  };

  // Add shock to new scenario
  const handleAddShock = () => {
    if (!newShock.target || newShock.value === undefined) return;
    const shock: ScenarioShock = {
      id: `shock-${Date.now()}`,
      target: newShock.target as ScenarioShockTarget,
      label: shockTargetMeta[newShock.target as ScenarioShockTarget]?.label || newShock.target,
      value: newShock.value,
      unit: newShock.unit || 'percent'
    };
    setNewScenario(prev => ({
      ...prev,
      shocks: [...(prev.shocks || []), shock]
    }));
    setNewShock({ target: 'global_equity', value: -10, unit: 'percent' });
  };

  // Remove shock from new scenario
  const handleRemoveShock = (shockId: string) => {
    setNewScenario(prev => ({
      ...prev,
      shocks: (prev.shocks || []).filter(s => s.id !== shockId)
    }));
  };

  // Save new scenario to database
  const handleSaveScenario = async () => {
    if (!newScenario.name || !newScenario.shocks?.length || !user) return;
    
    setIsSaving(true);
    const { data, error } = await supabase
      .from('custom_scenarios')
      .insert({
        user_id: user.id,
        name: newScenario.name,
        type: newScenario.type || 'custom',
        description: newScenario.description || null,
        horizon: newScenario.horizon || '1m',
        shocks: newScenario.shocks as unknown as object
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error saving scenario:', error);
      toast({ title: 'Error saving scenario', variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    const row = data as unknown as DbScenario;
    const scenario: ScenarioDefinition = {
      id: row.id,
      name: row.name,
      type: row.type as ScenarioType,
      description: row.description || undefined,
      horizon: row.horizon as ScenarioHorizon,
      shocks: row.shocks as ScenarioShock[],
      isSystemPreset: false
    };

    setCustomScenarios(prev => [scenario, ...prev]);
    setNewScenario({ name: '', type: 'custom', description: '', horizon: '1m', shocks: [] });
    setIsCreating(false);
    setSelectedScenario(scenario);
    setIsSaving(false);
    toast({ title: 'Scenario saved to cloud' });
  };

  // Duplicate scenario
  const handleDuplicate = async (scenario: ScenarioDefinition) => {
    if (!user) return;

    setIsSaving(true);
    const { data, error } = await supabase
      .from('custom_scenarios')
      .insert({
        user_id: user.id,
        name: `${scenario.name} (Copy)`,
        type: scenario.type,
        description: scenario.description || null,
        horizon: scenario.horizon,
        shocks: scenario.shocks as unknown as object
      } as never)
      .select()
      .single();

    if (error) {
      console.error('Error duplicating scenario:', error);
      toast({ title: 'Error duplicating scenario', variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    const row = data as unknown as DbScenario;
    const duplicate: ScenarioDefinition = {
      id: row.id,
      name: row.name,
      type: row.type as ScenarioType,
      description: row.description || undefined,
      horizon: row.horizon as ScenarioHorizon,
      shocks: row.shocks as ScenarioShock[],
      isSystemPreset: false
    };

    setCustomScenarios(prev => [duplicate, ...prev]);
    setSelectedScenario(duplicate);
    setIsSaving(false);
    toast({ title: 'Scenario duplicated' });
  };

  // Delete custom scenario from database
  const handleDelete = async (scenarioId: string) => {
    const { error } = await supabase
      .from('custom_scenarios')
      .delete()
      .eq('id', scenarioId);

    if (error) {
      console.error('Error deleting scenario:', error);
      toast({ title: 'Error deleting scenario', variant: 'destructive' });
      return;
    }

    setCustomScenarios(prev => prev.filter(s => s.id !== scenarioId));
    if (selectedScenario?.id === scenarioId) {
      setSelectedScenario(null);
      setResult(null);
    }
    toast({ title: 'Scenario deleted' });
  };

  // Chart data for P&L by asset type
  const assetTypeChartData = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.summary.byAssetType).map(([type, data]) => ({
      name: type.replace(/_/g, ' ').toUpperCase(),
      pnl: data.pnlAbs,
      pnlPct: data.pnlPct
    })).sort((a, b) => a.pnl - b.pnl);
  }, [result]);

  // Pie chart data for geography breakdown
  const geographyPieData = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.summary.byGeography).map(([geo, data]) => ({
      name: geo.replace(/_/g, ' '),
      value: Math.abs(data.pnlAbs),
      pnl: data.pnlAbs,
      pnlPct: data.pnlPct
    }));
  }, [result]);

  const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-wide">SCENARIO LAB</h1>
          <p className="text-xs text-muted-foreground font-mono">STRESS TEST • SCENARIO ANALYSIS • RESEARCH DESK</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {allScenarios.length} SCENARIOS
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel - Scenario Library */}
        <div className="col-span-3">
          <Card className="h-[calc(100vh-180px)]">
            <CardHeader className="py-3 px-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">SCENARIO LIBRARY</CardTitle>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      NEW
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Custom Scenario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Scenario Name</Label>
                          <Input
                            value={newScenario.name || ''}
                            onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="My Custom Scenario"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={newScenario.type}
                            onValueChange={(v) => setNewScenario(prev => ({ ...prev, type: v as ScenarioType }))}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(scenarioTypeLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={newScenario.description || ''}
                          onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the scenario..."
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Horizon</Label>
                        <Select
                          value={newScenario.horizon}
                          onValueChange={(v) => setNewScenario(prev => ({ ...prev, horizon: v as ScenarioHorizon }))}
                        >
                          <SelectTrigger className="h-8 text-sm w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1d">1 Day</SelectItem>
                            <SelectItem value="1w">1 Week</SelectItem>
                            <SelectItem value="1m">1 Month</SelectItem>
                            <SelectItem value="6m">6 Months</SelectItem>
                            <SelectItem value="1y">1 Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Add Shocks */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold">ADD SHOCKS</Label>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Target</Label>
                            <Select
                              value={newShock.target}
                              onValueChange={(v) => setNewShock(prev => ({ ...prev, target: v as ScenarioShockTarget }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(shockTargetMeta).map(([key, meta]) => (
                                  <SelectItem key={key} value={key} className="text-xs">
                                    {meta.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24 space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Value</Label>
                            <Input
                              type="number"
                              value={newShock.value || ''}
                              onChange={(e) => setNewShock(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="w-20 space-y-1">
                            <Label className="text-[10px] text-muted-foreground">Unit</Label>
                            <Select
                              value={newShock.unit}
                              onValueChange={(v) => setNewShock(prev => ({ ...prev, unit: v as 'percent' | 'bps' }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percent">%</SelectItem>
                                <SelectItem value="bps">bps</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button size="sm" variant="secondary" onClick={handleAddShock} className="h-8">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Current Shocks */}
                        {(newScenario.shocks || []).length > 0 && (
                          <div className="space-y-2 mt-3">
                            {newScenario.shocks?.map(shock => (
                              <div key={shock.id} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded text-xs">
                                <span>{shock.label}: <span className={shock.value < 0 ? 'text-destructive' : 'text-positive'}>
                                  {shock.value > 0 ? '+' : ''}{shock.value}{shock.unit === 'bps' ? ' bps' : '%'}
                                </span></span>
                                <Button size="sm" variant="ghost" onClick={() => handleRemoveShock(shock.id)} className="h-6 w-6 p-0">
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSaveScenario} disabled={!newScenario.name || !newScenario.shocks?.length || isSaving}>
                          {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Create Scenario'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2 mt-3">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <Select value={filterType} onValueChange={(v) => setFilterType(v as ScenarioType | 'all')}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(scenarioTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <ScrollArea className="h-[calc(100%-120px)]">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredScenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario)}
                    className={cn(
                      "p-2 rounded cursor-pointer transition-colors border",
                      selectedScenario?.id === scenario.id 
                        ? "bg-primary/10 border-primary/50" 
                        : "bg-card hover:bg-muted/50 border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-mono uppercase", getScenarioTypeColor(scenario.type))}>
                            {scenarioTypeLabels[scenario.type]}
                          </span>
                          {scenario.isSystemPreset ? (
                            <Badge variant="outline" className="text-[8px] h-4 px-1">PRESET</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] h-4 px-1 border-primary/40 text-primary">
                              <Cloud className="h-2.5 w-2.5 mr-0.5" />SAVED
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-medium truncate mt-0.5">{scenario.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{getHorizonLabel(scenario.horizon)}</span>
                          <Zap className="h-2.5 w-2.5 text-muted-foreground ml-1" />
                          <span className="text-[10px] text-muted-foreground">{scenario.shocks.length} shocks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Center Panel - Scenario Details & Configuration */}
        <div className="col-span-5">
          <Card className="h-[calc(100vh-180px)]">
            <CardHeader className="py-3 px-4 border-b border-border">
              <CardTitle className="text-sm font-semibold">
                {selectedScenario ? selectedScenario.name : 'SELECT A SCENARIO'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {selectedScenario ? (
                <div className="space-y-4">
                  {/* Scenario Info */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 p-3 rounded">
                      <p className="text-[10px] text-muted-foreground uppercase">Type</p>
                      <p className={cn("text-sm font-medium", getScenarioTypeColor(selectedScenario.type))}>
                        {scenarioTypeLabels[selectedScenario.type]}
                      </p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <p className="text-[10px] text-muted-foreground uppercase">Horizon</p>
                      <p className="text-sm font-medium">{getHorizonLabel(selectedScenario.horizon)}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded">
                      <p className="text-[10px] text-muted-foreground uppercase">Shocks</p>
                      <p className="text-sm font-medium">{selectedScenario.shocks.length}</p>
                    </div>
                  </div>

                  {selectedScenario.description && (
                    <p className="text-xs text-muted-foreground">{selectedScenario.description}</p>
                  )}

                  {/* Shocks Table */}
                  <div>
                    <h4 className="text-xs font-semibold mb-2 uppercase text-muted-foreground">Shock Parameters</h4>
                    <Table>
                      <TableHeader>
                        <TableRow className="text-[10px]">
                          <TableHead className="h-8">Target</TableHead>
                          <TableHead className="h-8 text-right">Value</TableHead>
                          <TableHead className="h-8">Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedScenario.shocks.map(shock => (
                          <TableRow key={shock.id} className="text-xs">
                            <TableCell className="py-2 font-medium">{shock.label}</TableCell>
                            <TableCell className={cn(
                              "py-2 text-right font-mono",
                              shock.value < 0 ? "text-destructive" : "text-positive"
                            )}>
                              {shock.value > 0 ? '+' : ''}{shock.value}{shock.unit === 'bps' ? ' bps' : '%'}
                            </TableCell>
                            <TableCell className="py-2 text-muted-foreground">
                              {shockTargetMeta[shock.target]?.category || 'Other'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleRunScenario} className="flex-1">
                      <Play className="h-4 w-4 mr-2" />
                      Run Scenario
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleDuplicate(selectedScenario)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicate</TooltipContent>
                    </Tooltip>
                    {!selectedScenario.isSystemPreset && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(selectedScenario.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Select a scenario from the library</p>
                  <p className="text-xs mt-1">or create a new custom scenario</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="col-span-4">
          <Card className="h-[calc(100vh-180px)]">
            <CardHeader className="py-3 px-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">SCENARIO RESULTS</CardTitle>
                {result && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => generateScenarioPDFReport(result)}
                  >
                    <FileDown className="h-3 w-3 mr-1" />
                    EXPORT PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-52px)]">
              <CardContent className="p-4">
                {result ? (
                  <div className="space-y-4">
                    {/* Summary KPIs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 p-3 rounded">
                        <p className="text-[10px] text-muted-foreground uppercase">Portfolio Before</p>
                        <p className="text-lg font-mono font-bold">{formatCurrency(result.summary.totalBefore)}</p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded">
                        <p className="text-[10px] text-muted-foreground uppercase">Portfolio After</p>
                        <p className="text-lg font-mono font-bold">{formatCurrency(result.summary.totalAfter)}</p>
                      </div>
                    </div>

                    {/* P&L Display */}
                    <div className={cn(
                      "p-4 rounded-lg border-2 text-center",
                      result.summary.totalPnlAbs < 0 
                        ? "bg-destructive/10 border-destructive/30" 
                        : "bg-positive/10 border-positive/30"
                    )}>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        {result.summary.totalPnlAbs < 0 
                          ? <TrendingDown className="h-5 w-5 text-destructive" />
                          : <TrendingUp className="h-5 w-5 text-positive" />
                        }
                        <span className="text-xs uppercase text-muted-foreground">Scenario P&L</span>
                      </div>
                      <p className={cn(
                        "text-2xl font-mono font-bold",
                        result.summary.totalPnlAbs < 0 ? "text-destructive" : "text-positive"
                      )}>
                        {formatCurrency(result.summary.totalPnlAbs)}
                      </p>
                      <p className={cn(
                        "text-sm font-mono",
                        result.summary.totalPnlAbs < 0 ? "text-destructive" : "text-positive"
                      )}>
                        {formatPctWithSign(result.summary.totalPnlPct)}
                      </p>
                    </div>

                    {/* P&L by Asset Type Chart */}
                    {assetTypeChartData.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground">P&L by Asset Type</h4>
                        </div>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={assetTypeChartData} layout="vertical" margin={{ left: 60, right: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={55} />
                              <RechartsTooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                                formatter={(value: number) => [formatCurrency(value), 'P&L']}
                              />
                              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                                {assetTypeChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.pnl < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--positive))'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Geography Pie */}
                    {geographyPieData.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <PieChart className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Impact by Geography</h4>
                        </div>
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPie>
                              <Pie
                                data={geographyPieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={50}
                                paddingAngle={2}
                              >
                                {geographyPieData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
                                formatter={(_, name, props) => [formatPctWithSign(props.payload.pnlPct), name]}
                              />
                              <Legend 
                                wrapperStyle={{ fontSize: 10 }}
                                formatter={(value) => <span className="text-foreground capitalize">{value}</span>}
                              />
                            </RechartsPie>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Holdings Detail Table */}
                    <div>
                      <h4 className="text-xs font-semibold mb-2 uppercase text-muted-foreground">Impact by Holding</h4>
                      <div className="max-h-48 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="text-[10px]">
                              <TableHead className="h-7">Ticker</TableHead>
                              <TableHead className="h-7 text-right">Before</TableHead>
                              <TableHead className="h-7 text-right">P&L</TableHead>
                              <TableHead className="h-7 text-right">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.perHolding.slice(0, 10).map(h => (
                              <TableRow key={h.ticker} className="text-[11px]">
                                <TableCell className="py-1.5 font-mono">{h.ticker}</TableCell>
                                <TableCell className="py-1.5 text-right font-mono">{formatCurrency(h.valueBefore)}</TableCell>
                                <TableCell className={cn(
                                  "py-1.5 text-right font-mono",
                                  h.pnlAbs < 0 ? "text-destructive" : "text-positive"
                                )}>
                                  {formatCurrency(h.pnlAbs)}
                                </TableCell>
                                <TableCell className={cn(
                                  "py-1.5 text-right font-mono",
                                  h.pnlPct < 0 ? "text-destructive" : "text-positive"
                                )}>
                                  {formatPctWithSign(h.pnlPct)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground text-center font-mono">
                      Generated: {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                    <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">No results yet</p>
                    <p className="text-xs mt-1">Select and run a scenario</p>
                  </div>
                )}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
