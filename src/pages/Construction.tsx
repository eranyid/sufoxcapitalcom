import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConstructionWizard } from '@/components/construction/ConstructionWizard';
import { PipelineHeader } from '@/components/construction/pipeline/PipelineHeader';
import { ScenarioERStep } from '@/components/construction/pipeline/ScenarioERStep';
import { PipelineSummary } from '@/components/construction/pipeline/PipelineSummary';
import { ConstructionLanding, type ConstructionMode } from '@/components/construction/ConstructionLanding';
import type { PipelinePhase } from '@/types/constructionPipeline';
import type { AssetERResult } from '@/types/constructionPipeline';
import type { WizardData } from '@/types/construction';
import { DEFAULT_WIZARD_DATA } from '@/types/construction';
import type { Position } from '@/types/allocationBuilder';

// Inline Allocation Builder (simplified from the full page)
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Grid3X3, PieChart, GitBranch, BarChart3,
  Plus, Trash2, RotateCcw, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddPositionDialog } from '@/components/construction/allocation/AddPositionDialog';
import { PositionsTable } from '@/components/construction/allocation/PositionsTable';
import { AllocationDonutChart } from '@/components/construction/allocation/AllocationDonutChart';
import { ExposureBarChart } from '@/components/construction/allocation/ExposureBarChart';
import { AllocationTreemap } from '@/components/construction/allocation/AllocationTreemap';
import { AllocationSankey } from '@/components/construction/allocation/AllocationSankey';
import { PositionSizeHistogram } from '@/components/construction/allocation/PositionSizeHistogram';
import { StructuralInsightsPanel } from '@/components/construction/allocation/StructuralInsightsPanel';
import { StyleRadarChart } from '@/components/construction/allocation/StyleRadarChart';
import { GeographicAllocationMap } from '@/components/construction/allocation/GeographicAllocationMap';
import { LiquidityFunnelChart } from '@/components/construction/allocation/LiquidityFunnelChart';
import { CurrencySunburstChart } from '@/components/construction/allocation/CurrencySunburstChart';
import { TargetComparisonChart } from '@/components/construction/allocation/TargetComparisonChart';
import { calculateTotalAllocation } from '@/lib/allocationAnalytics';
import { toast } from 'sonner';

export default function Construction() {
  // Mode selection
  const [mode, setMode] = useState<ConstructionMode | null>(null);

  // Pipeline state
  const [currentPhase, setCurrentPhase] = useState<PipelinePhase>(1);
  const [phase1Complete, setPhase1Complete] = useState(false);
  const [phase2Complete, setPhase2Complete] = useState(false);
  const [phase3Complete, setPhase3Complete] = useState(false);
  
  // Data flow between phases
  const [wizardData, setWizardData] = useState<WizardData>(DEFAULT_WIZARD_DATA);
  const [erResults, setErResults] = useState<AssetERResult[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Phase 3 state
  const [activeTab, setActiveTab] = useState<string>('positions');
  const [groupBy, setGroupBy] = useState<'assetType' | 'region' | 'sector' | 'currency' | 'liquidityBucket'>('assetType');
  const isMobile = useIsMobile();
  const totalAllocation = useMemo(() => calculateTotalAllocation(positions), [positions]);
  const isBalanced = Math.abs(totalAllocation - 100) < 0.01;
  const isOver = totalAllocation > 100;

  // Asset classes from wizard for ER step
  const assetClassesForER = useMemo(() => {
    const labels: Record<string, string> = {
      equities: 'Equities',
      bonds: 'Fixed Income',
      hedging: 'Hedging',
      alternatives: 'Alternatives',
      cash: 'Cash',
    };
    return Object.entries(wizardData.assetClasses)
      .filter(([_, weight]) => weight > 0)
      .map(([key, weight]) => ({
        name: labels[key] || key,
        weight,
      }));
  }, [wizardData.assetClasses]);

  // Position handlers
  const handleAddPosition = (newPosition: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => {
    const position: Position = {
      ...newPosition,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPositions(prev => [...prev, position]);
    toast.success(`Added "${newPosition.name}" (${newPosition.allocation}%)`);
  };

  const handleUpdatePosition = (id: string, updates: Partial<Position>) => {
    setPositions(prev => prev.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ));
  };

  const handleDeletePosition = (id: string) => {
    const position = positions.find(p => p.id === id);
    setPositions(prev => prev.filter(p => p.id !== id));
    if (position) toast.success(`Removed "${position.name}"`);
  };

  // Landing page - no mode selected yet
  if (!mode) {
    return (
      <>
        <Helmet>
          <title>Portfolio Construction | SUFOX Capital</title>
        </Helmet>
        <ConstructionLanding onSelect={setMode} />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Portfolio Construction | SUFOX Capital</title>
        <meta name="description" content="Unified portfolio construction pipeline — Target Allocation, Expected Return Analysis, and Allocation Builder" />
      </Helmet>

      <div className="space-y-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-xs font-mono gap-1 h-7 px-2" onClick={() => setMode(null)}>
              ← Back
            </Button>
            <div className="h-4 w-px bg-border/40" />
            <h1 className="text-lg font-bold tracking-tight">Portfolio Construction</h1>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider hidden sm:block">
            TARGET → ER → ALLOCATION → REVIEW
          </span>
        </div>

        {/* Pipeline Phase Navigation */}
        <PipelineHeader
          currentPhase={currentPhase}
          onPhaseClick={setCurrentPhase}
          phase1Complete={phase1Complete}
          phase2Complete={phase2Complete}
          phase3Complete={phase3Complete}
        />

        {/* Phase Content */}
        <div className="relative min-h-[400px]">
          <div className="absolute -inset-4 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          
          {/* Phase 1: Target Allocation Wizard */}
          {currentPhase === 1 && (
            <div className="relative">
              <ConstructionWizardPhase1
                wizardData={wizardData}
                onWizardDataChange={setWizardData}
                onComplete={() => {
                  setPhase1Complete(true);
                  setCurrentPhase(2);
                }}
              />
            </div>
          )}

          {/* Phase 2: Scenario-Based Expected Return */}
          {currentPhase === 2 && (
            <div className="relative">
              <ScenarioERStep
                assetClasses={assetClassesForER}
                riskFreeRate={4.5}
                onResultsChange={setErResults}
                onComplete={() => {
                  setPhase2Complete(true);
                  setCurrentPhase(3);
                }}
              />
            </div>
          )}

          {/* Phase 3: Allocation Builder */}
          {currentPhase === 3 && (
            <div className="relative space-y-3">
              {/* Allocation Status Bar */}
              <div className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                isBalanced
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : isOver
                    ? "bg-destructive/5 border-destructive/20"
                    : "bg-amber-500/5 border-amber-500/20"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    isBalanced ? "bg-emerald-500/20" : isOver ? "bg-destructive/20" : "bg-amber-500/20"
                  )}>
                    {isBalanced ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className={isOver ? "text-destructive" : "text-amber-500"} />}
                  </div>
                  <div>
                    <span className={cn("font-mono text-xl font-bold", isBalanced ? "text-emerald-400" : isOver ? "text-destructive" : "text-amber-400")}>
                      {totalAllocation.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">{positions.length} positions</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AddPositionDialog onAdd={handleAddPosition} existingAllocation={totalAllocation} />
                  <Button
                    onClick={() => { setPhase3Complete(true); setCurrentPhase(4); }}
                    disabled={!isBalanced}
                    className="gap-2 font-mono"
                  >
                    FINALIZE →
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
                <TabsList className="bg-muted/20 p-1 h-9 w-full sm:w-fit grid grid-cols-4 sm:flex">
                  <TabsTrigger value="positions" className="gap-1 text-[10px] sm:text-xs h-7 px-2 sm:px-4 data-[state=active]:bg-card">
                    <Grid3X3 size={12} /> Positions
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-1 text-[10px] sm:text-xs h-7 px-2 sm:px-4 data-[state=active]:bg-card">
                    <PieChart size={12} /> Charts
                  </TabsTrigger>
                  <TabsTrigger value="flows" className="gap-1 text-[10px] sm:text-xs h-7 px-2 sm:px-4 data-[state=active]:bg-card">
                    <GitBranch size={12} /> Flows
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="gap-1 text-[10px] sm:text-xs h-7 px-2 sm:px-4 data-[state=active]:bg-card">
                    <BarChart3 size={12} /> Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="positions" className="space-y-4 mt-2">
                  {positions.length === 0 ? (
                    <Card className="border-dashed border-2 border-border/50">
                      <CardContent className="py-12 text-center">
                        <Layers className="mx-auto mb-4 text-muted-foreground" size={40} />
                        <h3 className="text-lg font-medium mb-2">No Positions Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add positions to build your target allocation
                        </p>
                        <AddPositionDialog onAdd={handleAddPosition} existingAllocation={totalAllocation} />
                      </CardContent>
                    </Card>
                  ) : (
                    <PositionsTable
                      positions={positions}
                      onUpdate={handleUpdatePosition}
                      onDelete={handleDeletePosition}
                    />
                  )}
                </TabsContent>

                <TabsContent value="charts" className="space-y-4 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">Group by:</span>
                    <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
                      <SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assetType">Asset Type</SelectItem>
                        <SelectItem value="region">Region</SelectItem>
                        <SelectItem value="sector">Sector</SelectItem>
                        <SelectItem value="currency">Currency</SelectItem>
                        <SelectItem value="liquidityBucket">Liquidity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AllocationDonutChart positions={positions} groupBy={groupBy} title={`By ${groupBy}`} />
                    <ExposureBarChart positions={positions} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AllocationTreemap positions={positions} />
                    <StyleRadarChart positions={positions} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CurrencySunburstChart positions={positions} />
                    <LiquidityFunnelChart positions={positions} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PositionSizeHistogram positions={positions} />
                    <TargetComparisonChart positions={positions} />
                  </div>
                </TabsContent>

                <TabsContent value="flows" className="space-y-4 mt-2">
                  <AllocationSankey positions={positions} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AllocationDonutChart positions={positions} groupBy="assetType" title="By Asset Type" />
                    <AllocationDonutChart positions={positions} groupBy="sector" title="By Sector" />
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="mt-2">
                  <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                      <GeographicAllocationMap positions={positions} />
                      <TargetComparisonChart positions={positions} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CurrencySunburstChart positions={positions} />
                        <LiquidityFunnelChart positions={positions} />
                      </div>
                    </div>
                    <div>
                      <StructuralInsightsPanel positions={positions} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Phase 4: Summary & Export */}
          {currentPhase === 4 && (
            <div className="relative">
              <PipelineSummary
                wizardData={wizardData}
                erResults={erResults}
                positions={positions}
                saveToPolicy={mode === 'system'}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============= Phase 1 Wrapper =============

function ConstructionWizardPhase1({
  wizardData,
  onWizardDataChange,
  onComplete,
}: {
  wizardData: WizardData;
  onWizardDataChange: (data: WizardData) => void;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-4">
      <ConstructionWizard
        initialData={wizardData}
        onDataChange={onWizardDataChange}
        onSaveComplete={onComplete}
      />
    </div>
  );
}
