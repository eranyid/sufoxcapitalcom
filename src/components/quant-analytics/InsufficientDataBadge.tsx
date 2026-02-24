import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InsufficientDataBadgeProps {
  minDays: number;
  actualDays?: number;
}

export function InsufficientDataBadge({ minDays, actualDays }: InsufficientDataBadgeProps) {
  return (
    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 gap-1">
      <AlertTriangle className="h-3 w-3" />
      Insufficient data: need {minDays}+ trading days
      {actualDays !== undefined && ` (have ${actualDays})`}
    </Badge>
  );
}
