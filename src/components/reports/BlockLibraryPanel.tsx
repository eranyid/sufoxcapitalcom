import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BLOCK_LIBRARY, BlockLibraryItem, ReportBlockType } from '@/types/reportBuilder';
import { cn } from '@/lib/utils';
import { 
  Image, Type, Text, FileText, LayoutDashboard, TrendingUp, Calendar,
  BarChart3, ArrowUpDown, PieChart, Coins, Globe, Layers, Shield,
  Zap, Table, ArrowRightLeft, PanelBottom, SplitSquareHorizontal, 
  Maximize2, Box, LucideProps
} from 'lucide-react';
import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

const ICON_MAP: Record<string, LucideIcon> = {
  Image, Type, Text, FileText, LayoutDashboard, TrendingUp, Calendar,
  BarChart3, ArrowUpDown, PieChart, Coins, Globe, Layers, Shield,
  Zap, Table, ArrowRightLeft, PanelBottom, SplitSquareHorizontal, 
  Maximize2, Box, Scatter: BarChart3,
};

interface DraggableBlockProps {
  item: BlockLibraryItem;
  onAdd: (type: ReportBlockType) => void;
  isMobile?: boolean;
}

function DraggableBlock({ item, onAdd, isMobile }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${item.type}`,
    data: { type: item.type, isLibraryItem: true },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const IconComponent = ICON_MAP[item.icon] || Box;

  if (isMobile) {
    return (
      <button
        onClick={() => onAdd(item.type)}
        className={cn(
          "flex-shrink-0 flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border border-border",
          "hover:border-primary/50 hover:bg-muted/50 transition-all",
          "w-20 h-20"
        )}
      >
        <div className="p-2 rounded bg-muted/50">
          <IconComponent size={16} className="text-muted-foreground" />
        </div>
        <p className="text-[10px] font-medium text-center leading-tight line-clamp-2">{item.label}</p>
      </button>
    );
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onAdd(item.type)}
      className={cn(
        "w-full text-left p-3 rounded-lg border border-border transition-all",
        "hover:border-primary/50 hover:bg-muted/50 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded bg-muted/50">
          <IconComponent size={16} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        </div>
      </div>
    </button>
  );
}

interface BlockLibraryPanelProps {
  onAddBlock: (type: ReportBlockType) => void;
}

export function BlockLibraryPanel({ onAddBlock }: BlockLibraryPanelProps) {
  const isMobile = useIsMobile();

  const categories = {
    header: 'Headers',
    content: 'Content',
    data: 'Data Blocks',
    layout: 'Layout',
  };

  const blocksByCategory = BLOCK_LIBRARY.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BlockLibraryItem[]>);

  // Mobile: horizontal scrollable strip at bottom
  if (isMobile) {
    return (
      <div className="flex-shrink-0 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="px-3 py-2 border-b border-border/50">
          <h3 className="text-xs font-medium text-muted-foreground">Add Block</h3>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 p-3">
            {BLOCK_LIBRARY.map(item => (
              <DraggableBlock
                key={item.type}
                item={item}
                onAdd={onAddBlock}
                isMobile={true}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  }

  // Desktop: vertical sidebar
  return (
    <div className="w-72 border-r border-border bg-card/50 flex flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium">Block Library</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Click or drag to add blocks
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {Object.entries(categories).map(([key, label]) => (
            <div key={key}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {label}
              </h4>
              <div className="space-y-2">
                {blocksByCategory[key]?.map(item => (
                  <DraggableBlock
                    key={item.type}
                    item={item}
                    onAdd={onAddBlock}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
