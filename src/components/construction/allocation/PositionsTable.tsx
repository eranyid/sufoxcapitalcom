import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, Edit2, Check, X, ArrowUpDown, ArrowDown, ArrowUp, TrendingUp } from 'lucide-react';
import { Position, ASSET_TYPE_LABELS, REGION_LABELS, LIQUIDITY_LABELS, ASSET_TYPE_COLORS } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';

interface PositionsTableProps {
  positions: Position[];
  onUpdate: (id: string, updates: Partial<Position>) => void;
  onDelete: (id: string) => void;
}

type SortField = 'name' | 'allocation' | 'assetType' | 'region' | 'sector';
type SortDirection = 'asc' | 'desc';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('allocation');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPositions = [...positions].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'allocation':
        comparison = a.allocation - b.allocation;
        break;
      case 'assetType':
        comparison = a.assetType.localeCompare(b.assetType);
        break;
      case 'region':
        comparison = a.region.localeCompare(b.region);
        break;
      case 'sector':
        comparison = a.sector.localeCompare(b.sector);
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const startEdit = (position: Position) => {
    setEditingId(position.id);
    setEditValue(position.allocation.toString());
  };

  const saveEdit = (id: string) => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
      onUpdate(id, { allocation: newValue });
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button 
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium transition-colors",
        sortField === field ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
      ) : (
        <ArrowUpDown size={12} className="opacity-40" />
      )}
    </button>
  );

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
        <div className="col-span-2">
          <SortButton field="name">Name</SortButton>
        </div>
        <div className="col-span-2">
          <SortButton field="allocation">Weight</SortButton>
        </div>
        <div className="col-span-2">
          <SortButton field="assetType">Asset Class</SortButton>
        </div>
        <div className="col-span-2">
          <SortButton field="region">Geography</SortButton>
        </div>
        <div className="col-span-1">
          <span className="text-muted-foreground">CCY</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Liquidity</span>
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
              "grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors group",
              "hover:bg-muted/20",
              index % 2 === 0 ? "bg-transparent" : "bg-muted/5"
            )}
          >
            {/* Name */}
            <div className="col-span-2">
              <span className="font-medium text-sm truncate block">{position.name}</span>
            </div>

            {/* Allocation */}
            <div className="col-span-2">
              {editingId === position.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-16 h-7 text-xs font-mono"
                    min={0}
                    max={100}
                    step={0.1}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(position.id);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => saveEdit(position.id)}>
                    <Check size={12} className="text-emerald-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                    <X size={12} className="text-destructive" />
                  </Button>
                </div>
              ) : (
                <button 
                  className="flex items-center gap-2 group/edit"
                  onClick={() => startEdit(position)}
                >
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(position.allocation * 2, 100)}%`,
                        backgroundColor: ASSET_TYPE_COLORS[position.assetType],
                      }}
                    />
                  </div>
                  <span className="font-mono text-sm font-medium">{position.allocation.toFixed(1)}%</span>
                  <Edit2 size={10} className="text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                </button>
              )}
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

            {/* Region */}
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">
                {REGION_LABELS[position.region]}
              </span>
            </div>

            {/* Currency */}
            <div className="col-span-1">
              <Badge variant="secondary" className="text-[10px] font-mono bg-muted/50">
                {position.currency}
              </Badge>
            </div>

            {/* Liquidity */}
            <div className="col-span-2">
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-md",
                position.liquidityBucket === 'highly_liquid' && "bg-emerald-500/10 text-emerald-400",
                position.liquidityBucket === 'liquid' && "bg-blue-500/10 text-blue-400",
                position.liquidityBucket === 'semi_liquid' && "bg-amber-500/10 text-amber-400",
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
        <span className="text-xs font-mono font-medium">
          Total: {positions.reduce((sum, p) => sum + p.allocation, 0).toFixed(1)}%
        </span>
      </div>
    </Card>
  );
}
