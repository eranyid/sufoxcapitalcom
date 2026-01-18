import React from 'react';
import { 
  Database, 
  Calendar, 
  Shuffle, 
  Calculator, 
  BarChart3,
  DollarSign,
  GitMerge,
  TrendingUp,
  Table,
  Grid3X3,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANALYTICS_BLOCK_LIBRARY, QUICK_PRESETS, AnalyticsBlockType } from '@/types/analyticsLab';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DraggableLibraryBlock } from './DraggableLibraryBlock';

export const LIBRARY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Database,
  Calendar,
  Shuffle,
  Calculator,
  BarChart3,
  DollarSign,
  GitMerge,
  TrendingUp,
  Table,
  Grid3x3: Grid3X3,
};

interface LabBlockLibraryProps {
  onAddBlock: (type: AnalyticsBlockType) => void;
  onLoadPreset: (presetId: string) => void;
}

export function LabBlockLibrary({ onAddBlock, onLoadPreset }: LabBlockLibraryProps) {
  return (
    <div className="h-full flex flex-col bg-card/50 border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Blocks Library
        </h3>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Drag blocks to canvas
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quick Presets
              </span>
            </div>
            <div className="space-y-1.5">
              {QUICK_PRESETS.map((preset) => {
                const Icon = LIBRARY_ICON_MAP[preset.icon] || BarChart3;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onLoadPreset(preset.id)}
                    className={cn(
                      "w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left",
                      "bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40",
                      "transition-all duration-150"
                    )}
                  >
                    <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <Separator className="my-3" />
          
          {/* Individual Blocks */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block px-1">
              Pipeline Blocks
            </span>
            <div className="space-y-1.5">
              {ANALYTICS_BLOCK_LIBRARY.map((block) => {
                const Icon = LIBRARY_ICON_MAP[block.icon] || Database;
                return (
                  <DraggableLibraryBlock
                    key={block.type}
                    block={block}
                    icon={Icon}
                    onClick={() => onAddBlock(block.type)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
