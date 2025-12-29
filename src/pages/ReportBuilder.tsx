import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Settings2, 
  FileText,
  Maximize2,
  Undo2,
  Redo2,
  LayoutTemplate,
} from 'lucide-react';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useIsMobile } from '@/hooks/use-mobile';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useReport } from '@/hooks/useReports';
import { usePortfolio } from '@/context/PortfolioContext';
import { useReportBuilderHistory } from '@/hooks/useUndoRedo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  ReportBlock, 
  ReportBranding as WYSIWYGBranding, 
  BLOCK_LIBRARY, 
  DEFAULT_BRANDING as WYSIWYG_DEFAULT_BRANDING,
  ReportBlockType,
  ReportBlockConfig,
} from '@/types/reportBuilder';
import { ReportCanvas } from '@/components/reports/ReportCanvas';
import { BlockLibraryPanel } from '@/components/reports/BlockLibraryPanel';
import { BlockPropertiesPanel } from '@/components/reports/BlockPropertiesPanel';
import { ReportBlockRenderer } from '@/components/reports/ReportBlockRenderer';
import { TemplateSelectorDialog, ReportTemplate, useTemplateApplicator } from '@/components/reports/ReportTemplates';
import { generateWYSIWYGReportPDF } from '@/lib/reportPdfGenerator';
import type { ReportBranding } from '@/types/reports';

// Helper to convert old branding to new format
const convertBrandingToWYSIWYG = (branding: ReportBranding): WYSIWYGBranding => ({
  accentColor: branding.accentColor || '#FFC107',
  backgroundColor: '#0A0A0A',
  headerTitle: branding.headerTitle,
  headerSubtitle: branding.headerSubtitle,
  footerText: branding.footerText,
  analystName: branding.analystName,
  logoUrl: branding.logoUrl,
  showPageNumbers: branding.showPageNumbers ?? true,
  showConfidentialWatermark: false,
  dateFormat: 'medium',
});

// Helper to convert WYSIWYG branding back to old format for saving
const convertBrandingFromWYSIWYG = (branding: WYSIWYGBranding): ReportBranding => ({
  accentColor: branding.accentColor,
  headerTitle: branding.headerTitle,
  headerSubtitle: branding.headerSubtitle,
  footerText: branding.footerText,
  analystName: branding.analystName,
  logoUrl: branding.logoUrl,
  showPageNumbers: branding.showPageNumbers,
});

export default function ReportBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { report, loading, updateReport } = useReport(id);
  const { computedData, performanceMetrics, riskMetrics } = usePortfolio();
  const isMobile = useIsMobile();
  
  const holdings = computedData.holdings;
  const totalValue = computedData.totalPortfolioValue;
  
  // Use undo/redo hook for blocks and branding
  const {
    blocks,
    branding,
    setBlocks,
    setBranding,
    undo,
    redo,
    canUndo,
    canRedo,
    resetState,
  } = useReportBuilderHistory<ReportBlock[], WYSIWYGBranding>([], WYSIWYG_DEFAULT_BRANDING);
  
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const { applyTemplate } = useTemplateApplicator();

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) redo();
        } else {
          e.preventDefault();
          if (canUndo) undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Track changes for unsaved indicator
  useEffect(() => {
    if (initialized && (canUndo || canRedo)) {
      setHasChanges(true);
    }
  }, [blocks, branding, initialized, canUndo, canRedo]);

  // Initialize state from report - convert old sections to blocks if needed
  useEffect(() => {
    if (report && !initialized) {
      // Check if we have blocks stored (new format) or sections (old format)
      const storedSections = report.sections;
      
      // Try to detect if sections are actually blocks (have row/colSpan properties)
      const isNewFormat = storedSections.length > 0 && 'row' in storedSections[0] && 'colSpan' in storedSections[0];
      
      let initialBlocks: ReportBlock[];
      
      if (isNewFormat) {
        // New block format
        initialBlocks = storedSections as unknown as ReportBlock[];
      } else {
        // Convert old sections to blocks
        initialBlocks = storedSections
          .filter(s => s.enabled)
          .map((section, index) => {
            const libraryItem = BLOCK_LIBRARY.find(b => b.type === section.type as ReportBlockType);
            return {
              id: section.id,
              type: section.type as ReportBlockType,
              row: index,
              colSpan: libraryItem?.defaultColSpan || 12,
              colStart: 0,
              height: libraryItem?.defaultHeight || 4,
              config: {
                title: section.title,
                ...libraryItem?.defaultConfig,
                ...(section.config || {}),
              },
              enabled: true,
              page: 1,
            };
          });
      }
      
      const initialBranding = convertBrandingToWYSIWYG(report.branding);
      resetState(initialBlocks, initialBranding);
      setPageSize(report.page_size);
      setInitialized(true);
    }
  }, [report, initialized, resetState]);

  const handleSave = async () => {
    setIsSaving(true);
    // Save blocks as sections (they're compatible since both are JSON)
    const success = await updateReport({ 
      sections: blocks as any, 
      branding: convertBrandingFromWYSIWYG(branding), 
      page_size: pageSize 
    });
    setIsSaving(false);
    if (success) {
      setHasChanges(false);
      toast.success('Report saved');
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateWYSIWYGReportPDF({
        blocks,
        branding,
        pageSize,
        holdings,
        performanceMetrics,
        riskMetrics,
        totalValue,
        reportName: report?.name || 'Report',
      });
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const addBlock = useCallback((type: ReportBlockType) => {
    const libraryItem = BLOCK_LIBRARY.find(b => b.type === type);
    if (!libraryItem) return;

    const newBlock: ReportBlock = {
      id: crypto.randomUUID(),
      type,
      row: blocks.length,
      colSpan: libraryItem.defaultColSpan,
      colStart: 0,
      height: libraryItem.defaultHeight,
      config: { ...libraryItem.defaultConfig },
      enabled: true,
      page: 1,
    };
    
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setPropertiesPanelOpen(true);
    setHasChanges(true);
  }, [blocks.length]);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
    setHasChanges(true);
  }, [selectedBlockId]);

  const duplicateBlock = useCallback((id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    const newBlock: ReportBlock = {
      ...block,
      id: crypto.randomUUID(),
      row: blocks.length,
    };
    
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    setHasChanges(true);
  }, [blocks]);

  const updateBlockConfig = useCallback((id: string, config: Partial<ReportBlockConfig>) => {
    setBlocks(prev => prev.map(b => 
      b.id === id ? { ...b, config: { ...b.config, ...config } } : b
    ));
    setHasChanges(true);
  }, []);

  const updateBranding = useCallback((updates: Partial<WYSIWYGBranding>) => {
    setBranding(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  const openBlockProperties = useCallback((id: string) => {
    setSelectedBlockId(id);
    setPropertiesPanelOpen(true);
  }, []);

  const handleApplyTemplate = useCallback((template: ReportTemplate) => {
    applyTemplate(template, setBlocks, setBranding);
    setHasChanges(true);
    toast.success(`Applied "${template.name}" template`);
  }, [applyTemplate, setBlocks, setBranding]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Check if dragging from library
    if (active.id.toString().startsWith('library-')) {
      const type = active.data.current?.type as ReportBlockType;
      if (type) {
        addBlock(type);
      }
      return;
    }
    
    // Reordering existing blocks
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        if (oldIndex === -1 || newIndex === -1) return items;
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update row positions
        newItems.forEach((block, index) => {
          block.row = index;
        });
        return newItems;
      });
      setHasChanges(true);
    }
  };

  const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;

  if (loading) {
    return (
      <div className="h-full flex flex-col p-4 md:p-6">
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="flex-1 flex gap-4">
          <Skeleton className="w-72 h-full" />
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="w-80 h-full" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <FileText size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Report not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card/50 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0"
                onClick={() => navigate('/reports')}
              >
                <ArrowLeft size={16} />
              </Button>
              <Input
                value={report.name}
                onChange={(e) => { updateReport({ name: e.target.value }); setHasChanges(true); }}
                className="text-lg font-semibold border-transparent hover:border-border bg-transparent h-auto py-1 px-2 max-w-xs"
              />
              {hasChanges && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Unsaved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Undo/Redo buttons */}
              <div className="flex items-center border border-border rounded-md">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-r-none"
                      onClick={undo}
                      disabled={!canUndo}
                    >
                      <Undo2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Undo <kbd className="ml-1.5 text-xs opacity-60">⌘Z</kbd></p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-l-none border-l border-border"
                      onClick={redo}
                      disabled={!canRedo}
                    >
                      <Redo2 size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Redo <kbd className="ml-1.5 text-xs opacity-60">⇧⌘Z</kbd></p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8"
                onClick={() => setTemplateDialogOpen(true)}
              >
                <LayoutTemplate size={14} />
                <span className="hidden sm:inline">Templates</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8"
                onClick={() => setPreviewOpen(true)}
              >
                <Maximize2 size={14} />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Select value={pageSize} onValueChange={(v) => { setPageSize(v as 'A4' | 'Letter'); setHasChanges(true); }}>
                <SelectTrigger className="w-[90px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                size="sm" 
                className="gap-1.5 h-8"
                onClick={() => { setSelectedBlockId(null); setPropertiesPanelOpen(true); }}
              >
                <Settings2 size={14} />
                <span className="hidden sm:inline">Branding</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 h-8"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              >
                <Save size={14} />
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
              </Button>
              <Button 
                size="sm" 
                className="gap-1.5 h-8"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <Download size={14} />
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - WYSIWYG Layout */}
        <div className={cn(
          "flex-1 overflow-hidden flex",
          isMobile ? "flex-col" : "flex-row"
        )}>
          {/* Desktop: Left sidebar for Block Library */}
          {!isMobile && <BlockLibraryPanel onAddBlock={addBlock} />}
          
          {/* Center: Canvas */}
          <ReportCanvas
            blocks={blocks}
            branding={branding}
            pageSize={pageSize}
            holdings={holdings}
            performanceMetrics={performanceMetrics}
            riskMetrics={riskMetrics}
            totalValue={totalValue}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onBlocksChange={(newBlocks) => { setBlocks(newBlocks); setHasChanges(true); }}
            onDeleteBlock={deleteBlock}
            onDuplicateBlock={duplicateBlock}
            onOpenProperties={openBlockProperties}
          />
          
          {/* Right: Properties Panel - Desktop only */}
          {propertiesPanelOpen && !isMobile && (
            <BlockPropertiesPanel
              block={selectedBlock || null}
              branding={branding}
              onUpdateBlock={updateBlockConfig}
              onUpdateBranding={updateBranding}
              onClose={() => setPropertiesPanelOpen(false)}
            />
          )}

          {/* Mobile: Bottom horizontal Block Library */}
          {isMobile && <BlockLibraryPanel onAddBlock={addBlock} />}
        </div>

        {/* Mobile: Properties Panel as Sheet */}
        {isMobile && propertiesPanelOpen && (
          <Dialog open={propertiesPanelOpen} onOpenChange={setPropertiesPanelOpen}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedBlock ? 'Block Properties' : 'Report Branding'}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <BlockPropertiesPanel
                  block={selectedBlock || null}
                  branding={branding}
                  onUpdateBlock={updateBlockConfig}
                  onUpdateBranding={updateBranding}
                  onClose={() => setPropertiesPanelOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Full Preview Modal */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border flex flex-row items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {branding.headerTitle || 'Report Preview'}
              </DialogTitle>
              <Button 
                variant="default" 
                size="sm" 
                className="gap-1.5"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                <Download size={14} />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6 py-4">
              <div 
                className="mx-auto bg-card rounded-lg border border-border shadow-lg overflow-hidden"
                style={{ maxWidth: pageSize === 'A4' ? '210mm' : '8.5in' }}
              >
                {/* Report Header */}
                <div 
                  className="h-1" 
                  style={{ backgroundColor: branding.accentColor }}
                />
                <div className="p-8 space-y-6">
                  {blocks.filter(b => b.enabled).map((block) => (
                    <div key={block.id}>
                      <ReportBlockRenderer
                        block={block}
                        holdings={holdings}
                        performanceMetrics={performanceMetrics}
                        riskMetrics={riskMetrics}
                        totalValue={totalValue}
                        branding={branding}
                      />
                    </div>
                  ))}
                </div>
                {/* Report Footer */}
                {branding.showPageNumbers && (
                  <div className="border-t border-border px-8 py-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{branding.footerText || 'Confidential'}</span>
                    {branding.analystName && <span>{branding.analystName}</span>}
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Template Selector Dialog */}
        <TemplateSelectorDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          onSelectTemplate={handleApplyTemplate}
        />
      </div>
    </DndContext>
  );
}
