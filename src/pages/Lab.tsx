import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Play, 
  Save, 
  FolderOpen,
  Trash2,
  FlaskConical,
  Plus,
  Database,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AnalyticsBlock, 
  AnalyticsPipeline,
  AnalyticsBlockType,
  ANALYTICS_BLOCK_LIBRARY,
  QUICK_PRESETS,
} from '@/types/analyticsLab';
import { 
  executePipeline, 
  validatePipeline,
  savePipeline,
  loadSavedPipelines,
  deletePipeline,
  getAvailableAssets,
  ValuationData,
} from '@/lib/analyticsEngine';
import { usePortfolio } from '@/context/PortfolioContext';
import { LabBlockLibrary } from '@/components/lab/LabBlockLibrary';
import { LabCanvas } from '@/components/lab/LabCanvas';
import { LabInspector } from '@/components/lab/LabInspector';
import { LabResultPanel } from '@/components/lab/LabResultPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Lab() {
  // Get real portfolio data
  const { valuations, transactions } = usePortfolio();
  
  // Convert to analytics engine format
  const valuationData: ValuationData[] = useMemo(() => 
    valuations.map(v => ({
      ticker: v.ticker,
      assetName: v.assetName,
      month: v.month,
      pricePerUnit: v.pricePerUnit,
      fxRate: v.fxRate,
    })), [valuations]
  );
  
  // Convert transactions to analytics engine format
  const transactionData = useMemo(() => 
    transactions.map(t => ({
      ticker: t.ticker,
      assetName: t.assetName,
      date: t.date,
      pricePerUnit: t.pricePerUnit,
      quantity: t.quantity,
      transactionType: t.transactionType as 'buy' | 'sell',
      costBase: t.costBase,
      costLocal: t.costLocal,
      currency: t.currency,
      fees: t.fees,
    })), [transactions]
  );
  
  // Get available assets from real data (valuations + transactions)
  const availableAssets = useMemo(() => getAvailableAssets(valuationData, transactionData), [valuationData, transactionData]);
  
  const [blocks, setBlocks] = useState<AnalyticsBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [pipelineName, setPipelineName] = useState('Untitled Pipeline');
  const [pipelineId, setPipelineId] = useState<string>(() => crypto.randomUUID());
  const [result, setResult] = useState<ReturnType<typeof executePipeline> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [savedPipelines, setSavedPipelines] = useState<AnalyticsPipeline[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  // Load saved pipelines on mount
  useEffect(() => {
    setSavedPipelines(loadSavedPipelines());
  }, []);

  const generateBlockId = () => crypto.randomUUID();

  const handleAddBlock = useCallback((type: AnalyticsBlockType) => {
    const blockMeta = ANALYTICS_BLOCK_LIBRARY.find(b => b.type === type);
    if (!blockMeta) return;

    const newBlock: AnalyticsBlock = {
      id: generateBlockId(),
      type,
      config: { ...blockMeta.defaultConfig },
      position: blocks.length,
    };

    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast.success(`Added ${blockMeta.label} block`);
  }, [blocks.length]);

  const handleLoadPreset = useCallback((presetId: string) => {
    const preset = QUICK_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const newBlocks: AnalyticsBlock[] = preset.blocks.map((block, i) => ({
      id: generateBlockId(),
      type: block.type,
      config: { ...block.config },
      position: block.position,
    }));

    setBlocks(newBlocks);
    setPipelineName(preset.name);
    setPipelineId(crypto.randomUUID());
    setSelectedBlockId(null);
    setResult(null);
    toast.success(`Loaded "${preset.name}" preset`);
  }, []);

  const handleRemoveBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const filtered = prev.filter(b => b.id !== blockId);
      // Recompute positions
      return filtered.map((block, i) => ({ ...block, position: i }));
    });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const handleMoveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      return newBlocks.map((block, i) => ({ ...block, position: i }));
    });
  }, []);

  const handleUpdateBlock = useCallback((blockId: string, config: any) => {
    setBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, config } 
          : block
      )
    );
  }, []);

  const handleRun = useCallback(async () => {
    const validation = validatePipeline(blocks);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    setIsRunning(true);
    setResult(null);

    // Simulate async execution
    await new Promise(resolve => setTimeout(resolve, 500));

    const pipeline: AnalyticsPipeline = {
      id: pipelineId,
      name: pipelineName,
      blocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Execute with real data (valuations + transactions)
    const executionResult = executePipeline(pipeline, {
      valuations: valuationData,
      transactions: transactionData,
    });
    setResult(executionResult);
    setIsRunning(false);

    if (executionResult.success) {
      toast.success('Pipeline executed successfully');
    } else {
      toast.error(executionResult.error || 'Execution failed');
    }
  }, [blocks, pipelineId, pipelineName, valuationData, transactionData]);

  const handleSave = useCallback(() => {
    if (blocks.length === 0) {
      toast.error('Cannot save empty pipeline');
      return;
    }

    const pipeline: AnalyticsPipeline = {
      id: pipelineId,
      name: pipelineName,
      blocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    savePipeline(pipeline);
    setSavedPipelines(loadSavedPipelines());
    toast.success('Pipeline saved');
  }, [blocks, pipelineId, pipelineName]);

  const handleLoad = useCallback((pipeline: AnalyticsPipeline) => {
    setBlocks(pipeline.blocks);
    setPipelineName(pipeline.name);
    setPipelineId(pipeline.id);
    setSelectedBlockId(null);
    setResult(null);
    setLoadDialogOpen(false);
    toast.success(`Loaded "${pipeline.name}"`);
  }, []);

  const handleDeleteSaved = useCallback((pipelineId: string) => {
    deletePipeline(pipelineId);
    setSavedPipelines(loadSavedPipelines());
    toast.success('Pipeline deleted');
  }, []);

  const handleClear = useCallback(() => {
    setBlocks([]);
    setPipelineName('Untitled Pipeline');
    setPipelineId(crypto.randomUUID());
    setSelectedBlockId(null);
    setResult(null);
  }, []);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  return (
    <>
      <Helmet>
        <title>Analytics Lab | SUFOX Capital</title>
      </Helmet>

      <div className="h-[calc(100vh-64px)] flex flex-col bg-background">
        {/* Toolbar */}
        <div className="border-b border-border bg-card/50 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <Input
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="h-8 w-48 text-sm font-medium bg-transparent border-none focus-visible:ring-1"
                placeholder="Pipeline name..."
              />
            </div>
            {/* Data source indicator */}
            <Badge 
              variant={availableAssets.length > 0 ? "default" : "secondary"} 
              className="text-[10px] gap-1"
            >
              <Database className="h-3 w-3" />
              {availableAssets.length > 0 
                ? `${availableAssets.length} assets • ${transactions.length} txns`
                : 'No data'
              }
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                  Load
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Pipeline</DialogTitle>
                  <DialogDescription>
                    Select a saved pipeline to load
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {savedPipelines.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No saved pipelines yet
                    </p>
                  ) : (
                    savedPipelines.map((pipeline) => (
                      <div 
                        key={pipeline.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => handleLoad(pipeline)}
                          className="flex-1 text-left"
                        >
                          <div className="text-sm font-medium">{pipeline.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pipeline.blocks.length} blocks • Updated {new Date(pipeline.updatedAt).toLocaleDateString()}
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSaved(pipeline.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" className="h-8" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleClear}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Pipeline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              size="sm" 
              className="h-8"
              onClick={handleRun}
              disabled={blocks.length === 0 || isRunning}
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Run
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Block Library */}
          <div className="w-56 shrink-0">
            <LabBlockLibrary 
              onAddBlock={handleAddBlock}
              onLoadPreset={handleLoadPreset}
            />
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-hidden">
              <LabCanvas
                blocks={blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onRemoveBlock={handleRemoveBlock}
                onMoveBlock={handleMoveBlock}
              />
            </div>

            {/* Bottom - Results */}
            <LabResultPanel 
              result={result}
              isRunning={isRunning}
            />
          </div>

          {/* Right Panel - Inspector */}
          <div className="w-64 shrink-0">
            <LabInspector
              selectedBlock={selectedBlock}
              onUpdateBlock={handleUpdateBlock}
              availableAssets={availableAssets}
            />
          </div>
        </div>
      </div>
    </>
  );
}
