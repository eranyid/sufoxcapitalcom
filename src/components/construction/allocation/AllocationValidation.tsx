import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, AlertTriangle, Percent } from 'lucide-react';
import { validateAllocation, calculateTotalAllocation } from '@/lib/allocationAnalytics';
import { Position } from '@/types/allocationBuilder';
import { cn } from '@/lib/utils';

interface AllocationValidationProps {
  positions: Position[];
}

export function AllocationValidation({ positions }: AllocationValidationProps) {
  const { isValid, total, deviation } = validateAllocation(positions);
  const positionCount = positions.length;

  return (
    <Card className={cn(
      "bg-card border transition-colors",
      isValid ? "border-green-500/30" : "border-amber-500/30"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isValid ? "bg-green-500/10" : "bg-amber-500/10"
            )}>
              {isValid ? (
                <CheckCircle2 className="text-green-500" size={20} />
              ) : (
                <AlertTriangle className="text-amber-500" size={20} />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total Allocation</span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "font-mono text-xs",
                    isValid ? "border-green-500/40 text-green-500" : "border-amber-500/40 text-amber-500"
                  )}
                >
                  {total.toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {positionCount} position{positionCount !== 1 ? 's' : ''} • 
                {isValid ? ' Balanced' : ` ${deviation > 0 ? 'Over' : 'Under'} by ${Math.abs(deviation).toFixed(1)}%`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-32">
              <Progress 
                value={Math.min(total, 100)} 
                className={cn(
                  "h-2",
                  total > 100 && "[&>div]:bg-destructive"
                )}
              />
            </div>
            <Percent size={16} className="text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
