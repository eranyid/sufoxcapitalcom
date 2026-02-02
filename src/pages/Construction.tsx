import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, BarChart3, PieChart, Grid3X3, GitBranch, AlertTriangle, Download, Trash2 } from 'lucide-react';
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

export default function Construction() {
  const [positions, setPositions] = useState<Position[]>(SAMPLE_POSITIONS);
  const [activeTab, setActiveTab] = useState<string>('positions');
  const [groupBy, setGroupBy] = useState<'assetType' | 'region' | 'sector' | 'currency' | 'liquidityBucket'>('assetType');

  const totalAllocation = useMemo(() => calculateTotalAllocation(positions), [positions]);

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
    <div className="p-4 md:p-6 space-y-4 min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-xl" />
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
              <Layers className="text-primary" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Portfolio Construction</h1>
            <p className="text-xs text-muted-foreground font-mono">
              ALLOCATION-ONLY BUILDER • NO MARKET DATA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleLoadSample}>
            Load Sample
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearAll} className="text-destructive">
            <Trash2 size={14} className="mr-1" />
            Clear All
          </Button>
          <AddPositionDialog 
            onAdd={handleAddPosition} 
            existingAllocation={totalAllocation}
          />
        </div>
      </div>

      {/* Allocation Validation Bar */}
      <AllocationValidation positions={positions} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/30 p-1">
          <TabsTrigger value="positions" className="gap-2 text-xs">
            <Grid3X3 size={14} />
            Positions
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2 text-xs">
            <PieChart size={14} />
            Charts
          </TabsTrigger>
          <TabsTrigger value="flows" className="gap-2 text-xs">
            <GitBranch size={14} />
            Flows
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2 text-xs">
            <BarChart3 size={14} />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Positions Tab */}
        <TabsContent value="positions" className="space-y-4">
          <PositionsTable 
            positions={positions}
            onUpdate={handleUpdatePosition}
            onDelete={handleDeletePosition}
          />
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Group by:</span>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
              <SelectTrigger className="w-40 h-8 text-xs">
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
        <TabsContent value="flows" className="space-y-4">
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
        <TabsContent value="insights">
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

      {/* Footer */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-[10px] font-mono text-muted-foreground/50">
          SUFOX CAPITAL • ALLOCATION-ONLY PORTFOLIO BUILDER v1.0 • NO MARKET DATA
        </p>
      </div>
    </div>
  );
}
