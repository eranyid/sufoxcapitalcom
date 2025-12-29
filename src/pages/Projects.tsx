import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Search, Calendar, Trash2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ProjectHealthBadge } from '@/components/projects/ProjectHealthBadge';
import { ProjectPriorityBadge } from '@/components/projects/ProjectPriorityBadge';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
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
import { format } from 'date-fns';
import type { ProjectPriority, ProjectHealth } from '@/types/projects';

interface ProjectStats {
  [projectId: string]: {
    total: number;
    completed: number;
    percent: number;
  };
}

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, loading, refetch, deleteProject } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [projectStats, setProjectStats] = useState<ProjectStats>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const projectToDelete = deleteId ? projects.find(p => p.id === deleteId) : null;

  const handleDeleteProject = async () => {
    if (!deleteId) return;
    await deleteProject(deleteId);
    setDeleteId(null);
  };

  // Fetch task stats for all projects
  useEffect(() => {
    const fetchTaskStats = async () => {
      if (!user || projects.length === 0) return;

      const { data: tasks } = await supabase
        .from('crm_tasks')
        .select('linked_project_id, status')
        .not('linked_project_id', 'is', null)
        .is('deleted_at', null)
        .eq('user_id', user.id);

      if (!tasks) return;

      const stats: ProjectStats = {};
      projects.forEach(p => {
        stats[p.id] = { total: 0, completed: 0, percent: 0 };
      });

      tasks.forEach(task => {
        if (task.linked_project_id && stats[task.linked_project_id]) {
          stats[task.linked_project_id].total++;
          if (task.status === 'completed' || task.status === 'canceled') {
            stats[task.linked_project_id].completed++;
          }
        }
      });

      Object.keys(stats).forEach(id => {
        const s = stats[id];
        s.percent = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      });

      setProjectStats(stats);
    };

    fetchTaskStats();
  }, [user, projects]);

  const handleCreate = async (data: {
    name: string;
    description?: string;
    priority: ProjectPriority;
    health_status: ProjectHealth;
    target_date?: string;
  }) => {
    if (!user) return false;

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: data.name,
        description: data.description || null,
        priority: data.priority,
        health_status: data.health_status,
        target_date: data.target_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return false;
    }

    refetch();
    navigate(`/backoffice/projects/${newProject.id}`);
    return true;
  };

  const filteredProjects = projects.filter(p => {
    const query = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(query) || 
           (p.description && p.description.toLowerCase().includes(query));
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* Projects Table or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FolderKanban size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium">No projects yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first project to start tracking work.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-6 gap-2">
            <Plus size={16} />
            New Project
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground">Name</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground w-[110px]">Health</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground w-[90px]">Priority</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground w-[110px]">Target</TableHead>
                <TableHead className="font-medium text-xs uppercase tracking-wide text-muted-foreground w-[120px]">Progress</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map(project => {
                const stats = projectStats[project.id] || { total: 0, completed: 0, percent: 0 };
                return (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer group transition-colors hover:bg-muted/50"
                    onClick={() => navigate(`/backoffice/projects/${project.id}`)}
                  >
                    <TableCell className="py-3">
                      <div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <ProjectHealthBadge health={project.health_status} />
                    </TableCell>
                    <TableCell className="py-3">
                      <ProjectPriorityBadge priority={project.priority} />
                    </TableCell>
                    <TableCell className="py-3">
                      {project.target_date ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar size={12} />
                          <span className="font-mono text-xs">
                            {format(new Date(project.target_date), 'MMM d')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={stats.percent} className="h-1.5 w-14 bg-muted" />
                        <span className="text-xs font-mono text-muted-foreground w-8">
                          {stats.percent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(project.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This will move it to trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
