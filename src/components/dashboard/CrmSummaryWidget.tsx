import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { TaskStatus, STATUS_OPTIONS } from '@/types/crm';
import { statusConfig } from '@/components/crm/TaskStatusBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskCountByStatus {
  status: TaskStatus;
  count: number;
}

export default function CrmSummaryWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taskCounts, setTaskCounts] = useState<TaskCountByStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('status')
        .is('deleted_at', null);

      if (!error && data) {
        // Count by status
        const counts: Record<string, number> = {};
        data.forEach(task => {
          counts[task.status] = (counts[task.status] || 0) + 1;
        });
        
        const result: TaskCountByStatus[] = STATUS_OPTIONS.map(opt => ({
          status: opt.value,
          count: counts[opt.value] || 0
        })).filter(item => item.count > 0);
        
        setTaskCounts(result);
      }
      setLoading(false);
    };

    fetchTasks();
  }, [user]);

  const totalCount = useMemo(() => 
    taskCounts.reduce((sum, item) => sum + item.count, 0), 
    [taskCounts]
  );

  const openCount = useMemo(() => 
    taskCounts
      .filter(item => item.status !== 'completed' && item.status !== 'canceled')
      .reduce((sum, item) => sum + item.count, 0), 
    [taskCounts]
  );

  const handleNavigateToBackOffice = () => {
    navigate('/backoffice/tasks');
  };

  if (loading) {
    return (
      <div className="bloomberg-panel h-full">
        <div className="bloomberg-header">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="bloomberg-header-title">Open Issues</span>
        </div>
        <div className="p-3">
          <div className="animate-pulse h-12 bg-muted rounded-sm" />
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-panel h-full">
      <div className="bloomberg-header justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="bloomberg-header-title">Open Issues</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] font-mono"
          onClick={handleNavigateToBackOffice}
        >
          Open <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
      <div className="p-3 space-y-2">
        {/* Stats row with battery bar */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/30 flex-shrink-0">
            <CheckSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-shrink-0">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Open</p>
            <p className="text-lg font-bold font-mono tabular-nums">{openCount}</p>
          </div>
          
          {/* Mini Battery Bar - next to count */}
          {totalCount > 0 && (
            <TooltipProvider delayDuration={100}>
              <div className="flex-1 flex h-5 rounded overflow-hidden border border-border/50 bg-muted/30">
                {taskCounts.map((item) => {
                  const percentage = (item.count / totalCount) * 100;
                  const config = statusConfig[item.status];
                  const label = STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status;
                  
                  return (
                    <Tooltip key={item.status}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-full cursor-pointer hover:brightness-110 transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: config?.hexColor || '#6b7280',
                            minWidth: percentage > 0 ? '4px' : '0',
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-card border-border text-xs">
                        <p className="font-semibold">{label}</p>
                        <p className="text-muted-foreground">{item.count} ({percentage.toFixed(0)}%)</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* Mini Legend */}
        {totalCount > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-[52px]">
            {taskCounts.map((item) => {
              const config = statusConfig[item.status];
              const label = STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status;
              
              return (
                <div key={item.status} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-sm"
                    style={{ backgroundColor: config?.hexColor || '#6b7280' }}
                  />
                  <span className="text-[8px] font-mono text-muted-foreground">
                    {label}: {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
