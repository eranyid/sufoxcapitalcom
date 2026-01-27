import { useState } from 'react';
import { Bot, AlertCircle, AlertTriangle, Info, RefreshCw, ShieldCheck, ShieldAlert, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAIWatchdog, AIWatchdogIssue } from '@/hooks/useAIWatchdog';
import { cn } from '@/lib/utils';

function IssueItem({ issue }: { issue: AIWatchdogIssue }) {
  const [isOpen, setIsOpen] = useState(false);

  const getSeverityIcon = () => {
    switch (issue.severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getCategoryLabel = () => {
    switch (issue.category) {
      case 'suspicious_activity':
        return 'Suspicious Activity';
      case 'misinformation':
        return 'Misinformation';
      case 'illogical_data':
        return 'Illogical Data';
      default:
        return issue.category;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "p-3 rounded-md border cursor-pointer transition-colors hover:bg-secondary/50",
            issue.severity === 'critical' && "bg-destructive/10 border-destructive/30",
            issue.severity === 'warning' && "bg-yellow-500/10 border-yellow-500/30",
            issue.severity === 'info' && "bg-blue-500/10 border-blue-500/30"
          )}
        >
          <div className="flex items-start gap-2">
            {getSeverityIcon()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {getCategoryLabel()}
                </Badge>
                <span className="text-xs font-medium truncate">{issue.description}</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mt-2 p-3 bg-secondary/30 rounded-md space-y-2 text-xs">
          <div>
            <span className="text-muted-foreground">Affected: </span>
            <span className="font-medium">{issue.affected}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Recommendation: </span>
            <span>{issue.recommendation}</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AIWatchdogPanel() {
  const { isAnalyzing, lastAnalysis, runAnalysis } = useAIWatchdog();

  const criticalCount = lastAnalysis?.analysis.issues.filter(i => i.severity === 'critical').length || 0;
  const warningCount = lastAnalysis?.analysis.issues.filter(i => i.severity === 'warning').length || 0;
  const infoCount = lastAnalysis?.analysis.issues.filter(i => i.severity === 'info').length || 0;
  const score = lastAnalysis?.analysis.clean_data_score ?? null;

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getScoreIcon = () => {
    if (!lastAnalysis) return <Eye className="h-5 w-5 text-muted-foreground" />;
    if (criticalCount > 0) return <ShieldAlert className="h-5 w-5 text-destructive" />;
    if (warningCount > 0) return <ShieldAlert className="h-5 w-5 text-yellow-500" />;
    return <ShieldCheck className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className="bloomberg-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Data Watchdog</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runAnalysis()}
          disabled={isAnalyzing}
          className="h-7 text-xs"
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isAnalyzing && "animate-spin")} />
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Score Display */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-secondary/30 rounded-md">
        {getScoreIcon()}
        <div className="flex-1">
          <div className="text-xs text-muted-foreground">Data Integrity Score</div>
          <div className={cn("text-2xl font-bold font-mono", score !== null ? getScoreColor(score) : 'text-muted-foreground')}>
            {score !== null ? `${score}/100` : '—'}
          </div>
        </div>
        {lastAnalysis && (
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-500">
                {warningCount} Warning
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-400">
                {infoCount} Info
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {lastAnalysis?.analysis.summary && (
        <div className="mb-4 p-3 bg-card rounded-md border">
          <div className="text-[10px] text-muted-foreground mb-1">AI Summary</div>
          <p className="text-xs">{lastAnalysis.analysis.summary}</p>
        </div>
      )}

      {/* Issues List */}
      {lastAnalysis?.analysis.issues && lastAnalysis.analysis.issues.length > 0 ? (
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-4">
            {lastAnalysis.analysis.issues.map((issue, idx) => (
              <IssueItem key={idx} issue={issue} />
            ))}
          </div>
        </ScrollArea>
      ) : lastAnalysis ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ShieldCheck className="h-10 w-10 text-green-500 mb-2" />
          <p className="text-sm font-medium text-green-500">All Clear</p>
          <p className="text-xs text-muted-foreground mt-1">
            No suspicious activity or data issues detected.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bot className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click "Run Analysis" to start</p>
          <p className="text-xs text-muted-foreground mt-1">
            AI will scan for suspicious activity, misinformation, and data inconsistencies.
          </p>
        </div>
      )}

      {/* Last analyzed timestamp */}
      {lastAnalysis?.analyzedAt && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Last analyzed: {new Date(lastAnalysis.analyzedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
