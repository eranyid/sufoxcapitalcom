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
  TrendingDown,
  Table,
  Grid3X3,
  Sparkles,
  Filter,
  Layers,
  GitCompare,
  Activity,
  Shield,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANALYTICS_BLOCK_LIBRARY, QUICK_PRESETS, PRESET_CATEGORIES, AnalyticsBlockType } from '@/types/analyticsLab';
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
  TrendingDown,
  Table,
  Grid3x3: Grid3X3,
  Filter,
  Layers,
  GitCompare,
  Activity,
  Shield,
  AlertTriangle,
  BarChart2,
};

interface LabBlockLibraryProps {
  onAddBlock: (type: AnalyticsBlockType) => void;
  onLoadPreset: (presetId: string) => void;
}

export function LabBlockLibrary({ onAddBlock, onLoadPreset }: LabBlockLibraryProps) {
  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
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
          {/* Quick Presets - Grouped by category */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quick Presets
              </span>
            </div>
            
            {PRESET_CATEGORIES.map((category) => {
              const categoryPresets = QUICK_PRESETS.filter(p => p.category === category.id);
              if (categoryPresets.length === 0) return null;
              
              return (
                <div key={category.id} className="mb-3">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block px-1">
                    {category.label}
                  </span>
                  <div className="space-y-1.5">
                    {categoryPresets.map((preset) => {
                      const Icon = LIBRARY_ICON_MAP[preset.icon] || BarChart3;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => onLoadPreset(preset.id)}
                          className={cn(
                            "group w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left",
                            "bg-primary/5 hover:bg-primary/15 border border-primary/20 hover:border-primary/50",
                            "transition-all duration-200 hover:shadow-sm hover:shadow-primary/10",
                            "active:scale-[0.98]"
                          )}
                        >
                          <div className="p-1 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
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
              );
            })}
          </div>
          
          <Separator className="my-3" />
          
          {/* Individual Blocks - Grouped by category */}
          {['input', 'transform', 'analysis', 'output'].map((category) => {
            const categoryBlocks = ANALYTICS_BLOCK_LIBRARY.filter(b => b.category === category);
            if (categoryBlocks.length === 0) return null;
            
            const categoryLabels: Record<string, string> = {
              input: 'Input',
              transform: 'Transform',
              analysis: 'Analysis',
              output: 'Output',
            };
            
            return (
              <div key={category} className="mb-3">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block px-1">
                  {categoryLabels[category]}
                </span>
                <div className="space-y-1">
                  {categoryBlocks.map((block) => {
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
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
