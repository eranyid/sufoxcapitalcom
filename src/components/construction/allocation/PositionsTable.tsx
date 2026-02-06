import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Trash2, TrendingUp, Minus, Plus, GripVertical } from 'lucide-react';
import { Position, ASSET_TYPE_LABELS, REGION_LABELS, LIQUIDITY_LABELS, ASSET_TYPE_COLORS } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';

interface PositionsTableProps {
  positions: Position[];
  onUpdate: (id: string, updates: Partial<Position>) => void;
  onDelete: (id: string) => void;
}


const ASSET_TYPE_STYLES: Record<string, string> = {
  equity: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  fixed_income: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  real_estate: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  commodities: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  alternatives: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  cash: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  crypto: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

export function PositionsTable({ positions, onUpdate, onDelete }: PositionsTableProps) {
  const [activeSlider, setActiveSlider] = useState<string | null>(null);

  // No sorting — maintain insertion order
  const sortedPositions = positions;

  const handleAllocationChange = (id: string, newValue: number) => {
    const clampedValue = Math.max(0, Math.min(100, newValue));
    onUpdate(id, { allocation: Number(clampedValue.toFixed(1)) });
  };

  const incrementAllocation = (position: Position, delta: number) => {
    const newValue = position.allocation + delta;
    handleAllocationChange(position.id, newValue);
  };


  if (positions.length === 0) {
    return (
      <Card className="border-dashed border-2 p-8 text-center">
        <TrendingUp className="mx-auto mb-3 text-muted-foreground/50" size={32} />
        <p className="text-muted-foreground text-sm">No positions added yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Click "Add Position" to get started</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/30 border-b border-border/50 text-xs">
        <div className="col-span-3">
          <span className="text-muted-foreground font-medium">Name</span>
        </div>
        <div className="col-span-4">
          <span className="text-muted-foreground font-medium">Allocation</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground font-medium">Class</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground font-medium">Liquidity</span>
        </div>
        <div className="col-span-1 text-right">
          <span className="text-muted-foreground sr-only">Actions</span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {sortedPositions.map((position, index) => (
          <div 
            key={position.id} 
            className={cn(
              "grid grid-cols-12 gap-2 px-4 py-3.5 items-center transition-all group",
              "hover:bg-muted/20",
              index % 2 === 0 ? "bg-transparent" : "bg-muted/5",
              activeSlider === position.id && "bg-primary/5 ring-1 ring-primary/20"
            )}
          >
            {/* Name & Region */}
            <div className="col-span-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-muted-foreground/30 cursor-grab" />
                <div className="min-w-0">
                  <span className="font-medium text-sm truncate block">{position.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {REGION_LABELS[position.region]} • {position.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Allocation Controls */}
            <div className="col-span-4">
              <div className="flex items-center gap-2">
                {/* Minus Button */}
                <Button
                  size="icon"
                  variant="outline"
                  className={cn(
                    "h-7 w-7 rounded-full border-border/50 transition-all",
                    "hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive",
                    "active:scale-95"
                  )}
                  onClick={() => incrementAllocation(position, -1)}
                  disabled={position.allocation <= 0}
                >
                  <Minus size={12} />
                </Button>

                {/* Slider */}
                <div className="flex-1 flex items-center gap-2">
                  <Slider
                    value={[position.allocation]}
                    onValueChange={([value]) => handleAllocationChange(position.id, value)}
                    onValueCommit={() => setActiveSlider(null)}
                    onPointerDown={() => setActiveSlider(position.id)}
                    max={50}
                    min={0}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className={cn(
                    "font-mono text-sm font-bold w-12 text-right tabular-nums transition-colors",
                    position.allocation >= 20 ? "text-amber-400" : 
                    position.allocation >= 10 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {position.allocation.toFixed(1)}%
                  </span>
                </div>

                {/* Plus Button */}
                <Button
                  size="icon"
                  variant="outline"
                  className={cn(
                    "h-7 w-7 rounded-full border-border/50 transition-all",
                    "hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500",
                    "active:scale-95"
                  )}
                  onClick={() => incrementAllocation(position, 1)}
                  disabled={position.allocation >= 100}
                >
                  <Plus size={12} />
                </Button>
              </div>
            </div>

            {/* Asset Type */}
            <div className="col-span-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px] font-medium border",
                  ASSET_TYPE_STYLES[position.assetType] || 'bg-muted/50 text-muted-foreground'
                )}
              >
                {ASSET_TYPE_LABELS[position.assetType]}
              </Badge>
            </div>

            {/* Liquidity */}
            <div className="col-span-2">
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-md font-medium",
                position.liquidityBucket === 'highly_liquid' && "bg-emerald-500/10 text-emerald-400",
                position.liquidityBucket === 'liquid' && "bg-blue-500/10 text-blue-400",
                position.liquidityBucket === 'semi_liquid' && "bg-amber-500/10 text-amber-400",
                position.liquidityBucket === 'illiquid' && "bg-orange-500/10 text-orange-400",
                position.liquidityBucket === 'locked' && "bg-red-500/10 text-red-400",
              )}>
                {LIQUIDITY_LABELS[position.liquidityBucket]}
              </span>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(position.id)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Summary */}
      <div className="px-4 py-2.5 bg-muted/20 border-t border-border/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {positions.length} position{positions.length !== 1 ? 's' : ''} 
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">Drag slider or use +/- buttons</span>
          <span className="text-xs font-mono font-medium">
            Total: {positions.reduce((sum, p) => sum + p.allocation, 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
}
