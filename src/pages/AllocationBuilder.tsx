import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Layers, BarChart3, PieChart, Grid3X3, GitBranch, 
  ArrowLeft, Plus, Trash2, RotateCcw, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { Position } from '@/types/allocationBuilder';
import { AddPositionDialog } from '@/components/construction/allocation/AddPositionDialog';
import { PositionsTable } from '@/components/construction/allocation/PositionsTable';
import { AllocationValidation } from '@/components/construction/allocation/AllocationValidation';
import { AllocationDonutChart } from '@/components/construction/allocation/AllocationDonutChart';
import { ExposureBarChart } from '@/components/construction/allocation/ExposureBarChart';
import { AllocationTreemap } from '@/components/construction/allocation/AllocationTreemap';
import { AllocationSankey } from '@/components/construction/allocation/AllocationSankey';
import { PositionSizeHistogram } from '@/components/construction/allocation/PositionSizeHistogram';
import { StructuralInsightsPanel } from '@/components/construction/allocation/StructuralInsightsPanel';
import { calculateTotalAllocation } from '@/lib/allocationAnalytics';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Sample data for demo
const SAMPLE_POSITIONS: Position[] = [
  { id: '1', name: 'S&P 500 ETF', assetType: 'equity', allocation: 25, region: 'north_america', country: 'United States', sector: 'Multi-Sector', industry: 'Index', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['growth'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'US Treasury Bonds', assetType: 'fixed_income', allocation: 15, region: 'north_america', country: 'United States', sector: 'Government', industry: 'Treasuries', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['defensive', 'income'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'European Equity Fund', assetType: 'equity', allocation: 12, region: 'europe', country: 'Germany', sector: 'Multi-Sector', industry: 'Index', currency: 'EUR', liquidityBucket: 'liquid', styleTags: ['value'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', name: 'Real Estate REIT', assetType: 'real_estate', allocation: 10, region: 'north_america', country: 'United States', sector: 'Real Estate', industry: 'REITs', currency: 'USD', liquidityBucket: 'liquid', styleTags: ['income'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', name: 'Gold ETF', assetType: 'commodities', allocation: 5, region: 'global', country: 'Global/Multi-Country', sector: 'Materials', industry: 'Precious Metals', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['defensive'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '6', name: 'Private Equity Fund', assetType: 'alternatives', allocation: 8, region: 'north_america', country: 'United States', sector: 'Financials', industry: 'PE', currency: 'USD', liquidityBucket: 'locked', styleTags: ['growth'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '7', name: 'Japan Equity', assetType: 'equity', allocation: 8, region: 'asia_pacific', country: 'Japan', sector: 'Technology', industry: 'Semiconductors', currency: 'JPY', liquidityBucket: 'liquid', styleTags: ['growth', 'value'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', name: 'Israel Bonds', assetType: 'fixed_income', allocation: 7, region: 'middle_east', country: 'Israel', sector: 'Government', industry: 'Sovereign', currency: 'ILS', liquidityBucket: 'liquid', styleTags: ['income'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '9', name: 'Cash Reserve', assetType: 'cash', allocation: 5, region: 'north_america', country: 'United States', sector: 'Financials', industry: 'Money Market', currency: 'USD', liquidityBucket: 'highly_liquid', styleTags: ['defensive'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '10', name: 'EM Equity', assetType: 'equity', allocation: 5, region: 'asia_pacific', country: 'China', sector: 'Multi-Sector', industry: 'Index', currency: 'USD', liquidityBucket: 'liquid', styleTags: ['growth', 'speculative'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function AllocationBuilder() {
  const [positions, setPositions] = useState<Position[]>(SAMPLE_POSITIONS);
  const [activeTab, setActiveTab] = useState<string>('positions');
  const [groupBy, setGroupBy] = useState<'assetType' | 'region' | 'sector' | 'currency' | 'liquidityBucket'>('assetType');

  const totalAllocation = useMemo(() => calculateTotalAllocation(positions), [positions]);
  const isBalanced = Math.abs(totalAllocation - 100) < 0.01;
  const isOver = totalAllocation > 100;

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
    if (position) {
      toast.success(`Removed "${position.name}"`);
    }
  };

  const handleClearAll = () => {
    setPositions([]);
    toast.success('All positions cleared');
  };

  const handleLoadSample = () => {
    setPositions(SAMPLE_POSITIONS);
    toast.success('Sample portfolio loaded');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/construction" 
            className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <ArrowLeft size={18} className="text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Layers className="text-primary" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Portfolio Construction</h1>
              <p className="text-xs text-muted-foreground font-mono">
                ALLOCATION-ONLY BUILDER • NO MARKET DATA
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLoadSample}
            className="h-8 text-xs"
          >
            <RotateCcw size={14} className="mr-1.5" />
            Load Sample
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAll} 
            className="h-8 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 size={14} className="mr-1.5" />
            Clear All
          </Button>
          <AddPositionDialog 
            onAdd={handleAddPosition} 
            existingAllocation={totalAllocation}
          />
        </div>
      </div>

      {/* Allocation Summary Bar */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <CheckCircle2 size={20} className="text-emerald-500" />
              ) : (
                <AlertTriangle size={20} className={isOver ? "text-destructive" : "text-amber-500"} />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Total Allocation</span>
                  <span className={cn(
                    "font-mono font-semibold px-2 py-0.5 rounded text-sm",
                    isBalanced ? "bg-emerald-500/20 text-emerald-400" :
                    isOver ? "bg-destructive/20 text-destructive" : 
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {totalAllocation.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {positions.length} positions • {isBalanced ? 'Balanced' : isOver ? 'Over-allocated' : 'Under-allocated'}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3 flex-1 max-w-md ml-8">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    isBalanced ? "bg-emerald-500" :
                    isOver ? "bg-destructive" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono w-8">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/30 p-1 h-9">
          <TabsTrigger value="positions" className="gap-1.5 text-xs h-7 px-3">
            <Grid3X3 size={14} />
            Positions
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-1.5 text-xs h-7 px-3">
            <PieChart size={14} />
            Charts
          </TabsTrigger>
          <TabsTrigger value="flows" className="gap-1.5 text-xs h-7 px-3">
            <GitBranch size={14} />
            Flows
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5 text-xs h-7 px-3">
            <BarChart3 size={14} />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4 mt-2">
          {positions.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="py-12 text-center">
                <Layers className="mx-auto mb-4 text-muted-foreground" size={40} />
                <h3 className="text-lg font-medium mb-2">No Positions Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start building your portfolio by adding positions or load sample data
                </p>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleLoadSample}>
                    Load Sample Portfolio
                  </Button>
                  <AddPositionDialog 
                    onAdd={handleAddPosition} 
                    existingAllocation={totalAllocation}
                  />
                </div>
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

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4 mt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Group by:</span>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
              <SelectTrigger className="w-36 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assetType">Asset Type</SelectItem>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="sector">Sector</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="liquidityBucket">Liquidity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AllocationDonutChart 
              positions={positions} 
              groupBy={groupBy}
              title={`By ${groupBy === 'assetType' ? 'Asset Type' : 
                        groupBy === 'region' ? 'Region' : 
                        groupBy === 'liquidityBucket' ? 'Liquidity' : 
                        groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`}
            />
            <ExposureBarChart positions={positions} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AllocationTreemap positions={positions} />
            <PositionSizeHistogram positions={positions} />
          </div>
        </TabsContent>

        {/* Flows Tab */}
        <TabsContent value="flows" className="space-y-4 mt-2">
          <AllocationSankey positions={positions} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AllocationDonutChart 
              positions={positions} 
              groupBy="assetType"
              title="By Asset Type"
            />
            <AllocationDonutChart 
              positions={positions} 
              groupBy="sector"
              title="By Sector"
            />
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="mt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AllocationDonutChart 
                  positions={positions} 
                  groupBy="region"
                  title="Geographic Distribution"
                />
                <AllocationDonutChart 
                  positions={positions} 
                  groupBy="liquidityBucket"
                  title="Liquidity Distribution"
                />
              </div>
              <ExposureBarChart positions={positions} maxBars={15} />
            </div>
            <div>
              <StructuralInsightsPanel positions={positions} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
