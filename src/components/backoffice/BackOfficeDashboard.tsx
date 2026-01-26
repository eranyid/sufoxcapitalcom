import { CrmTask } from '@/types/crm';
import { TaskOverviewStats } from './TaskOverviewStats';
import { UrgencyDistributionChart } from './UrgencyDistributionChart';
import { UpcomingDueDates } from './UpcomingDueDates';
import { RecentActivityFeed } from './RecentActivityFeed';

interface BackOfficeDashboardProps {
  tasks: CrmTask[];
}

export function BackOfficeDashboard({ tasks }: BackOfficeDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <TaskOverviewStats tasks={tasks} />
      
      {/* Secondary Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UrgencyDistributionChart tasks={tasks} />
        <UpcomingDueDates tasks={tasks} />
        <RecentActivityFeed />
      </div>
    </div>
  );
}
