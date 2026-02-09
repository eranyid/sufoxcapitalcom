import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Play, 
  Save, 
  FolderOpen,
  Trash2,
  Plus,
  Database,
  AlertCircle,
  Undo2,
  Redo2,
  Blocks,
  Settings2,
  ChevronDown,
  X,
} from 'lucide-react';
import { LabIcon } from '@/components/icons/LabIcon';
import { ChartsIcon } from '@/components/icons/ChartsIcon';
import { ResearchIcon } from '@/components/icons/ResearchIcon';
import { ChartBuilderView } from '@/components/lab/ChartBuilderView';
import { RebalanceTool } from '@/components/dashboard/RebalanceTool';
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
  validatePipeline as validatePipelineSimple,
  savePipeline,
  loadSavedPipelines,
  deletePipeline,
  getAvailableAssets,
  ValuationData,
} from '@/lib/analyticsEngine';
import { 
  validatePipeline as validatePipelineDetailed,
  ValidationError,
} from '@/lib/pipelineValidation';
import { usePortfolio } from '@/context/PortfolioContext';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useIsMobile } from '@/hooks/use-mobile';
import { LabBlockLibrary, LIBRARY_ICON_MAP } from '@/components/lab/LabBlockLibrary';
import { LabCanvas } from '@/components/lab/LabCanvas';
import { LabInspector } from '@/components/lab/LabInspector';
import { LabResultPanel } from '@/components/lab/LabResultPanel';
import { DragOverlayBlock } from '@/components/lab/DraggableLibraryBlock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
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
  
  // Use undo/redo hook for blocks
  const {
    state: blocks,
    setState: setBlocks,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetBlocks,
  } = useUndoRedo<AnalyticsBlock[]>([]);
  
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [pipelineName, setPipelineName] = useState('Untitled Pipeline');
  const [pipelineId, setPipelineId] = useState<string>(() => crypto.randomUUID());
  const [result, setResult] = useState<ReturnType<typeof executePipeline> | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [savedPipelines, setSavedPipelines] = useState<AnalyticsPipeline[]>([]);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [activeDragBlockType, setActiveDragBlockType] = useState<AnalyticsBlockType | null>(null);
  const [activeDragBlockId, setActiveDragBlockId] = useState<string | null>(null);
  const [isOverCanvas, setIsOverCanvas] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);
  const [labMode, setLabMode] = useState<'landing' | 'pipeline' | 'chart' | 'research' | 'rebalance'>('landing');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // Compute validation errors whenever blocks change
  useEffect(() => {
    const errors = validatePipelineDetailed(blocks);
    setValidationErrors(errors);
  }, [blocks]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) {
            redo();
            toast.success('Redo');
          }
        } else {
          if (canUndo) {
            undo();
            toast.success('Undo');
          }
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) {
          redo();
          toast.success('Redo');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Sensors for DnD - support both pointer and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDuplicateBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const blockToDuplicate = prev.find(b => b.id === blockId);
      if (!blockToDuplicate) return prev;
      
      const blockIndex = prev.findIndex(b => b.id === blockId);
      const newBlock: AnalyticsBlock = {
        ...blockToDuplicate,
        id: generateBlockId(),
        config: { ...blockToDuplicate.config },
        position: blockIndex + 1,
      };
      
      // Insert after the original and recompute positions
      const newBlocks = [...prev];
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      return newBlocks.map((block, i) => ({ ...block, position: i }));
    });
    toast.success('Block duplicated');
  }, []);

  const handleReorderBlocks = useCallback((activeId: string, overId: string) => {
    setBlocks(prev => {
      const oldIndex = prev.findIndex(b => b.id === activeId);
      const newIndex = prev.findIndex(b => b.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      // Create new array with swapped positions
      const newBlocks = [...prev];
      const [removed] = newBlocks.splice(oldIndex, 1);
      newBlocks.splice(newIndex, 0, removed);
      
      // Update positions
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
    // Use detailed validation and check for errors
    const errors = validatePipelineDetailed(blocks);
    const hasErrors = errors.some(e => e.severity === 'error');
    
    if (hasErrors) {
      const firstError = errors.find(e => e.severity === 'error');
      toast.error(firstError?.message || 'Pipeline has validation errors');
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
    resetBlocks([]);
    setPipelineName('Untitled Pipeline');
    setPipelineId(crypto.randomUUID());
    setSelectedBlockId(null);
    setResult(null);
  }, [resetBlocks]);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    
    if (data?.type === 'library-block') {
      setActiveDragBlockType(data.blockType);
      setActiveDragBlockId(null);
    } else {
      // It's a pipeline block being reordered
      setActiveDragBlockId(active.id as string);
      setActiveDragBlockType(null);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setIsOverCanvas(over?.id === 'canvas-drop-zone');
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    const data = active.data.current;
    
    // Check if it's a library block dropped on canvas
    if (data?.type === 'library-block' && over?.id === 'canvas-drop-zone') {
      handleAddBlock(data.blockType);
    } 
    // Check if it's a reordering operation (pipeline block dropped on another)
    else if (activeDragBlockId && over && active.id !== over.id) {
      // Handle reordering
      handleReorderBlocks(active.id as string, over.id as string);
    }
    
    setActiveDragBlockType(null);
    setActiveDragBlockId(null);
    setIsOverCanvas(false);
  }, [handleAddBlock, handleReorderBlocks, activeDragBlockId]);

  const handleDragCancel = useCallback(() => {
    setActiveDragBlockType(null);
    setActiveDragBlockId(null);
    setIsOverCanvas(false);
  }, []);

  // Get the active block meta for overlay
  const activeDragBlock = activeDragBlockType 
    ? ANALYTICS_BLOCK_LIBRARY.find(b => b.type === activeDragBlockType)
    : null;
  const ActiveIcon = activeDragBlock ? (LIBRARY_ICON_MAP[activeDragBlock.icon] || Database) : Database;
  
  // Get the dragged pipeline block for overlay
  const activePipelineBlock = activeDragBlockId 
    ? blocks.find(b => b.id === activeDragBlockId) 
    : null;
  const activePipelineBlockMeta = activePipelineBlock 
    ? ANALYTICS_BLOCK_LIBRARY.find(b => b.type === activePipelineBlock.type)
    : null;

  return (
    <>
      <Helmet>
        <title>Analytics Lab | SUFOX Capital</title>
      </Helmet>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex flex-col bg-background">
          {/* Toolbar - hidden on landing */}
          {labMode !== 'landing' && (
          <div className="border-b border-border bg-card px-2 sm:px-4 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Back to landing + Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setLabMode('landing')}
              >
                ← Lab
              </Button>
              <div className="flex items-center bg-muted rounded-md p-0.5 gap-0.5">
                <button
                  onClick={() => setLabMode('pipeline')}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                    labMode === 'pipeline'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LabIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Pipeline</span>
                </button>
                <button
                  onClick={() => setLabMode('chart')}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                    labMode === 'chart'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ChartsIcon size={14} />
                  <span className="hidden sm:inline">Chart</span>
                </button>
              </div>

              {labMode === 'pipeline' && (
              <>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Input
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  className="h-7 sm:h-8 w-24 sm:w-48 text-xs sm:text-sm font-medium bg-transparent border-none focus-visible:ring-1"
                  placeholder="Pipeline..."
                />
              </div>
              <Badge 
                variant={availableAssets.length > 0 ? "default" : "secondary"} 
                className="text-[9px] sm:text-[10px] gap-1 hidden sm:flex"
              >
                <Database className="h-3 w-3" />
                {availableAssets.length > 0 
                  ? `${availableAssets.length} assets • ${transactions.length} txns`
                  : 'No data'
                }
              </Badge>
              </>
              )}
            </div>

            {labMode === 'pipeline' && (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Undo/Redo buttons */}
              <div className="flex items-center border-r border-border pr-1 sm:pr-2 mr-0.5 sm:mr-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={() => { undo(); toast.success('Undo'); }}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={() => { redo(); toast.success('Redo'); }}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
              
              {isMobile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 px-2">
                      <FolderOpen className="h-3.5 w-3.5" />
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setLoadDialogOpen(true)}>
                      <FolderOpen className="h-3.5 w-3.5 mr-2" />
                      Load
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSave}>
                      <Save className="h-3.5 w-3.5 mr-2" />
                      Save
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleClear}
                      disabled={blocks.length === 0 && !result}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Clear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
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

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-muted-foreground hover:text-destructive hover:border-destructive/50" 
                    onClick={handleClear}
                    disabled={blocks.length === 0 && !result}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Clear
                  </Button>
                </>
              )}

              {/* Run button with validation indicator */}
              <div className="flex items-center gap-1 sm:gap-2">
                {validationErrors.length > 0 && !isMobile && (
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium",
                    validationErrors.some(e => e.severity === 'error')
                      ? "bg-destructive/10 text-destructive"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.filter(e => e.severity === 'error').length > 0 
                      ? `${validationErrors.filter(e => e.severity === 'error').length} error${validationErrors.filter(e => e.severity === 'error').length !== 1 ? 's' : ''}`
                      : `${validationErrors.length} warning${validationErrors.length !== 1 ? 's' : ''}`
                    }
                  </div>
                )}
                <Button 
                  size="sm" 
                  className={cn(
                    "h-7 sm:h-8 px-2 sm:px-3",
                    validationErrors.some(e => e.severity === 'error') && "opacity-80"
                  )}
                  onClick={handleRun}
                  disabled={blocks.length === 0 || isRunning || validationErrors.some(e => e.severity === 'error')}
                >
                  <Play className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Run</span>
                </Button>
              </div>
            </div>
            )}
          </div>
          )}

          {/* Landing View */}
          {labMode === 'landing' && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl w-full">
                {/* Pipeline Card */}
                <button
                  onClick={() => setLabMode('pipeline')}
                  className="group flex flex-col items-center gap-4 p-8 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <LabIcon className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-foreground">Pipeline</div>
                    <div className="text-xs text-muted-foreground mt-1">Build analytics pipelines</div>
                  </div>
                </button>

                {/* Chart Card */}
                <button
                  onClick={() => setLabMode('chart')}
                  className="group flex flex-col items-center gap-4 p-8 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <ChartsIcon size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-foreground">Chart Builder</div>
                    <div className="text-xs text-muted-foreground mt-1">Custom visualizations</div>
                  </div>
                </button>

                {/* Allocation Card */}
                <button
                  onClick={() => navigate('/construction/allocation')}
                  className="group flex flex-col items-center gap-4 p-8 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <Blocks className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-foreground">Allocation</div>
                    <div className="text-xs text-muted-foreground mt-1">Portfolio weight builder</div>
                  </div>
                </button>

                {/* Research Card */}
                <button
                  onClick={() => setLabMode('research')}
                  className="group flex flex-col items-center gap-4 p-8 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <ResearchIcon size={40} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-foreground">Research</div>
                    <div className="text-xs text-muted-foreground mt-1">Deep dive analysis</div>
                  </div>
                </button>

                {/* Rebalance Card */}
                <button
                  onClick={() => setLabMode('rebalance')}
                  className="group flex flex-col items-center gap-4 p-8 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <Play className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="text-center">
                    <div className="text-sm font-semibold text-foreground">Rebalance</div>
                    <div className="text-xs text-muted-foreground mt-1">Tax-optimized rebalancing</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          {labMode === 'chart' ? (
            <ChartBuilderView />
          ) : labMode === 'pipeline' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Panel - Block Library (Desktop only, Sheet on mobile) */}
            <div className="hidden md:block w-56 shrink-0">
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
                  onSelectBlock={(id) => {
                    setSelectedBlockId(id);
                    if (id && isMobile) {
                      setMobileInspectorOpen(true);
                    }
                  }}
                  onRemoveBlock={handleRemoveBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onReorderBlocks={handleReorderBlocks}
                  isDropTarget={isOverCanvas}
                  activeDragId={activeDragBlockId}
                  validationErrors={validationErrors}
                />
              </div>

              {/* Bottom - Results */}
              <LabResultPanel 
                result={result}
                isRunning={isRunning}
              />
            </div>

            {/* Right Panel - Inspector (Desktop only) */}
            <div className="hidden md:block w-52 shrink-0">
              <LabInspector
                selectedBlock={selectedBlock}
                onUpdateBlock={handleUpdateBlock}
                availableAssets={availableAssets}
                pipelineBlocks={blocks}
              />
            </div>
          </div>
          ) : labMode === 'rebalance' ? (
            <div className="flex-1 overflow-auto p-4">
              <RebalanceTool />
            </div>
          ) : labMode === 'research' ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p className="text-sm font-mono">Research workspace — coming soon</p>
            </div>
          ) : null}
          
          {/* Mobile FABs */}
          {isMobile && labMode === 'pipeline' && (
            <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-50">
              {/* Add Block FAB */}
              <Sheet open={mobileLibraryOpen} onOpenChange={setMobileLibraryOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="lg" 
                    className="h-12 w-12 rounded-full shadow-lg"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[70vh]">
                  <SheetHeader className="pb-2">
                    <SheetTitle className="flex items-center gap-2">
                      <Blocks className="h-4 w-4" />
                      Block Library
                    </SheetTitle>
                  </SheetHeader>
                  <div className="overflow-auto h-[calc(100%-3rem)]">
                    <LabBlockLibrary 
                      onAddBlock={(type) => {
                        handleAddBlock(type);
                        setMobileLibraryOpen(false);
                      }}
                      onLoadPreset={(presetId) => {
                        handleLoadPreset(presetId);
                        setMobileLibraryOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
              
              {/* Inspector FAB (only when block selected) */}
              {selectedBlockId && (
                <Sheet open={mobileInspectorOpen} onOpenChange={setMobileInspectorOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline"
                      size="lg" 
                      className="h-12 w-12 rounded-full shadow-lg bg-card"
                    >
                      <Settings2 className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[85vw] sm:w-80">
                    <SheetHeader className="pb-2">
                      <SheetTitle className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Block Settings
                      </SheetTitle>
                    </SheetHeader>
                    <div className="overflow-auto h-[calc(100%-3rem)]">
                      <LabInspector
                        selectedBlock={selectedBlock}
                        onUpdateBlock={handleUpdateBlock}
                        availableAssets={availableAssets}
                        pipelineBlocks={blocks}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}>
          {activeDragBlock && (
            <DragOverlayBlock block={activeDragBlock} icon={ActiveIcon} />
          )}
          {activePipelineBlockMeta && (
            <DragOverlayBlock block={activePipelineBlockMeta} icon={LIBRARY_ICON_MAP[activePipelineBlockMeta.icon] || Database} />
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
