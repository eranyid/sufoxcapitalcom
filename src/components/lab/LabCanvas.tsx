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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AnalyticsBlock, 
  ANALYTICS_BLOCK_LIBRARY,
  DataSourceConfig,
  DateRangeConfig,
  ComputeConfig,
  OutputConfig,
} from '@/types/analyticsLab';
import { DottedGridBackground } from '@/components/DottedGridBackground';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Calendar,
  Shuffle,
  Calculator,
  BarChart3,
};

interface LabCanvasProps {
  blocks: AnalyticsBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onRemoveBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
}

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

export function LabCanvas({ 
  blocks, 
  selectedBlockId, 
  onSelectBlock, 
  onRemoveBlock,
  onMoveBlock,
}: LabCanvasProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);

  return (
    <DottedGridBackground
      dotSize={1}
      dotSpacing={16}
      opacity={0.04}
      fadeEdges={true}
      fadeType="linear"
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-background/50 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Pipeline Canvas
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {blocks.length === 0 
            ? 'Add blocks from the library or use a quick preset'
            : `${blocks.length} block${blocks.length !== 1 ? 's' : ''} in pipeline`
          }
        </p>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 p-6 overflow-auto">
        {blocks.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-sm font-medium text-foreground mb-1">
                No blocks yet
              </h4>
              <p className="text-xs text-muted-foreground">
                Click on a block from the library or use a quick preset to get started.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-md mx-auto">
            {sortedBlocks.map((block, index) => {
              const blockMeta = ANALYTICS_BLOCK_LIBRARY.find(b => b.type === block.type);
              const Icon = ICON_MAP[blockMeta?.icon || 'Database'] || Database;
              const isSelected = selectedBlockId === block.id;
              const summary = getBlockSummary(block);
              
              return (
                <div key={block.id}>
                  {/* Connection line */}
                  {index > 0 && (
                    <div className="flex justify-center -my-1">
                      <div className="w-0.5 h-4 bg-border" />
                      <ChevronDown className="h-4 w-4 text-muted-foreground -ml-2" />
                    </div>
                  )}
                  
                  {/* Block */}
                  <button
                    onClick={() => onSelectBlock(isSelected ? null : block.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left",
                      "border transition-all duration-150",
                      isSelected 
                        ? "bg-primary/10 border-primary shadow-sm shadow-primary/10"
                        : "bg-card hover:bg-muted/50 border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                    
                    <div 
                      className="p-1.5 rounded-md shrink-0"
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
                        onRemoveBlock(block.id);
                      }}
                      className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DottedGridBackground>
  );
}
