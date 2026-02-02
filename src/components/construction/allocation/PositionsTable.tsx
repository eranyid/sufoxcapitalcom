import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Position, ASSET_TYPE_LABELS, REGION_LABELS, LIQUIDITY_LABELS, ASSET_TYPE_COLORS } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';

interface PositionsTableProps {
  positions: Position[];
  onUpdate: (id: string, updates: Partial<Position>) => void;
  onDelete: (id: string) => void;
}

type SortField = 'name' | 'allocation' | 'assetType' | 'region' | 'sector';
type SortDirection = 'asc' | 'desc';

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

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </div>
    </TableHead>
  );

  if (positions.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground text-sm">No positions added yet</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Click "Add Position" to get started</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <SortHeader field="name">Name</SortHeader>
            <SortHeader field="allocation">Allocation</SortHeader>
            <SortHeader field="assetType">Asset Type</SortHeader>
            <SortHeader field="region">Region</SortHeader>
            <SortHeader field="sector">Sector</SortHeader>
            <TableHead>Currency</TableHead>
            <TableHead>Liquidity</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.map((position) => (
            <TableRow key={position.id} className="hover:bg-muted/20">
              <TableCell className="font-medium">{position.name}</TableCell>
              <TableCell>
                {editingId === position.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 h-7 text-xs"
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
                      <Check size={12} className="text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                      <X size={12} className="text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => startEdit(position)}
                  >
                    <div 
                      className="h-2 rounded-full bg-primary/20"
                      style={{ 
                        width: `${Math.min(position.allocation * 2, 100)}px`,
                        backgroundColor: ASSET_TYPE_COLORS[position.assetType],
                        opacity: 0.6,
                      }}
                    />
                    <span className="font-mono text-sm">{position.allocation.toFixed(1)}%</span>
                    <Edit2 size={10} className="text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ borderColor: ASSET_TYPE_COLORS[position.assetType] }}
                >
                  {ASSET_TYPE_LABELS[position.assetType]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {REGION_LABELS[position.region]}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {position.sector}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs font-mono">
                  {position.currency}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {LIQUIDITY_LABELS[position.liquidityBucket]}
              </TableCell>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(position.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
