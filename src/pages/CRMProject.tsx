import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Landmark, CheckSquare, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { CrmProject, ProjectStatus } from '@/types/crm';
import { toast } from 'sonner';
import ProjectCompaniesBoard from '@/components/crm/ProjectCompaniesBoard';
import ProjectFundsBoard from '@/components/crm/ProjectFundsBoard';
import ProjectTasksBoard from '@/components/crm/ProjectTasksBoard';

export default function CRMProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<CrmProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('companies');

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      const { data, error } = await supabase
        .from('crm_projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (error) {
        toast.error('Failed to load project');
        console.error(error);
        navigate('/crm');
        return;
      }

      if (!data) {
        toast.error('Project not found');
        navigate('/crm');
        return;
      }

      setProject(data as CrmProject);
      setLoading(false);
    };

    fetchProject();
  }, [projectId, navigate]);

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'monitoring': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'archived': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-12 w-full bg-muted animate-pulse rounded" />
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/crm')}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          {project.start_date && (
            <p className="text-sm text-muted-foreground mt-1">
              Started {new Date(project.start_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="companies" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
          >
            <Building2 size={16} />
            Companies
          </TabsTrigger>
          <TabsTrigger 
            value="funds" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
          >
            <Landmark size={16} />
            Funds
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
          >
            <CheckSquare size={16} />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="mt-6">
          <ProjectCompaniesBoard projectId={project.id} />
        </TabsContent>

        <TabsContent value="funds" className="mt-6">
          <ProjectFundsBoard projectId={project.id} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <ProjectTasksBoard projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
