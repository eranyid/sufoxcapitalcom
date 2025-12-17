import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const handleNavigateToCrm = () => {
    navigate('/crm');
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Open Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-12 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Open Tasks
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-mono"
            onClick={handleNavigateToCrm}
          >
            Open <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">In Progress</p>
              <p className="text-lg font-bold font-mono tabular-nums">{inProgressCount}</p>
            </div>
          </div>
          {inProgressCount > 0 && (
            <span className="text-xs text-yellow-500 font-mono">Action needed</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
