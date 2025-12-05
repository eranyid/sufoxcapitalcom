import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, AlertCircle, AlertTriangle, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import { DataValidationResult, DataIssue } from '@/lib/dataValidation';
import { cn } from '@/lib/utils';

interface DataWatchdogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResult: DataValidationResult | null;
  isValidating: boolean;
  onRunValidation: () => void;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

function IssueRow({ issue, onNavigate }: { issue: DataIssue; onNavigate: (route: string) => void }) {
  const getSeverityIcon = () => {
    switch (issue.severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className={cn(
      "p-3 rounded-md border",
      issue.severity === 'error' && "bg-destructive/10 border-destructive/30",
      issue.severity === 'warning' && "bg-yellow-500/10 border-yellow-500/30",
      issue.severity === 'info' && "bg-blue-500/10 border-blue-500/30"
    )}>
      <div className="flex items-start gap-2">
        {getSeverityIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-mono">
              {issue.section}
            </Badge>
            <span className="text-xs font-medium">{issue.message}</span>
          </div>
          {issue.details && (
            <p className="text-[10px] text-muted-foreground mt-1">{issue.details}</p>
          )}
        </div>
        {issue.route && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px]"
            onClick={() => onNavigate(issue.route!)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Go to
          </Button>
        )}
      </div>
    </div>
  );
}

export function DataWatchdogPanel({
  open,
  onOpenChange,
  validationResult,
  isValidating,
  onRunValidation,
  errorCount,
  warningCount,
  infoCount
}: DataWatchdogPanelProps) {
  const navigate = useNavigate();

  const handleNavigate = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  const formatLastRun = () => {
    if (!validationResult?.timestamp) return 'Never';
    const date = new Date(validationResult.timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today ${timeStr}` : `${date.toLocaleDateString()} ${timeStr}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Data Watchdog
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Last run info */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Last checked: {formatLastRun()}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRunValidation}
              disabled={isValidating}
              className="h-7 text-xs"
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", isValidating && "animate-spin")} />
              Run validation now
            </Button>
          </div>

          {/* Summary counts */}
          <div className="flex gap-2">
            <div className={cn(
              "flex-1 p-3 rounded-md text-center",
              errorCount > 0 ? "bg-destructive/20" : "bg-secondary"
            )}>
              <div className={cn(
                "text-2xl font-bold font-mono",
                errorCount > 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {errorCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Errors</div>
            </div>
            <div className={cn(
              "flex-1 p-3 rounded-md text-center",
              warningCount > 0 ? "bg-yellow-500/20" : "bg-secondary"
            )}>
              <div className={cn(
                "text-2xl font-bold font-mono",
                warningCount > 0 ? "text-yellow-500" : "text-muted-foreground"
              )}>
                {warningCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Warnings</div>
            </div>
            <div className={cn(
              "flex-1 p-3 rounded-md text-center",
              infoCount > 0 ? "bg-blue-500/20" : "bg-secondary"
            )}>
              <div className={cn(
                "text-2xl font-bold font-mono",
                infoCount > 0 ? "text-blue-400" : "text-muted-foreground"
              )}>
                {infoCount}
              </div>
              <div className="text-[10px] text-muted-foreground">Info</div>
            </div>
          </div>

          {/* Issues list */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-4">
              {validationResult?.issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldCheck className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-sm font-medium text-green-500">All data checks passed</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your portfolio data is consistent and valid.
                  </p>
                </div>
              ) : (
                validationResult?.issues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onNavigate={handleNavigate} />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Scheduled run info */}
          <div className="pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Automatic validation runs daily at 07:00 and 19:00 (local time)
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
