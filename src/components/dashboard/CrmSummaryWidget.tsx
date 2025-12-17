import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, CheckSquare, Building2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CrmSummary {
  pendingTasksCount: number;
  recentCompanies: Array<{
    id: string;
    company_name: string;
    group_name: string;
    created_at: string;
  }>;
}

export default function CrmSummaryWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<CrmSummary>({ pendingTasksCount: 0, recentCompanies: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSummary = async () => {
      setLoading(true);
      
      // Fetch in-progress tasks only
      const { data: tasks, error: tasksError } = await supabase
        .from('crm_tasks')
        .select('id, status')
        .eq('status', 'in_progress');

      // Fetch recent potential companies (last 5)
      const { data: companies, error: companiesError } = await supabase
        .from('crm_companies')
        .select('id, company_name, group_name, created_at')
        .eq('group_name', 'potential')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!tasksError && !companiesError) {
        setSummary({
          pendingTasksCount: tasks?.length || 0,
          recentCompanies: companies || [],
        });
      }
      setLoading(false);
    };

    fetchSummary();
  }, [user]);

  const handleNavigateToCrm = () => {
    navigate('/crm');
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            CRM Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            CRM Summary
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
      <CardContent className="space-y-4">
        {/* Pending Tasks */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded">
              <CheckSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">In Progress</p>
              <p className="text-lg font-bold font-mono tabular-nums">{summary.pendingTasksCount}</p>
            </div>
          </div>
          {summary.pendingTasksCount > 0 && (
            <span className="text-xs text-yellow-500 font-mono">Action needed</span>
          )}
        </div>

        {/* Recent Potential Companies */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-mono uppercase">Recent Potential Companies</p>
          </div>
          {summary.recentCompanies.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No potential companies yet</p>
          ) : (
            <div className="space-y-1.5">
              {summary.recentCompanies.slice(0, 3).map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-background border border-border/50 hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm font-medium truncate max-w-[150px]">{company.company_name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(company.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
