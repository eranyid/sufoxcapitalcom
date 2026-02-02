import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, RotateCcw, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Position, ASSET_TYPE_LABELS, ASSET_TYPE_COLORS } from '@/types/allocationBuilder';
import { AddPositionDialog } from '@/components/construction/allocation/AddPositionDialog';
import { PositionsTable } from '@/components/construction/allocation/PositionsTable';
import { cn } from '@/lib/utils';

interface PipelinePositionsStepProps {
  positions: Position[];
  totalAllocation: number;
  onAdd: (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<Position>) => void;
  onDelete: (id: string) => void;
  onLoadSample: () => void;
  onClear: () => void;
}

export function PipelinePositionsStep({
  positions,
  totalAllocation,
  onAdd,
  onUpdate,
  onDelete,
  onLoadSample,
  onClear,
}: PipelinePositionsStepProps) {
  const isBalanced = Math.abs(totalAllocation - 100) < 0.01;
  const isOver = totalAllocation > 100;

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn(
          "border-2",
          isBalanced 
            ? "border-emerald-500/30 bg-emerald-500/5" 
            : isOver 
              ? "border-destructive/30 bg-destructive/5"
              : "border-amber-500/30 bg-amber-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Allocation</p>
                <p className={cn(
                  "text-2xl font-mono font-bold",
                  isBalanced ? "text-emerald-400" : isOver ? "text-destructive" : "text-amber-400"
                )}>
                  {totalAllocation.toFixed(1)}%
                </p>
              </div>
              {isBalanced ? (
                <CheckCircle2 className="text-emerald-500" size={24} />
              ) : (
                <AlertCircle className={isOver ? "text-destructive" : "text-amber-500"} size={24} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Positions</p>
            <p className="text-2xl font-mono font-bold">{positions.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={cn(
              "text-2xl font-mono font-bold",
              totalAllocation > 100 ? "text-destructive" : "text-muted-foreground"
            )}>
              {(100 - totalAllocation).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center justify-center gap-2">
            <AddPositionDialog onAdd={onAdd} existingAllocation={totalAllocation} />
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onLoadSample} className="text-xs">
          <RotateCcw size={14} className="mr-1.5" />
          Load Sample Data
        </Button>
        {positions.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} className="mr-1.5" />
            Clear All
          </Button>
        )}
      </div>

      {/* Positions Table */}
      {positions.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="py-12 text-center">
            <Layers className="mx-auto mb-4 text-muted-foreground/50" size={48} />
            <h3 className="text-lg font-medium mb-2">No Positions Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Start building your target allocation by adding positions or load sample data to explore the pipeline.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={onLoadSample}>
                <RotateCcw size={14} className="mr-2" />
                Load Sample
              </Button>
              <AddPositionDialog onAdd={onAdd} existingAllocation={totalAllocation} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <PositionsTable 
          positions={positions}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}

      {/* Allocation Bar */}
      {positions.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border border-border/50">
          <span className="text-xs text-muted-foreground shrink-0">Progress to 100%:</span>
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-700 rounded-full",
                isBalanced 
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                  : isOver 
                    ? "bg-gradient-to-r from-destructive to-red-400"
                    : "bg-gradient-to-r from-primary to-blue-400"
              )}
              style={{ width: `${Math.min(totalAllocation, 100)}%` }}
            />
          </div>
          <span className={cn(
            "text-sm font-mono font-bold shrink-0",
            isBalanced ? "text-emerald-400" : isOver ? "text-destructive" : "text-primary"
          )}>
            {totalAllocation.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
}
