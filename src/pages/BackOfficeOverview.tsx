import { useCrmTasks } from '@/hooks/useCrmTasks';
import { BackOfficeDashboard } from '@/components/backoffice/BackOfficeDashboard';
import { StatusDistributionBattery } from '@/components/crm/StatusDistributionBattery';
import { OpenIssuesWidget } from '@/components/backoffice/OpenIssuesWidget';
import { AIWatchdogPanel } from '@/components/backoffice/AIWatchdogPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard } from 'lucide-react';

export default function BackOfficeOverview() {
  const { tasks, loading } = useCrmTasks();

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
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <p className="text-xs text-muted-foreground">
            Dashboard summary of all issues and activity
          </p>
        </div>
      </div>

      {/* AI Watchdog Panel */}
      <AIWatchdogPanel />

      {/* Open Issues Widget with task list */}
      <OpenIssuesWidget tasks={tasks} />

      {/* Dashboard Summary */}
      <BackOfficeDashboard tasks={tasks} />

      {/* Status Distribution Battery */}
      <StatusDistributionBattery tasks={tasks} />
    </div>
  );
}
