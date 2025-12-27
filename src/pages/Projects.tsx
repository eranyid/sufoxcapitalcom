import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Search, Calendar } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { ProjectPriority, ProjectHealth } from '@/types/projects';

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, loading, refetch } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

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
    navigate(`/projects/${newProject.id}`);
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
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">Projects</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2">
            <Plus size={16} />
            <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban size={48} className="text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium">No projects yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Create your first project to start tracking work.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
            <Plus size={16} />
            New Project
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold w-[120px]">Health</TableHead>
                <TableHead className="font-semibold w-[100px]">Priority</TableHead>
                <TableHead className="font-semibold w-[120px]">Target Date</TableHead>
                <TableHead className="font-semibold w-[100px]">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map(project => (
                <TableRow
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <TableCell>
                    <div>
                      <span className="font-medium">{project.name}</span>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-md">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProjectHealthBadge health={project.health_status} />
                  </TableCell>
                  <TableCell>
                    <ProjectPriorityBadge priority={project.priority} />
                  </TableCell>
                  <TableCell>
                    {project.target_date ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar size={14} className="text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {format(new Date(project.target_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={0} className="h-1.5 w-16" />
                      <span className="text-xs font-mono text-muted-foreground">0%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
    </div>
  );
}
