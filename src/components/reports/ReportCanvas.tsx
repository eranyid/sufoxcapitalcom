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
import { GripVertical, Trash2, Copy, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PortfolioHolding } from '@/lib/portfolioEngine';
import type { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { useBlockResize } from '@/hooks/useBlockResize';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';

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
    transition: isResizing ? 'none' : transition,
    gridColumn: `span ${block.colSpan} / span ${block.colSpan}`,
    minHeight: block.height * GRID_ROW_HEIGHT * scale,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-lg border transition-all",
        isDragging && "opacity-50 z-50",
        isResizing && "z-50 ring-2 ring-primary",
        isSelected 
          ? "border-primary ring-2 ring-primary/20" 
          : "border-border/50 hover:border-border",
        !block.enabled && "opacity-40"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
    >
      {/* Block toolbar */}
      <div className={cn(
        "absolute -top-8 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10",
        isSelected && "opacity-100"
      )}>
        <div 
          {...attributes} 
          {...listeners}
          className="flex items-center gap-1 bg-card border border-border rounded px-2 py-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            {block.type.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onOpenProperties(block.id); }}
          >
            <Settings size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}
          >
            <Copy size={12} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>

      {/* Block content */}
      <div className="p-3 h-full overflow-hidden">
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
  const isMobile = useIsMobile();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

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
            className="mx-auto mb-8 bg-card rounded-lg shadow-xl overflow-hidden"
            style={{
              width: pageDimensions.width * scale * 3.78, // mm to px
              minHeight: pageDimensions.height * scale * 3.78,
            }}
            onClick={() => onSelectBlock(null)}
          >
            {/* Page header accent */}
            <div 
              className="h-1" 
              style={{ backgroundColor: branding.accentColor }}
            />
            
            {/* Page content grid */}
            <div 
              className="p-4 md:p-6"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                gap: isMobile ? 4 : 8,
                minHeight: (pageDimensions.height * scale * 3.78) - 50,
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
            </div>

            {/* Page footer */}
            {branding.showPageNumbers && (
              <div className="border-t border-border px-4 md:px-6 py-2 md:py-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{branding.footerText}</span>
                <span>Page {pageNum}{isMobile && ` of ${totalPages}`}</span>
              </div>
            )}
          </div>
        ))}

        {/* Empty state */}
        {blocks.length === 0 && (
          <div
            className="mx-auto bg-card rounded-lg shadow-xl flex items-center justify-center border-2 border-dashed border-border"
            style={{
              width: pageDimensions.width * scale * 3.78,
              height: pageDimensions.height * scale * 3.78,
            }}
          >
            <div className="text-center p-4">
              <p className="text-muted-foreground text-sm">
                {isMobile ? 'Tap blocks below to add' : 'Drag blocks from the library'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">to build your report</p>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {activeBlock && (
            <div 
              className="bg-card border border-primary rounded-lg shadow-lg p-3 opacity-80"
              style={{ width: 200 }}
            >
              <span className="text-xs font-medium">
                {activeBlock.type.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}