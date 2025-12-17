import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, MoreHorizontal, Pencil, Archive, Trash2, Play, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useCrmProjects } from '@/hooks/useCrmProjects';
import { CrmProject, PROJECT_STATUS_OPTIONS, ProjectStatus } from '@/types/crm';
import { format } from 'date-fns';

export default function CRM() {
  const navigate = useNavigate();
  const { projects, loading, createProject, updateProject, deleteProject } = useCrmProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<CrmProject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectStatus, setNewProjectStatus] = useState<ProjectStatus>('active');

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    await createProject({ name: newProjectName, status: newProjectStatus });
    setNewProjectName('');
    setNewProjectStatus('active');
    setCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editProject) return;
    await updateProject(editProject.id, { 
      name: editProject.name, 
      status: editProject.status 
    });
    setEditProject(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProject(deleteId);
    setDeleteId(null);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'monitoring': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'archived': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const activeProjects = projects.filter(p => p.status === 'active');
  const monitoringProjects = projects.filter(p => p.status === 'monitoring');
  const archivedProjects = projects.filter(p => p.status === 'archived');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage investment projects and strategies</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-2 border-border bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first project to get started</p>
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
              <Plus size={16} />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Play size={14} className="text-emerald-400" />
                Active ({activeProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => navigate(`/crm/projects/${project.id}`)}
                    onEdit={() => setEditProject(project)}
                    onDelete={() => setDeleteId(project.id)}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            </div>
          )}

          {monitoringProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Eye size={14} className="text-amber-400" />
                Monitoring ({monitoringProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monitoringProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => navigate(`/crm/projects/${project.id}`)}
                    onEdit={() => setEditProject(project)}
                    onDelete={() => setDeleteId(project.id)}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            </div>
          )}

          {archivedProjects.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Archive size={14} />
                Archived ({archivedProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => navigate(`/crm/projects/${project.id}`)}
                    onEdit={() => setEditProject(project)}
                    onDelete={() => setDeleteId(project.id)}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            <Button onClick={handleCreate} disabled={!newProjectName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={() => setEditProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editProject && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input
                  value={editProject.name}
                  onChange={e => setEditProject({ ...editProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={editProject.status} 
                  onValueChange={(v) => setEditProject({ ...editProject, status: v as ProjectStatus })}
                >
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProject(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project and all associated companies, funds, and tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProjectCard({ 
  project, 
  onOpen, 
  onEdit, 
  onDelete,
  getStatusColor 
}: { 
  project: CrmProject;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getStatusColor: (status: ProjectStatus) => string;
}) {
  return (
    <Card 
      className="group cursor-pointer border-border bg-card hover:bg-muted/50 transition-colors"
      onClick={onOpen}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderKanban size={18} className="text-primary" />
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(); }}>
                <Pencil size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-semibold text-foreground mb-1">{project.name}</h3>
        <p className="text-xs text-muted-foreground">
          Created {format(new Date(project.created_at), 'MMM d, yyyy')}
        </p>
      </CardContent>
    </Card>
  );
}
