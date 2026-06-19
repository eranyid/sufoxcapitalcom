import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Users, Tag, Edit2, Trash2, Plus, 
  MessageSquare, ChevronDown, ChevronUp, Sparkles, List, GanttChart 
} from 'lucide-react';
import { useProject } from '@/hooks/useProjects';
import { useProjectUpdates } from '@/hooks/useProjectUpdates';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { useProjectMilestones } from '@/hooks/useProjectMilestones';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { ProjectHealthBadge } from '@/components/projects/ProjectHealthBadge';
import { ProjectPriorityBadge } from '@/components/projects/ProjectPriorityBadge';
import { ProjectProgressPanel } from '@/components/projects/ProjectProgressPanel';
import { MilestoneList } from '@/components/projects/MilestoneList';
import { MilestoneGanttChart } from '@/components/projects/MilestoneGanttChart';
import { GenerateMilestonesDialog } from '@/components/projects/GenerateMilestonesDialog';
import { HEALTH_OPTIONS, PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/types/projects';
import type { ProjectHealth, ProjectPriority, ProjectStatus } from '@/types/projects';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, loading, updateProject } = useProject(id);
  const { updates, addUpdate, deleteUpdate } = useProjectUpdates(id);
  const { tasks, stats } = useProjectTasks(id);
  const {
    milestones, addMilestone, updateMilestone, deleteMilestone,
    generateFromTemplate, clearAllMilestones,
    completedCount, totalCount, percentComplete: milestonePercent,
  } = useProjectMilestones(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newUpdateStatus, setNewUpdateStatus] = useState<ProjectHealth>('on_track');
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [milestoneView, setMilestoneView] = useState<'list' | 'gantt'>('list');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<ProjectPriority>('medium');
  const [editHealth, setEditHealth] = useState<ProjectHealth>('on_track');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');
  const [editTargetDate, setEditTargetDate] = useState('');

  const handleEditOpen = () => {
    if (project) {
      setEditName(project.name);
      setEditDescription(project.description || '');
      setEditPriority(project.priority);
      setEditHealth(project.health_status);
      setEditStatus(project.status);
      setEditTargetDate(project.target_date || '');
      setEditOpen(true);
    }
  };

  const handleSaveEdit = async () => {
    const success = await updateProject({
      name: editName,
      description: editDescription || null,
      priority: editPriority,
      health_status: editHealth,
      status: editStatus,
      target_date: editTargetDate || null,
    });
    if (success) setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted');
      navigate('/backoffice/projects');
    }
  };

  const handleAddUpdate = async () => {
    if (!newUpdateText.trim()) return;
    const success = await addUpdate(newUpdateText.trim(), newUpdateStatus);
    if (success) {
      setNewUpdateText('');
      setNewUpdateStatus('on_track');
      setUpdateOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-lg font-medium">Project not found</h2>
        <Button variant="outline" onClick={() => navigate('/backoffice/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  const displayedUpdates = showAllUpdates ? updates : updates.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate('/backoffice/projects')}
        className="gap-2 -ml-2"
      >
        <ArrowLeft size={16} />
        Back to Projects
      </Button>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="border border-border rounded-lg p-4 md:p-6 bg-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <h1 className="text-xl md:text-2xl font-bold">{project.name}</h1>
                
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectHealthBadge health={project.health_status} />
                  <ProjectPriorityBadge priority={project.priority} />
                  <Badge variant="outline" className="text-xs">
                    {STATUS_OPTIONS.find(s => s.value === project.status)?.label || project.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {project.target_date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>Target: {format(new Date(project.target_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {project.team && project.team.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span>{project.team.join(', ')}</span>
                    </div>
                  )}
                  {project.labels && project.labels.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Tag size={14} />
                      <span>{project.labels.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditOpen}>
                  <Edit2 size={14} />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                  <Trash2 size={14} className="text-destructive" />
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border border-border rounded-lg p-4 md:p-6 bg-card">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Description</h3>
            {project.description ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description yet.</p>
            )}
          </div>

          {/* Updates */}
          <div className="border border-border rounded-lg p-4 md:p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Updates</h3>
              <Button size="sm" variant="outline" onClick={() => setUpdateOpen(true)} className="gap-1.5">
                <Plus size={14} />
                Add Update
              </Button>
            </div>

            {updates.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No updates yet.</p>
            ) : (
              <div className="space-y-4">
                {displayedUpdates.map(update => (
                  <div key={update.id} className="border-l-2 border-border pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <ProjectHealthBadge health={update.status} />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm">{update.text}</p>
                  </div>
                ))}

                {updates.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllUpdates(!showAllUpdates)}
                    className="gap-1.5 w-full"
                  >
                    {showAllUpdates ? (
                      <>
                        <ChevronUp size={14} />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} />
                        Show {updates.length - 3} More
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Milestones */}
          {milestones.length > 0 ? (
            <div className="space-y-0">
              {/* View toggle */}
              <div className="flex items-center justify-end gap-1 mb-2">
                <Button
                  variant={milestoneView === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMilestoneView('list')}
                  title="List view"
                >
                  <List size={14} />
                </Button>
                <Button
                  variant={milestoneView === 'gantt' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMilestoneView('gantt')}
                  title="Gantt chart"
                >
                  <GanttChart size={14} />
                </Button>
              </div>

              {milestoneView === 'list' ? (
                <MilestoneList
                  milestones={milestones}
                  completedCount={completedCount}
                  totalCount={totalCount}
                  percentComplete={milestonePercent}
                  onUpdateStatus={(id, status) => updateMilestone(id, { status })}
                  onDelete={deleteMilestone}
                  onAdd={addMilestone}
                />
              ) : (
                <MilestoneGanttChart
                  milestones={milestones}
                  projectStartDate={project.start_date}
                />
              )}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center text-center">
              <Sparkles size={24} className="text-muted-foreground mb-2" />
              <h3 className="text-sm font-semibold">No milestones yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Generate milestones from a template or add them manually.
              </p>
              <Button
                size="sm"
                className="mt-4 gap-1.5"
                onClick={() => setGenerateOpen(true)}
              >
                <Sparkles size={14} />
                Generate Milestones
              </Button>
            </div>
          )}

          {/* Linked Tasks */}
          <div className="border border-border rounded-lg p-4 md:p-6 bg-card">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Linked Issues</h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No issues linked to this project yet.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 5).map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/backoffice/tasks')}
                  >
                    <span className="text-sm font-medium truncate">{task.task_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {task.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
                {tasks.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{tasks.length - 5} more issues
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column - progress panel */}
        <div className="space-y-4">
          <ProjectProgressPanel {...stats} />

          {/* Generate milestones button in sidebar */}
          {milestones.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setGenerateOpen(true)}
            >
              <Sparkles size={14} />
              Regenerate Milestones
            </Button>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ProjectStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={editPriority} onValueChange={(v) => setEditPriority(v as ProjectPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Health</label>
                <Select value={editHealth} onValueChange={(v) => setEditHealth(v as ProjectHealth)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <Input
                  type="date"
                  value={editTargetDate}
                  onChange={e => setEditTargetDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Update Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newUpdateStatus} onValueChange={(v) => setNewUpdateStatus(v as ProjectHealth)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Update</label>
              <Textarea
                value={newUpdateText}
                onChange={e => setNewUpdateText(e.target.value)}
                placeholder="What's the latest on this project?"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUpdate} disabled={!newUpdateText.trim()}>Add Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Milestones Dialog */}
      <GenerateMilestonesDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerate={generateFromTemplate}
        projectStartDate={project.start_date}
        hasMilestones={milestones.length > 0}
        onClearAll={clearAllMilestones}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the project to trash. Linked issues will be unlinked but not deleted.
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
