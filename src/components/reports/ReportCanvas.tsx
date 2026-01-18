import { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDndMonitor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { 
  ReportBlock, 
  ReportBranding, 
  PAGE_DIMENSIONS, 
  GRID_ROW_HEIGHT,
  GRID_COLUMNS,
} from '@/types/reportBuilder';
import { ReportBlockRenderer } from './ReportBlockRenderer';
import { GripVertical, Trash2, Copy, Settings, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PortfolioHolding } from '@/lib/portfolioEngine';
import type { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { useBlockResize } from '@/hooks/useBlockResize';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';
import { DottedGridBackground } from '@/components/DottedGridBackground';

interface SortableBlockProps {
  block: ReportBlock;
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  branding: ReportBranding;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOpenProperties: (id: string) => void;
  onResize: (blockId: string, colSpan: number, height: number) => void;
  scale: number;
  containerWidth: number;
}

function SortableBlock({
  block,
  holdings,
  performanceMetrics,
  riskMetrics,
  totalValue,
  branding,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onOpenProperties,
  onResize,
  scale,
  containerWidth,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const { isResizing, handleMouseDown } = useBlockResize({
    blockId: block.id,
    colSpan: block.colSpan,
    height: block.height,
    scale,
    containerWidth,
    onResize,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? 'none' : isDragging 
      ? 'none' 
      : 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 200ms ease, opacity 200ms ease',
    gridColumn: `span ${block.colSpan} / span ${block.colSpan}`,
    minHeight: block.height * GRID_ROW_HEIGHT * scale,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      data-block-id={block.id}
      data-block-type={block.type}
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-lg border transition-all duration-200",
        isDragging && "opacity-60 scale-[1.02] shadow-2xl shadow-primary/20 ring-2 ring-primary/50",
        isResizing && "z-50 ring-2 ring-primary",
        isSelected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border/50 hover:border-border hover:shadow-lg hover:shadow-black/5",
        !block.enabled && "opacity-40"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
    >
      {/* Block toolbar - enhanced with smooth animations */}
      <div className={cn(
        "absolute -top-9 left-0 right-0 flex items-center justify-between transition-all duration-200",
        "opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0",
        isSelected && "opacity-100 translate-y-0",
        "z-10"
      )}>
        <div 
          {...attributes} 
          {...listeners}
          className={cn(
            "flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5",
            "cursor-grab active:cursor-grabbing transition-all duration-150",
            "hover:border-primary/50 hover:shadow-md hover:shadow-primary/10",
            "active:scale-95"
          )}
        >
          <GripVertical size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {block.type.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-0.5 bg-card/95 backdrop-blur-sm border border-border rounded-md p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={(e) => { e.stopPropagation(); onOpenProperties(block.id); }}
          >
            <Settings size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
          >
            <Copy size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {/* Block content with smooth transition */}
      <div className="p-3 h-full overflow-hidden transition-opacity duration-200">
        <ReportBlockRenderer
          block={block}
          holdings={holdings}
          performanceMetrics={performanceMetrics}
          riskMetrics={riskMetrics}
          totalValue={totalValue}
          branding={branding}
        />
      </div>

      {/* Right resize handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-primary/20"
        )}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      />

      {/* Bottom resize handle */}
      <div
        className={cn(
          "absolute bottom-0 left-0 w-full h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-primary/20"
        )}
        onMouseDown={(e) => handleMouseDown(e, 'bottom')}
      />

      {/* Corner resize handle */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
        )}
        onMouseDown={(e) => handleMouseDown(e, 'corner')}
      >
        <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-primary/50" />
      </div>

      {/* Size indicator while resizing */}
      {isResizing && (
        <div className="absolute bottom-2 right-6 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-mono">
          {block.colSpan} × {block.height}
        </div>
      )}
    </div>
  );
}

interface ReportCanvasProps {
  blocks: ReportBlock[];
  branding: ReportBranding;
  pageSize: 'A4' | 'Letter';
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onBlocksChange: (blocks: ReportBlock[]) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onOpenProperties: (id: string) => void;
}

export function ReportCanvas({
  blocks,
  branding,
  pageSize,
  holdings,
  performanceMetrics,
  riskMetrics,
  totalValue,
  selectedBlockId,
  onSelectBlock,
  onBlocksChange,
  onDeleteBlock,
  onDuplicateBlock,
  onOpenProperties,
}: ReportCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLibraryDragging, setIsLibraryDragging] = useState(false);
  const isMobile = useIsMobile();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Monitor for library drags from parent DndContext
  useDndMonitor({
    onDragStart(event) {
      if (event.active.id.toString().startsWith('library-')) {
        setIsLibraryDragging(true);
      }
    },
    onDragEnd() {
      setIsLibraryDragging(false);
    },
    onDragCancel() {
      setIsLibraryDragging(false);
    },
  });

  // Calculate scale to fit canvas in viewport
  const pageDimensions = PAGE_DIMENSIONS[pageSize];
  const scale = isMobile ? 0.5 : 0.7; // Smaller scale on mobile
  const containerWidth = pageDimensions.width * scale * 3.78 - 48; // Account for padding

  // Group blocks by page
  const blocksByPage = useMemo(() => {
    const pages: Record<number, ReportBlock[]> = {};
    blocks.forEach(block => {
      const page = block.page || 1;
      if (!pages[page]) pages[page] = [];
      pages[page].push(block);
    });
    return pages;
  }, [blocks]);

  const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);
  const totalPages = pageNumbers.length || 1;

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  // Swipe gestures for mobile
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: goToNextPage,
    onSwipeRight: goToPrevPage,
    threshold: 50,
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        // Update row positions
        newBlocks.forEach((block, index) => {
          block.row = index;
        });
        onBlocksChange(newBlocks);
      }
    }
  };

  const handleBlockResize = useCallback((blockId: string, colSpan: number, height: number) => {
    const newBlocks = blocks.map(block => 
      block.id === blockId 
        ? { ...block, colSpan: colSpan as ReportBlock['colSpan'], height }
        : block
    );
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null;

  return (
    <div 
      className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8"
      {...(isMobile ? swipeHandlers : {})}
    >
      {/* Mobile page navigation indicator */}
      {isMobile && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mb-4 sticky top-0 z-10 bg-muted/80 backdrop-blur-sm py-2 rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft size={18} />
          </Button>
          <div className="flex items-center gap-2">
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentPage === num 
                    ? "bg-primary w-4" 
                    : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight size={18} />
          </Button>
          <span className="text-xs text-muted-foreground ml-2">
            Swipe to navigate
          </span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Pages - on mobile show only current page */}
        {Object.entries(blocksByPage)
          .filter(([pageNum]) => !isMobile || Number(pageNum) === currentPage)
          .map(([pageNum, pageBlocks]) => (
          <div
            key={pageNum}
            data-page-number={pageNum}
            className={cn(
              "mx-auto mb-8 rounded-lg shadow-xl overflow-hidden transition-all duration-300 relative",
              isLibraryDragging && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-2xl shadow-primary/20"
            )}
            style={{
              width: pageDimensions.width * scale * 3.78, // mm to px
              minHeight: pageDimensions.height * scale * 3.78,
              backgroundColor: branding.backgroundColor || '#0A0A0A',
              fontFamily: branding.bodyFont || 'system-ui, -apple-system, sans-serif',
            }}
            onClick={() => onSelectBlock(null)}
          >

            {/* Confidential Watermark */}
            {branding.showConfidentialWatermark && (
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden"
                style={{ opacity: 0.04 }}
              >
                <span 
                  className="text-6xl md:text-8xl font-bold uppercase tracking-widest whitespace-nowrap select-none"
                  style={{ 
                    color: branding.mutedTextColor || '#888888',
                    transform: 'rotate(-30deg)',
                  }}
                >
                  CONFIDENTIAL
                </span>
              </div>
            )}

            {/* Page header accent - with optional gradient */}
            <div 
              className={cn(
                "h-1 transition-all duration-300 relative z-10",
                isLibraryDragging && "h-2"
              )}
              style={{ 
                backgroundColor: branding.accentColor,
                background: branding.headerGradient || branding.accentColor,
              }}
            />
            
            {/* Page content grid */}
            <div 
              className={cn(
                "p-4 md:p-6 transition-all duration-300 relative z-10",
                isLibraryDragging && "bg-primary/5"
              )}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                gap: isMobile ? 4 : 8,
                minHeight: (pageDimensions.height * scale * 3.78) - 50,
                color: branding.textColor || '#E5E5E5',
              }}
            >
              <SortableContext
                items={pageBlocks.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {pageBlocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    holdings={holdings}
                    performanceMetrics={performanceMetrics}
                    riskMetrics={riskMetrics}
                    totalValue={totalValue}
                    branding={branding}
                    isSelected={selectedBlockId === block.id}
                    onSelect={onSelectBlock}
                    onDelete={onDeleteBlock}
                    onDuplicate={onDuplicateBlock}
                    onOpenProperties={onOpenProperties}
                    onResize={handleBlockResize}
                    scale={scale}
                    containerWidth={containerWidth}
                  />
                ))}
              </SortableContext>

              {/* Drop zone indicator when dragging from library */}
              {isLibraryDragging && (
                <div 
                  className="col-span-full min-h-[80px] border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center gap-2 bg-primary/5 animate-pulse"
                >
                  <Plus size={20} className="text-primary/70" />
                  <span className="text-sm text-primary/70 font-medium">Drop here to add block</span>
                </div>
              )}
            </div>

            {/* Page footer */}
            {branding.showPageNumbers && (
              <div 
                className="px-4 md:px-6 py-2 md:py-3 flex items-center justify-between text-xs"
                style={{
                  borderTop: `1px solid ${branding.tableBorderColor || '#333333'}`,
                  color: branding.mutedTextColor || '#888888',
                }}
              >
                <span>{branding.footerText}</span>
                <span>Page {pageNum}{isMobile && ` of ${totalPages}`}</span>
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {blocks.length === 0 && (
          <div
            className={cn(
              "mx-auto bg-card rounded-lg shadow-xl flex items-center justify-center border-2 border-dashed transition-all duration-300",
              isLibraryDragging 
                ? "border-primary ring-2 ring-primary/50 ring-offset-2 ring-offset-background bg-primary/5 shadow-2xl shadow-primary/20" 
                : "border-border"
            )}
            style={{
              width: pageDimensions.width * scale * 3.78,
              height: pageDimensions.height * scale * 3.78,
            }}
          >
            <div className={cn(
              "text-center p-4 transition-all duration-300",
              isLibraryDragging && "scale-110"
            )}>
              {isLibraryDragging ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    <Plus size={32} className="text-primary" />
                  </div>
                  <p className="text-primary text-sm font-medium">Drop here to add block</p>
                  <p className="text-xs text-primary/70 mt-1">Release to place the block</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">
                    {isMobile ? 'Tap blocks below to add' : 'Drag blocks from the library'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">to build your report</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Drag overlay - shows a preview of the dragged block */}
        <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}>
          {activeBlock && (
            <div 
              className="bg-card border-2 border-primary rounded-lg shadow-2xl shadow-primary/30 p-4 opacity-95 backdrop-blur-sm animate-scale-in"
              style={{ 
                width: 220,
                background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)/0.95) 100%)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">
                  {activeBlock.type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Drop to reposition</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}