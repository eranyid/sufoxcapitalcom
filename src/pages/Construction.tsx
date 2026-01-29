import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConstructionWizard } from '@/components/construction/ConstructionWizard';
import { useTargetAllocation } from '@/hooks/useTargetAllocation';
import { Compass, Target, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Construction() {
  const { activeTarget, isLoading } = useTargetAllocation();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Compass className="text-primary" size={24} />
            Portfolio Construction
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build your target allocation strategy
          </p>
        </div>

        {activeTarget && !isLoading && (
          <Card className="bg-card border-border">
            <CardContent className="py-3 px-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-primary" />
                <span className="text-xs text-muted-foreground">Active Target:</span>
                <span className="text-sm font-medium">{activeTarget.name}</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {activeTarget.objective}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={10} />
                {format(new Date(activeTarget.updated_at), 'MMM d, yyyy')}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Wizard */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">
            Target Allocation Wizard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConstructionWizard />
        </CardContent>
      </Card>
    </div>
  );
}
