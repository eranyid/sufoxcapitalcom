import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, PieChart, BarChart3, Globe2, Droplets } from 'lucide-react';
import { Position } from '@/types/allocationBuilder';
import { AllocationDonutChart } from '@/components/construction/allocation/AllocationDonutChart';
import { ExposureBarChart } from '@/components/construction/allocation/ExposureBarChart';
import { cn } from '@/lib/utils';

interface PipelineAllocationStepProps {
  positions: Position[];
  totalAllocation: number;
  isBalanced: boolean;
}

export function PipelineAllocationStep({ positions, totalAllocation, isBalanced }: PipelineAllocationStepProps) {
  const isOver = totalAllocation > 100;

  return (
    <div className="space-y-4">
      {/* Validation Banner */}
      <Card className={cn(
        "border-2",
        isBalanced 
          ? "border-emerald-500/30 bg-emerald-500/5" 
          : isOver 
            ? "border-destructive/30 bg-destructive/5"
            : "border-amber-500/30 bg-amber-500/5"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isBalanced ? "bg-emerald-500/20" : isOver ? "bg-destructive/20" : "bg-amber-500/20"
            )}>
              {isBalanced ? (
                <CheckCircle2 className="text-emerald-400" size={24} />
              ) : (
                <AlertTriangle className={isOver ? "text-destructive" : "text-amber-400"} size={24} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className={cn(
                  "text-lg font-bold",
                  isBalanced ? "text-emerald-400" : isOver ? "text-destructive" : "text-amber-400"
                )}>
                  {isBalanced ? 'Allocation Balanced' : isOver ? 'Over-Allocated' : 'Under-Allocated'}
                </h3>
                <Badge variant="outline" className={cn(
                  "font-mono",
                  isBalanced ? "border-emerald-500/50 text-emerald-400" : 
                  isOver ? "border-destructive/50 text-destructive" : 
                  "border-amber-500/50 text-amber-400"
                )}>
                  {totalAllocation.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isBalanced 
                  ? 'Your allocation totals 100%. You can proceed to analysis.' 
                  : isOver 
                    ? `You need to reduce allocation by ${(totalAllocation - 100).toFixed(1)}%`
                    : `You need to add ${(100 - totalAllocation).toFixed(1)}% more allocation`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart size={14} className="text-primary" />
              Asset Class Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonutChart 
              positions={positions} 
              groupBy="assetType"
              title=""
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 size={14} className="text-primary" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonutChart 
              positions={positions} 
              groupBy="region"
              title=""
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplets size={14} className="text-primary" />
              Liquidity Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationDonutChart 
              positions={positions} 
              groupBy="liquidityBucket"
              title=""
            />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              Position Weights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExposureBarChart positions={positions} maxBars={10} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
