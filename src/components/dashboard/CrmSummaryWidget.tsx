import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckSquare, ArrowRight } from 'lucide-react';

export default function CrmSummaryWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inProgressCount, setInProgressCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('id')
        .eq('status', 'in_progress');

      if (!error) {
        setInProgressCount(data?.length || 0);
      }
      setLoading(false);
    };

    fetchTasks();
  }, [user]);

  const handleNavigateToBackOffice = () => {
    navigate('/backoffice');
  };

  if (loading) {
    return (
      <div className="bloomberg-panel h-full">
        <div className="bloomberg-header">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="bloomberg-header-title">Open Tasks</span>
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
          <span className="bloomberg-header-title">Open Tasks</span>
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
      <div className="p-3">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-sm border border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/30">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[9px] text-muted-foreground font-mono uppercase">In Progress</p>
              <p className="text-lg font-bold font-mono tabular-nums">{inProgressCount}</p>
            </div>
          </div>
          {inProgressCount > 0 && (
            <span className="text-[10px] text-warning font-mono">Action needed</span>
          )}
        </div>
      </div>
    </div>
  );
}
