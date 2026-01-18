import React from 'react';
import { 
  Database, 
  Calendar, 
  Shuffle, 
  Calculator, 
  BarChart3,
  ChevronDown,
  X,
  GripVertical,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { 
  AnalyticsBlock, 
  ANALYTICS_BLOCK_LIBRARY,
  DataSourceConfig,
  DateRangeConfig,
  ComputeConfig,
  OutputConfig,
} from '@/types/analyticsLab';
import { DottedGridBackground } from '@/components/DottedGridBackground';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Calendar,
  Shuffle,
  Calculator,
  BarChart3,
};

function getBlockSummary(block: AnalyticsBlock): string {
  switch (block.type) {
    case 'data_source': {
      const config = block.config as DataSourceConfig;
      const assets = config.assets.length > 0 
        ? config.assets.slice(0, 2).join(', ') + (config.assets.length > 2 ? ` +${config.assets.length - 2}` : '')
        : 'No assets';
      return `${config.sourceType} • ${assets}`;
    }
    case 'date_range': {
      const config = block.config as DateRangeConfig;
      return config.preset || `${config.customStart} to ${config.customEnd}`;
    }
    case 'compute': {
      const config = block.config as ComputeConfig;
      return config.function.replace(/_/g, ' ');
    }
    case 'output': {
      const config = block.config as OutputConfig;
      return config.outputType.replace('_', ' ');
    }
    default:
      return '';
  }
}

interface SortableBlockProps {
  block: AnalyticsBlock;
  isSelected: boolean;
  isFirst: boolean;
  onSelect: () => void;
  onRemove: () => void;
  isDraggingOver?: boolean;
}

function SortableBlock({ block, isSelected, isFirst, onSelect, onRemove, isDraggingOver }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  const blockMeta = ANALYTICS_BLOCK_LIBRARY.find(b => b.type === block.type);
  const Icon = ICON_MAP[blockMeta?.icon || 'Database'] || Database;
  const summary = getBlockSummary(block);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group relative",
        isDragging && "z-50"
      )}
    >
      {/* Drop indicator line */}
      {isOver && !isDragging && (
        <div className="absolute -top-2 left-0 right-0 flex items-center gap-2 z-10">
          <div className="flex-1 h-0.5 bg-primary rounded-full" />
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Plus className="w-3 h-3 text-primary-foreground" />
          </div>
          <div className="flex-1 h-0.5 bg-primary rounded-full" />
        </div>
      )}

      {/* Connection line */}
      {!isFirst && !isDragging && (
        <div className="flex justify-center -my-1 transition-opacity duration-200">
          <div className="w-0.5 h-4 bg-border" />
          <ChevronDown className="h-4 w-4 text-muted-foreground -ml-2" />
        </div>
      )}
      
      {/* Block */}
      <div
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg text-left cursor-pointer",
          "border transition-all duration-200",
          isDragging && "opacity-90 shadow-2xl scale-[1.02] ring-2 ring-primary/50",
          isSelected 
            ? "bg-primary/10 border-primary shadow-sm shadow-primary/10"
            : "bg-card hover:bg-muted/50 border-border hover:border-muted-foreground/30",
          "hover:shadow-md"
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "cursor-grab active:cursor-grabbing touch-none p-1 -m-1 rounded transition-colors",
            "hover:bg-muted/80"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
        
        <div 
          className="p-1.5 rounded-md shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${blockMeta?.color || 'hsl(var(--primary))'}20` }}
        >
          <Icon 
            className="h-4 w-4" 
            style={{ color: blockMeta?.color || 'hsl(var(--primary))' }} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground">
            {blockMeta?.label || block.type}
          </div>
          {summary && (
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
              {summary}
            </div>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground transition-all duration-200",
            "opacity-0 group-hover:opacity-100",
            "hover:bg-destructive/20 hover:text-destructive hover:scale-110"
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface LabCanvasProps {
  blocks: AnalyticsBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlocks: (activeId: string, overId: string) => void;
  isDropTarget?: boolean;
  activeDragId?: string | null;
}

export function LabCanvas({ 
  blocks, 
  selectedBlockId, 
  onSelectBlock, 
  onRemoveBlock,
  onReorderBlocks,
  isDropTarget = false,
  activeDragId,
}: LabCanvasProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);
  
  // Droppable hook for receiving blocks from library
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  const showDropZone = isDropTarget || isOver;

  return (
    <DottedGridBackground
      dotSize={1}
      dotSpacing={16}
      opacity={0.04}
      fadeEdges={true}
      fadeType="linear"
      className={cn(
        "h-full flex flex-col transition-all duration-300",
        showDropZone && "ring-2 ring-primary ring-inset bg-primary/5"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-background/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Pipeline Canvas
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {blocks.length === 0 
            ? 'Drag blocks from library or use a preset'
            : `${blocks.length} block${blocks.length !== 1 ? 's' : ''} • Drag to reorder`
          }
        </p>
      </div>
      
      {/* Canvas Area - This is the drop zone */}
      <div ref={setDropRef} className="flex-1 p-6 overflow-auto">
        {blocks.length === 0 ? (
          <div className={cn(
            "h-full flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-300",
            showDropZone 
              ? "border-primary bg-primary/10 scale-[1.01]" 
              : "border-border hover:border-muted-foreground/50"
          )}>
            <div className="text-center max-w-xs">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300",
                showDropZone ? "bg-primary/20 scale-110" : "bg-muted/50"
              )}>
                <Database className={cn(
                  "h-8 w-8 transition-colors duration-300",
                  showDropZone ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <h4 className={cn(
                "text-sm font-medium mb-1 transition-colors duration-300",
                showDropZone ? "text-primary" : "text-foreground"
              )}>
                {showDropZone ? "Drop here to add" : "No blocks yet"}
              </h4>
              <p className="text-xs text-muted-foreground">
                {showDropZone 
                  ? "Release to add this block to your pipeline"
                  : "Drag a block from the library or click to add"
                }
              </p>
            </div>
          </div>
        ) : (
          <SortableContext
            items={sortedBlocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 max-w-md mx-auto">
              {sortedBlocks.map((block, index) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  isSelected={selectedBlockId === block.id}
                  isFirst={index === 0}
                  onSelect={() => onSelectBlock(selectedBlockId === block.id ? null : block.id)}
                  onRemove={() => onRemoveBlock(block.id)}
                />
              ))}
              
              {/* Drop zone at bottom when blocks exist */}
              {showDropZone && (
                <div className="flex items-center gap-2 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex-1 h-0.5 bg-primary/50 rounded-full" />
                  <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-medium text-primary">
                    Drop here
                  </div>
                  <div className="flex-1 h-0.5 bg-primary/50 rounded-full" />
                </div>
              )}
            </div>
          </SortableContext>
        )}
      </div>
    </DottedGridBackground>
  );
}
