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
  Copy,
  AlertTriangle,
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
import { ValidationError } from '@/lib/pipelineValidation';
import { DottedGridBackground } from '@/components/DottedGridBackground';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  onDuplicate: () => void;
  isDraggingOver?: boolean;
  errors?: ValidationError[];
}

function SortableBlock({ block, isSelected, isFirst, onSelect, onRemove, onDuplicate, isDraggingOver, errors = [] }: SortableBlockProps) {
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

      {/* Connection line with animated flow */}
      {!isFirst && !isDragging && (
        <div className="flex flex-col items-center -my-0.5 transition-opacity duration-200">
          {/* Connector line with gradient */}
          <div className="relative w-8 h-6 flex items-center justify-center">
            {/* Animated flow indicator */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <div className="w-0.5 h-full bg-gradient-to-b from-[hsl(var(--lab-accent)/0.3)] via-[hsl(var(--lab-accent)/0.6)] to-[hsl(var(--lab-accent)/0.3)]" />
              {/* Animated pulse */}
              <div className="absolute w-1.5 h-1.5 rounded-full bg-[hsl(var(--lab-accent))] animate-[flowPulse_2s_ease-in-out_infinite] shadow-[0_0_6px_hsl(var(--lab-accent))]" />
            </div>
          </div>
          {/* Arrow indicator */}
          <div className="relative -mt-1">
            <ChevronDown className="h-4 w-4 text-[hsl(var(--lab-accent))]" />
          </div>
        </div>
      )}
      
      {/* Block */}
      <div
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg text-left cursor-pointer",
          "border transition-all duration-200",
          isDragging && "opacity-90 shadow-2xl scale-[1.02] ring-2 ring-primary/50",
          errors.length > 0 && errors.some(e => e.severity === 'error')
            ? "border-destructive/60 bg-destructive/5"
            : errors.length > 0
              ? "border-amber-500/60 bg-amber-500/5"
              : isSelected 
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">
              {blockMeta?.label || block.type}
            </span>
            {/* Error indicator */}
            {errors.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                      errors.some(e => e.severity === 'error')
                        ? "bg-destructive/20 text-destructive"
                        : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                    )}>
                      <AlertTriangle className="h-3 w-3" />
                      {errors.length}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      {errors.map((error, i) => (
                        <div key={i} className={cn(
                          "text-xs",
                          error.severity === 'error' ? "text-destructive" : "text-amber-600"
                        )}>
                          • {error.message}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {summary && (
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
              {summary}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className={cn(
              "p-1.5 rounded-md text-muted-foreground transition-all duration-200",
              "hover:bg-primary/20 hover:text-primary hover:scale-110"
            )}
            title="Duplicate block"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={cn(
              "p-1.5 rounded-md text-muted-foreground transition-all duration-200",
              "hover:bg-destructive/20 hover:text-destructive hover:scale-110"
            )}
            title="Remove block"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {/* Inline error messages */}
      {errors.length > 0 && (
        <div className="mt-1 ml-8 space-y-1">
          {errors.map((error, i) => (
            <div 
              key={i}
              className={cn(
                "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded",
                error.severity === 'error' 
                  ? "bg-destructive/10 text-destructive border border-destructive/20" 
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              )}
            >
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LabCanvasProps {
  blocks: AnalyticsBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onRemoveBlock: (blockId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onReorderBlocks: (activeId: string, overId: string) => void;
  isDropTarget?: boolean;
  activeDragId?: string | null;
  validationErrors?: ValidationError[];
}

export function LabCanvas({ 
  blocks, 
  selectedBlockId, 
  onSelectBlock, 
  onRemoveBlock,
  onDuplicateBlock,
  onReorderBlocks,
  isDropTarget = false,
  activeDragId,
  validationErrors = [],
}: LabCanvasProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);
  
  // Group errors by block ID
  const errorsByBlockId = validationErrors.reduce((acc, error) => {
    if (!acc[error.blockId]) acc[error.blockId] = [];
    acc[error.blockId].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);
  
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
          <div className="h-full flex items-center justify-center">
            <div className={cn(
              "relative w-full max-w-sm aspect-square flex items-center justify-center rounded-2xl transition-all duration-500 ease-out",
              showDropZone 
                ? "scale-105" 
                : "hover:scale-[1.02]"
            )}>
              {/* Outer glow ring */}
              <div className={cn(
                "absolute inset-0 rounded-2xl border-2 border-dashed transition-all duration-500",
                showDropZone 
                  ? "border-primary/60 shadow-[0_0_60px_-15px_hsl(var(--primary))]" 
                  : "border-border/50 hover:border-muted-foreground/40"
              )} />
              
              {/* Inner content */}
              <div className="relative z-10 flex flex-col items-center gap-5 p-8 group/icon">
                {/* Animated icon container */}
                <div className={cn(
                  "relative w-20 h-20 flex items-center justify-center transition-all duration-500",
                  "group-hover/icon:animate-[float_3s_ease-in-out_infinite]",
                  showDropZone && "animate-pulse"
                )}>
                  {/* Background circles */}
                  <div className={cn(
                    "absolute inset-0 rounded-full transition-all duration-500",
                    "group-hover/icon:scale-110 group-hover/icon:shadow-lg",
                    showDropZone 
                      ? "bg-primary/20 scale-125" 
                      : "bg-gradient-to-br from-muted/80 to-muted/40 group-hover/icon:from-primary/20 group-hover/icon:to-primary/10"
                  )} />
                  <div className={cn(
                    "absolute inset-2 rounded-full transition-all duration-500",
                    "group-hover/icon:scale-105",
                    showDropZone 
                      ? "bg-primary/10" 
                      : "bg-background/60 backdrop-blur-sm group-hover/icon:bg-background/80"
                  )} />
                  
                  {/* Icon */}
                  <Database className={cn(
                    "relative h-9 w-9 transition-all duration-500",
                    "group-hover/icon:rotate-6 group-hover/icon:scale-110",
                    showDropZone 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground/70 group-hover/icon:text-primary"
                  )} />
                </div>
                
                {/* Text content */}
                <div className="text-center space-y-2">
                  <h4 className={cn(
                    "text-base font-semibold tracking-tight transition-colors duration-300",
                    showDropZone ? "text-primary" : "text-foreground/90"
                  )}>
                    {showDropZone ? "Drop to add block" : "Start building"}
                  </h4>
                  <p className="text-sm text-muted-foreground/80 max-w-[200px] leading-relaxed">
                    {showDropZone 
                      ? "Release to add this block to your pipeline"
                      : "Drag blocks from the library or use a quick preset"
                    }
                  </p>
                </div>
                
                {/* Decorative elements */}
                {!showDropZone && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-0.5 rounded-full bg-border" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    <div className="w-8 h-0.5 rounded-full bg-border" />
                  </div>
                )}
              </div>
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
                  onDuplicate={() => onDuplicateBlock(block.id)}
                  errors={errorsByBlockId[block.id]}
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
