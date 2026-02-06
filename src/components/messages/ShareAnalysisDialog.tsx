import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BarChart3, Search, FileText, TrendingUp, Target, FlaskConical, CheckSquare, FolderKanban, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ShareItem {
  id: string;
  title: string;
  itemType: 'analysis' | 'task' | 'project';
  subType: string;
  meta?: string | null;
  extra?: string | null;
  snapshot?: Record<string, unknown>;
}

interface ShareAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareAnalysis: (analysisId: string, analysisType: string, analysisTitle: string, snapshot?: Record<string, unknown>) => void;
}

const analysisTypeIcons: Record<string, typeof BarChart3> = {
  valuation: TrendingUp,
  research_note: FileText,
  scenario: Target,
  calculator: FlaskConical,
};

const typeLabels: Record<string, string> = {
  company: 'Company',
  valuation: 'Valuation',
  research_note: 'Research Note',
  scenario: 'Scenario',
  calculator: 'Calculator',
  question: 'Question',
};

const urgencyColors: Record<string, string> = {
  urgent: 'text-destructive',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-muted-foreground',
};

export function ShareAnalysisDialog({ open, onOpenChange, onShareAnalysis }: ShareAnalysisDialogProps) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<ShareItem[]>([]);
  const [tasks, setTasks] = useState<ShareItem[]>([]);
  const [projects, setProjects] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSearch('');
    setActiveTab('analysis');

    const fetchAll = async () => {
      // Fetch analyses (companies from CRM / Analysis page)
      const { data: companiesData } = await supabase
        .from('crm_companies')
        .select('id, company_name, ticker, status, sector, geography, thesis_summary, confidence_level')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(50);

      // Also fetch research entries
      const { data: researchData } = await supabase
        .from('company_research_entries')
        .select('id, title, entry_type, ticker, updated_at, output_summary')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      const companyItems: ShareItem[] = (companiesData || []).map(item => ({
        id: item.id,
        title: item.company_name,
        itemType: 'analysis' as const,
        subType: 'company',
        meta: item.ticker,
        snapshot: {
          ticker: item.ticker,
          status: item.status,
          sector: item.sector,
          geography: item.geography,
          description: item.thesis_summary,
          confidence: item.confidence_level,
        },
      }));

      const researchItems: ShareItem[] = (researchData || []).map(item => ({
        id: item.id,
        title: item.title,
        itemType: 'analysis' as const,
        subType: item.entry_type,
        meta: item.ticker,
        snapshot: { ticker: item.ticker, summary: item.output_summary },
      }));

      setAnalyses([...companyItems, ...researchItems]);

      // Fetch tasks
      const { data: tasksData } = await supabase
        .from('crm_tasks')
        .select('id, task_name, status, urgency, due_date, owner, description')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(50);

      setTasks((tasksData || []).map(item => ({
        id: item.id,
        title: item.task_name,
        itemType: 'task',
        subType: item.status,
        meta: item.urgency,
        extra: item.due_date,
        snapshot: { status: item.status, urgency: item.urgency, due_date: item.due_date, owner: item.owner, description: item.description },
      })));

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, status, priority, health_status, target_date, description')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(50);

      setProjects((projectsData || []).map(item => ({
        id: item.id,
        title: item.name,
        itemType: 'project',
        subType: item.status,
        meta: item.priority,
        extra: item.target_date,
        snapshot: { status: item.status, priority: item.priority, health_status: item.health_status, target_date: item.target_date, description: item.description },
      })));

      setLoading(false);
    };

    fetchAll();
  }, [open, user]);

  const getItems = () => {
    const items = activeTab === 'analysis' ? analyses : activeTab === 'task' ? tasks : projects;
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter(i => i.title.toLowerCase().includes(s) || i.meta?.toLowerCase().includes(s));
  };

  const handleShare = (item: ShareItem) => {
    const typePrefix = item.itemType === 'task' ? 'task' : item.itemType === 'project' ? 'project' : item.subType;
    onShareAnalysis(item.id, typePrefix, item.title, item.snapshot);
    onOpenChange(false);
  };

  const renderIcon = (item: ShareItem) => {
    if (item.itemType === 'task') return <CheckSquare size={14} className="text-primary" />;
    if (item.itemType === 'project') return <FolderKanban size={14} className="text-primary" />;
    const Icon = analysisTypeIcons[item.subType] || BarChart3;
    return <Icon size={14} className="text-primary" />;
  };

  const renderMeta = (item: ShareItem) => {
    if (item.itemType === 'analysis') {
      return (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-primary font-mono uppercase">{typeLabels[item.subType] || item.subType}</span>
          {item.meta && <span className="text-[10px] text-muted-foreground font-mono">{item.meta}</span>}
        </div>
      );
    }
    if (item.itemType === 'task') {
      return (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-primary font-mono uppercase">{item.subType.replace('_', ' ')}</span>
          {item.meta && item.meta !== 'none' && (
            <span className={cn("text-[10px] font-mono uppercase", urgencyColors[item.meta] || 'text-muted-foreground')}>
              {item.meta}
            </span>
          )}
          {item.extra && (
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
              <Calendar size={8} /> {format(new Date(item.extra), 'dd/MM')}
            </span>
          )}
        </div>
      );
    }
    // project
    return (
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[10px] text-primary font-mono uppercase">{item.subType}</span>
        {item.meta && <span className="text-[10px] text-muted-foreground font-mono uppercase">{item.meta}</span>}
        {item.extra && (
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
            <Calendar size={8} /> {format(new Date(item.extra), 'dd/MM')}
          </span>
        )}
      </div>
    );
  };

  const filtered = getItems();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono tracking-wider flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" />
            SHARE ITEM
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-1 border border-border rounded-md p-0.5">
            {[
              { value: 'analysis', label: 'Analysis', icon: BarChart3 },
              { value: 'task', label: 'Tasks', icon: CheckSquare },
              { value: 'project', label: 'Projects', icon: FolderKanban },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => { setActiveTab(tab.value); setSearch(''); }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded transition-colors",
                    activeTab === tab.value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon size={10} /> {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 border border-border rounded-md p-1">
            {loading && <p className="text-xs text-muted-foreground p-3 text-center">Loading...</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">No items found</p>
            )}
            {filtered.map(item => (
              <button
                key={item.id}
                onClick={() => handleShare(item)}
                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/30 transition-colors text-left"
              >
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  {renderIcon(item)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                  {renderMeta(item)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
