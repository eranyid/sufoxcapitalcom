import { useState, useEffect, useCallback } from 'react';
import { X, MessageSquare, Paperclip, Activity, FolderKanban, Building2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CrmTask, STATUS_OPTIONS, URGENCY_OPTIONS } from '@/types/crm';
import { useProjects } from '@/hooks/useProjects';
import { useCrmCompanies } from '@/hooks/useCrmCompanies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import { TaskStatusBadge, TaskStatusOption, statusConfig } from './TaskStatusBadge';
import { TaskUrgencyBadge, TaskUrgencyOption } from './TaskUrgencyBadge';
import { TaskUpdatesTab } from './TaskUpdatesTab';
import { TaskFilesTab } from './TaskFilesTab';
import { TaskActivityLogTab } from './TaskActivityLogTab';
import { cn } from '@/lib/utils';

interface Props {
  task: CrmTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, field: keyof CrmTask, value: string | null, oldValue?: string | null) => void;
  onDelete?: (id: string) => Promise<boolean>;
}

export function TaskDetailsPanel({ task, isOpen, onClose, onUpdate, onDelete }: Props) {
  const { projects } = useProjects();
  const { companies } = useCrmCompanies();
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Handle ESC key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!task) return null;

  const linkedProject = task.linked_project_id 
    ? projects.find(p => p.id === task.linked_project_id) 
    : null;

  const linkedCompany = task.company_id 
    ? companies.find(c => c.id === task.company_id) 
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleOverlayClick}
      />

      {/* Panel - Full screen on mobile */}
      <div
        className={cn(
          'fixed top-0 h-full bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out',
          'right-0 w-full sm:w-[420px] lg:w-[480px]',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header - Mobile optimized */}
        <div className="flex-shrink-0 border-b border-border p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <Input
                defaultValue={task.task_name}
                className="text-base sm:text-lg font-semibold border-transparent hover:border-border focus:border-primary bg-transparent px-0 h-auto"
                onBlur={e => {
                  if (e.target.value !== task.task_name) {
                    onUpdate(task.id, 'task_name', e.target.value, task.task_name);
                  }
                }}
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Task ID: {task.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setDeleteOpen(true)} 
                  className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9">
                <X size={18} />
              </Button>
            </div>
          </div>

          {/* Status & Urgency - Same height, urgency smallest in middle */}
          <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
            <Select
              value={task.status}
              onValueChange={v => onUpdate(task.id, 'status', v, task.status)}
            >
              <SelectTrigger 
                className={cn(
                  "h-9 w-auto rounded-full border-transparent text-sm px-3 [&>svg:last-child]:hidden",
                  statusConfig[task.status]?.bgColor || 'bg-muted/30'
                )}
              >
                <TaskStatusBadge status={task.status} className="bg-transparent px-0 py-0" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                    <TaskStatusOption status={opt.value} isSelected={task.status === opt.value} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={task.urgency}
              onValueChange={v => onUpdate(task.id, 'urgency', v, task.urgency)}
            >
              <SelectTrigger className="h-9 w-auto rounded-full border-border bg-muted/30 text-sm px-3 [&>svg:last-child]:hidden">
                <TaskUrgencyBadge urgency={task.urgency} />
              </SelectTrigger>
              <SelectContent>
                {URGENCY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <TaskUrgencyOption urgency={opt.value} isSelected={task.urgency === opt.value} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              defaultValue={task.due_date || ''}
              className="h-9 w-auto text-sm rounded-full border-border bg-muted/30 px-4"
              onBlur={e => {
                if (e.target.value !== (task.due_date || '')) {
                  onUpdate(task.id, 'due_date', e.target.value || null, task.due_date);
                }
              }}
            />
          </div>

          {/* Project Link */}
          <div className="mt-3 sm:mt-4 flex items-center gap-2">
            <FolderKanban size={14} className="text-muted-foreground flex-shrink-0" />
            <Select
              value={task.linked_project_id || 'none'}
              onValueChange={v => onUpdate(task.id, 'linked_project_id', v === 'none' ? null : v, task.linked_project_id)}
            >
              <SelectTrigger className="h-7 sm:h-8 flex-1 gap-1.5 sm:gap-2 border-border bg-muted/30 text-xs sm:text-sm">
                {linkedProject ? (
                  <span className="truncate">{linkedProject.name}</span>
                ) : (
                  <span className="text-muted-foreground">No project</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedProject && (
              <Link 
                to={`/backoffice/projects/${linkedProject.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                View
              </Link>
            )}
          </div>

          {/* Company Link */}
          <div className="mt-3 sm:mt-4 flex items-center gap-2">
            <Building2 size={14} className="text-muted-foreground flex-shrink-0" />
            <Select
              value={task.company_id || 'none'}
              onValueChange={v => onUpdate(task.id, 'company_id', v === 'none' ? null : v, task.company_id)}
            >
              <SelectTrigger className="h-7 sm:h-8 flex-1 gap-1.5 sm:gap-2 border-border bg-muted/30 text-xs sm:text-sm">
                {linkedCompany ? (
                  <span className="truncate">{linkedCompany.company_name}</span>
                ) : (
                  <span className="text-muted-foreground">No company</span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {linkedCompany && (
              <Link 
                to={`/companies/${linkedCompany.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                View
              </Link>
            )}
          </div>
        </div>

        {/* Tabs - Mobile optimized */}
        <Tabs defaultValue="updates" className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0 overflow-x-auto">
            <TabsTrigger 
              value="updates" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
            >
              <MessageSquare size={14} />
              <span className="hidden xs:inline">Updates</span>
            </TabsTrigger>
            <TabsTrigger 
              value="files" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
            >
              <Paperclip size={14} />
              <span className="hidden xs:inline">Files</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
            >
              <Activity size={14} />
              <span className="hidden xs:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="updates" className="flex-1 m-0 overflow-hidden">
            <TaskUpdatesTab taskId={task.id} />
          </TabsContent>
          <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
            <TaskFilesTab taskId={task.id} />
          </TabsContent>
          <TabsContent value="activity" className="flex-1 m-0 overflow-hidden">
            <TaskActivityLogTab taskId={task.id} />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Issue</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{task.task_name}"? This will move it to trash.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (onDelete) {
                    await onDelete(task.id);
                    onClose();
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
