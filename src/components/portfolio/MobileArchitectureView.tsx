import { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DetailsData {
  type: 'asset-class' | 'sector' | 'position';
  name: string;
  weight: number;
  value: number;
  ticker?: string;
  plPercent?: number;
}

interface RingSegment {
  id: string;
  name: string;
  value: number;
  weight: number;
  color: string;
  ticker?: string;
  plPercent?: number;
}

interface MobileArchitectureViewProps {
  assetClasses: RingSegment[];
  sectors: RingSegment[];
  positions: RingSegment[];
  onItemClick: (data: DetailsData) => void;
}

export function MobileArchitectureView({
  assetClasses,
  sectors,
  positions,
  onItemClick
}: MobileArchitectureViewProps) {
  const [openSections, setOpenSections] = useState<string[]>(['asset-classes']);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const renderItem = (
    item: RingSegment,
    type: 'asset-class' | 'sector' | 'position',
    index: number
  ) => (
    <button
      key={item.id}
      onClick={() => onItemClick({
        type,
        name: item.name,
        weight: item.weight,
        value: item.value,
        ticker: item.ticker,
        plPercent: item.plPercent
      })}
      className={cn(
        "w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg",
        "hover:bg-muted/50 transition-colors text-left",
        "animate-in fade-in slide-in-from-left-2"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            {item.ticker || item.name}
          </p>
          {item.ticker && (
            <p className="text-xs text-muted-foreground">{item.name}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-mono text-foreground">{item.weight.toFixed(1)}%</p>
        <div className="flex items-center justify-end gap-1">
          {item.plPercent !== undefined ? (
            <>
              {item.plPercent >= 0 ? (
                <TrendingUp size={10} className="text-green-500" />
              ) : (
                <TrendingDown size={10} className="text-red-500" />
              )}
              <span className={cn(
                "text-xs font-mono",
                item.plPercent >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {item.plPercent >= 0 ? '+' : ''}{item.plPercent.toFixed(1)}%
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground font-mono">
              {formatValue(item.value)}
            </span>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Core Section */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-4 border border-primary/30">
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-wider text-primary font-mono">
            Portfolio Architecture
          </span>
          <h3 className="text-lg font-semibold text-foreground mt-1">Strategy Core</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Investment doctrine & capital-allocation DNA
          </p>
        </div>
      </div>

      {/* Asset Classes */}
      <Collapsible
        open={openSections.includes('asset-classes')}
        onOpenChange={() => toggleSection('asset-classes')}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              {openSections.includes('asset-classes') ? (
                <ChevronDown size={16} className="text-primary" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Asset Classes</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {assetClasses.length} categories
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {assetClasses.map((item, idx) => renderItem(item, 'asset-class', idx))}
        </CollapsibleContent>
      </Collapsible>

      {/* Sectors */}
      <Collapsible
        open={openSections.includes('sectors')}
        onOpenChange={() => toggleSection('sectors')}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              {openSections.includes('sectors') ? (
                <ChevronDown size={16} className="text-primary" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Sectors & Themes</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {sectors.length} sectors
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {sectors.map((item, idx) => renderItem(item, 'sector', idx))}
        </CollapsibleContent>
      </Collapsible>

      {/* Positions */}
      <Collapsible
        open={openSections.includes('positions')}
        onOpenChange={() => toggleSection('positions')}
      >
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              {openSections.includes('positions') ? (
                <ChevronDown size={16} className="text-primary" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
              <span className="text-sm font-medium">Positions</span>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {positions.length} holdings
            </span>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {positions.map((item, idx) => renderItem(item, 'position', idx))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
