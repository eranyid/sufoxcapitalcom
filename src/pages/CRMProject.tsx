import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Landmark, CheckSquare, Plus, MoreHorizontal, Pencil, Trash2, FolderKanban, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmProject, ProjectStatus, PROJECT_STATUS_OPTIONS } from '@/types/crm';
import { toast } from 'sonner';
import ProjectCompaniesBoard from '@/components/crm/ProjectCompaniesBoard';
import ProjectFundsBoard from '@/components/crm/ProjectFundsBoard';
import ProjectTasksBoard from '@/components/crm/ProjectTasksBoard';
import ProjectTimeline from '@/components/crm/ProjectTimeline';
import CrossSystemActivityLog from '@/components/crm/CrossSystemActivityLog';

const LAST_PROJECT_KEY = 'crm_last_project_id';

export default function CRMProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<CrmProject | null>(null);
  const [allProjects, setAllProjects] = useState<CrmProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'companies');
  
  // Edit/Delete state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Create new project state
  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('active');

  // Save last opened project
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(LAST_PROJECT_KEY, projectId);
    }
  }, [projectId]);

  // Fetch project and all projects for switcher
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !user) return;
      
      const [projectRes, allProjectsRes] = await Promise.all([
        supabase
          .from('crm_projects')
          .select('*')
          .eq('id', projectId)
          .maybeSingle(),
        supabase
          .from('crm_projects')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
      ]);

      if (projectRes.error || !projectRes.data) {
        toast.error('Project not found');
        navigate('/crm');
        return;
      }

      setProject(projectRes.data as CrmProject);
      setAllProjects((allProjectsRes.data as CrmProject[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [projectId, user, navigate]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleProjectSwitch = (id: string) => {
    localStorage.setItem(LAST_PROJECT_KEY, id);
    navigate(`/crm/projects/${id}`);
  };

  const openEdit = () => {
    if (!project) return;
    setEditName(project.name);
    setEditStatus(project.status);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!project) return;

    const { error } = await supabase
      .from('crm_projects')
      .update({ name: editName, status: editStatus })
      .eq('id', project.id);

    if (error) {
      toast.error('Failed to update project');
      return;
    }

    setProject({ ...project, name: editName, status: editStatus });
    setAllProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: editName, status: editStatus } : p));
    setEditOpen(false);
    toast.success('Project updated');
  };

  const handleDelete = async () => {
    if (!project) return;

    const { error } = await supabase
      .from('crm_projects')
      .delete()
      .eq('id', project.id);

    if (error) {
      toast.error('Failed to delete project');
      return;
    }

    localStorage.removeItem(LAST_PROJECT_KEY);
    toast.success('Project deleted');
    navigate('/crm');
  };

  const handleCreateProject = async () => {
    if (!user || !newProjectName.trim()) return;

    const { data, error } = await supabase
      .from('crm_projects')
      .insert({
        user_id: user.id,
        name: newProjectName,
        status: newProjectStatus,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create project');
      return;
    }

    toast.success('Project created');
    setCreateOpen(false);
    setNewProjectName('');
    localStorage.setItem(LAST_PROJECT_KEY, data.id);
    navigate(`/crm/projects/${data.id}`);
  };

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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Project Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 h-auto py-1">
                <FolderKanban size={18} className="text-primary shrink-0" />
                <span className="text-xl font-bold truncate max-w-[200px] md:max-w-none">{project.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {allProjects.map(p => (
                <DropdownMenuItem 
                  key={p.id} 
                  onClick={() => handleProjectSwitch(p.id)}
                  className={p.id === project.id ? 'bg-muted' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{p.name}</span>
                    <Badge variant="outline" className={`text-[10px] ml-2 ${getStatusColor(p.status)}`}>
                      {p.status}
                    </Badge>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                <Plus size={14} className="mr-2" />
                New Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Badge variant="outline" className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <CrossSystemActivityLog projectId={project.id} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openEdit}>
                <Pencil size={14} className="mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
                <Trash2 size={14} className="mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
          <TabsTrigger 
            value="timeline" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 gap-2"
          >
            <History size={16} />
            Timeline
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

        <TabsContent value="timeline" className="mt-6">
          <ProjectTimeline projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name</label>
              <Input
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="e.g., Public Equities, Strategy 2025"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newProjectStatus} onValueChange={(v) => setNewProjectStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.name}" and all associated companies, funds, and tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
