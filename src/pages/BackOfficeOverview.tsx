import { useState } from 'react';
import { useCrmTasks } from '@/hooks/useCrmTasks';
import { BackOfficeDashboard } from '@/components/backoffice/BackOfficeDashboard';
import { OpenIssuesWidget } from '@/components/backoffice/OpenIssuesWidget';
import { AIWatchdogPanel } from '@/components/backoffice/AIWatchdogPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function BackOfficeOverview() {
  const { tasks, loading } = useCrmTasks();
  const [watchdogOpen, setWatchdogOpen] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="text-xs text-muted-foreground">
              Dashboard summary of all issues and activity
            </p>
          </div>
        </div>

        {/* AI Watchdog Toggle Button */}
        <Collapsible open={watchdogOpen} onOpenChange={setWatchdogOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">AI Watchdog</span>
              {watchdogOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* AI Watchdog Panel - Collapsible */}
      <Collapsible open={watchdogOpen} onOpenChange={setWatchdogOpen}>
        <CollapsibleContent>
          <AIWatchdogPanel />
        </CollapsibleContent>
      </Collapsible>

      {/* Open Issues Widget with task list */}
      <OpenIssuesWidget tasks={tasks} />

      {/* Dashboard Summary */}
      <BackOfficeDashboard tasks={tasks} />
    </div>
  );
}
