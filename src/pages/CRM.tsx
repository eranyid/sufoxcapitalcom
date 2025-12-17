import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmProject, PROJECT_STATUS_OPTIONS, ProjectStatus } from '@/types/crm';
import { toast } from 'sonner';

const LAST_PROJECT_KEY = 'crm_last_project_id';

export default function CRM() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasProjects, setHasProjects] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('active');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user) return;

      // Check for last opened project in localStorage
      const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);

      if (lastProjectId) {
        // Verify the project still exists
        const { data: project } = await supabase
          .from('crm_projects')
          .select('id')
          .eq('id', lastProjectId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (project) {
          navigate(`/crm/projects/${lastProjectId}`, { replace: true });
          return;
        }
      }

      // Fallback: get most recently updated active project
      const { data: projects } = await supabase
        .from('crm_projects')
        .select('id, status')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (projects && projects.length > 0) {
        // Prefer active projects
        const activeProject = projects.find(p => p.status === 'active') || projects[0];
        localStorage.setItem(LAST_PROJECT_KEY, activeProject.id);
        navigate(`/crm/projects/${activeProject.id}`, { replace: true });
        return;
      }

      // No projects exist - show empty state
      setHasProjects(false);
      setLoading(false);
    };

    checkAndRedirect();
  }, [user, navigate]);

  const handleCreate = async () => {
    if (!user || !newProjectName.trim()) return;

    setCreating(true);
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
      console.error(error);
      setCreating(false);
      return;
    }

    localStorage.setItem(LAST_PROJECT_KEY, data.id);
    toast.success('Project created');
    navigate(`/crm/projects/${data.id}`, { replace: true });
  };

  // Show loading while checking/redirecting
  if (loading && hasProjects === false) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="space-y-4 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading CRM...</p>
        </div>
      </div>
    );
  }

  // Empty state - no projects exist
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center space-y-4">
        <FolderKanban size={48} className="text-muted-foreground mx-auto" />
        <h2 className="text-lg font-medium text-foreground">No projects yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first project to start tracking companies, funds, and tasks.
        </p>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} />
          Create Project
        </Button>
      </div>

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
                onKeyDown={e => {
                  if (e.key === 'Enter' && newProjectName.trim()) handleCreate();
                }}
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
            <Button onClick={handleCreate} disabled={!newProjectName.trim() || creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
