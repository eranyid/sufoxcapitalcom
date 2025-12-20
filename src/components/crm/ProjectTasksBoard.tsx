import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, MoreHorizontal, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { CrmTask, TaskStatus, TaskUrgency, STATUS_OPTIONS, URGENCY_OPTIONS, TaskTableGroup, getTaskTableGroup } from '@/types/crm';
import { TaskUrgencyOption } from './TaskUrgencyBadge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskUrgencyBadge } from './TaskUrgencyBadge';
import { TaskDetailsPanel } from './TaskDetailsPanel';
import { useTaskActivityLog } from '@/hooks/useTaskActivityLog';

interface Props {
  projectId: string;
}

// Exactly 3 visual table groups
const TABLE_GROUPS: { value: TaskTableGroup; label: string; defaultStatus: TaskStatus }[] = [
  { value: 'in_progress', label: 'In Progress', defaultStatus: 'in_progress' },
  { value: 'done', label: 'Done', defaultStatus: 'completed' },
  { value: 'canceled', label: 'Canceled', defaultStatus: 'canceled' },
];

export default function ProjectTasksBoard({ projectId }: Props) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<TaskTableGroup, boolean>>({
    in_progress: true,
    done: false,
    canceled: false,
  });
  const [addingToGroup, setAddingToGroup] = useState<TaskTableGroup | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedTask, setSelectedTask] = useState<CrmTask | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('crm_tasks')
      .select('*')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load tasks');
      console.error(error);
    } else {
      setTasks((data as CrmTask[]) || []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription for tasks
  useEffect(() => {
    const channel = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newTask = payload.new as CrmTask;
          if (!newTask.deleted_at) {
            setTasks(prev => {
              // Avoid duplicates (from optimistic updates)
              if (prev.some(t => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crm_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updatedTask = payload.new as CrmTask;
          if (updatedTask.deleted_at) {
            // Task was soft-deleted
            setTasks(prev => prev.filter(t => t.id !== updatedTask.id));
          } else {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            // Update selected task if it's the one being edited
            if (selectedTask?.id === updatedTask.id) {
              setSelectedTask(updatedTask);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'crm_tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, selectedTask?.id]);

  const handleCreate = async (tableGroup: TaskTableGroup) => {
    if (!user || !newTaskName.trim()) return;

    // Get the default status for this table group
    const defaultStatus = TABLE_GROUPS.find(g => g.value === tableGroup)?.defaultStatus || 'in_progress';

    const tempId = `temp-${Date.now()}`;
    const tempTask: CrmTask = {
      id: tempId,
      user_id: user.id,
      project_id: projectId,
      company_id: null,
      task_name: newTaskName,
      status: defaultStatus,
      urgency: 'none',
      owner: 'Me',
      description: null,
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks(prev => [tempTask, ...prev]);
    setNewTaskName('');
    setAddingToGroup(null);

    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        task_name: newTaskName,
        status: defaultStatus,
        urgency: 'none',
        owner: 'Me',
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create task');
      setTasks(prev => prev.filter(t => t.id !== tempId));
      console.error(error);
      return;
    }

    setTasks(prev => prev.map(t => t.id === tempId ? (data as CrmTask) : t));
    toast.success('Task added');
  };

  const handleInlineUpdate = async (id: string, field: keyof CrmTask, value: string | null, oldValue?: string | null) => {
    const original = tasks.find(t => t.id === id);
    if (!original) return;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    
    // Update selected task if it's the one being edited
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, [field]: value } : null);
    }

    const { error } = await supabase
      .from('crm_tasks')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
      setTasks(prev => prev.map(t => t.id === id ? original : t));
      if (selectedTask?.id === id) {
        setSelectedTask(original);
      }
      console.error(error);
      return;
    }

    // Log activity for tracked fields
    if (user && ['status', 'urgency', 'due_date', 'task_name'].includes(field)) {
      const actionMap: Record<string, string> = {
        status: 'status_changed',
        urgency: 'urgency_changed',
        due_date: 'due_date_changed',
        task_name: 'name_changed',
      };
      
      await supabase.from('task_activity_log').insert({
        task_id: id,
        user_id: user.id,
        action: actionMap[field] || 'field_changed',
        field_name: field,
        old_value: oldValue ?? String((original as unknown as Record<string, unknown>)[field] ?? ''),
        new_value: value,
      });
    }
  };

  const handleTaskRowClick = (task: CrmTask, e: React.MouseEvent) => {
    // On mobile, always open panel (table is read-only)
    if (isMobile) {
      setSelectedTask(task);
      setIsPanelOpen(true);
      return;
    }
    
    // On desktop, don't open panel if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('input') ||
      target.closest('button') ||
      target.closest('[role="combobox"]') ||
      target.closest('[data-radix-collection-item]')
    ) {
      return;
    }
    setSelectedTask(task);
    setIsPanelOpen(true);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
  };

  const handleDuplicate = async (task: CrmTask) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('crm_tasks')
      .insert({
        user_id: user.id,
        project_id: projectId,
        task_name: `${task.task_name} (copy)`,
        status: task.status,
        urgency: task.urgency,
        owner: task.owner,
        description: task.description,
        due_date: task.due_date,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to duplicate');
      console.error(error);
      return;
    }

    setTasks(prev => [data as CrmTask, ...prev]);
    toast.success('Task duplicated');
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const original = tasks.find(t => t.id === deleteId);
    setTasks(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);

    const { error } = await supabase
      .from('crm_tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete task');
      if (original) setTasks(prev => [original, ...prev]);
      console.error(error);
      return;
    }

    toast.success('Task moved to trash');
  };

  const toggleGroup = (group: TaskTableGroup) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Group tasks by their TABLE group (not status) using the helper function
  const groupedTasks = TABLE_GROUPS.reduce((acc, group) => {
    acc[group.value] = tasks.filter(t => getTaskTableGroup(t.status) === group.value);
    return acc;
  }, {} as Record<TaskTableGroup, CrmTask[]>);

  if (loading) {
    return <div className="h-64 bg-muted/50 animate-pulse rounded" />;
  }

  return (
    <div className="space-y-3">
      {TABLE_GROUPS.map(group => (
        <Collapsible 
          key={group.value} 
          open={expandedGroups[group.value]}
          onOpenChange={() => toggleGroup(group.value)}
        >
          <div className="border border-border rounded overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  {expandedGroups[group.value] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="font-medium text-sm">{group.label}</span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {groupedTasks[group.value]?.length || 0}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingToGroup(group.value);
                    setExpandedGroups(prev => ({ ...prev, [group.value]: true }));
                  }}
                >
                  <Plus size={12} className="mr-1" />
                  Add
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[220px]">Task</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[100px]">Urgency</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[110px]">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[120px] hidden sm:table-cell">Due Date</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[150px] hidden md:table-cell">Notes</th>
                      <th className="w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {addingToGroup === group.value && (
                      <tr className="border-b border-border">
                        <td colSpan={6} className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={newTaskName}
                              onChange={e => setNewTaskName(e.target.value)}
                              placeholder="Task name..."
                              className="h-8 text-sm"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleCreate(group.value);
                                if (e.key === 'Escape') setAddingToGroup(null);
                              }}
                            />
                            <Button size="sm" className="h-8" onClick={() => handleCreate(group.value)}>Add</Button>
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingToGroup(null)}>Cancel</Button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {groupedTasks[group.value]?.length === 0 && addingToGroup !== group.value && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                          No items
                        </td>
                      </tr>
                    )}
                    {groupedTasks[group.value]?.map(task => (
                      <tr 
                        key={task.id} 
                        className="border-b border-border hover:bg-muted/10 group/row cursor-pointer"
                        onClick={(e) => handleTaskRowClick(task, e)}
                      >
                        <td className="px-3 py-1.5">
                          {isMobile ? (
                            <span className="text-sm truncate block">{task.task_name}</span>
                          ) : (
                            <Input
                              defaultValue={task.task_name}
                              className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent"
                              onClick={e => e.stopPropagation()}
                              onBlur={e => {
                                if (e.target.value !== task.task_name) {
                                  handleInlineUpdate(task.id, 'task_name', e.target.value, task.task_name);
                                }
                              }}
                            />
                          )}
                        </td>
                        <td className="px-3 py-1.5" onClick={e => !isMobile && e.stopPropagation()}>
                          {isMobile ? (
                            <TaskUrgencyBadge urgency={task.urgency} />
                          ) : (
                            <Select
                              value={task.urgency}
                              onValueChange={v => handleInlineUpdate(task.id, 'urgency', v, task.urgency)}
                            >
                              <SelectTrigger className="h-7 text-xs border-transparent hover:border-border bg-transparent w-[110px]">
                                <TaskUrgencyBadge urgency={task.urgency} />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border border-border shadow-lg">
                                {URGENCY_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                                    <TaskUrgencyOption urgency={opt.value} isSelected={task.urgency === opt.value} />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-3 py-1.5" onClick={e => !isMobile && e.stopPropagation()}>
                          {isMobile ? (
                            <TaskStatusBadge status={task.status} />
                          ) : (
                            <Select
                              value={task.status}
                              onValueChange={v => handleInlineUpdate(task.id, 'status', v, task.status)}
                            >
                              <SelectTrigger className="h-7 text-xs border-transparent hover:border-border bg-transparent w-[100px]">
                                <TaskStatusBadge status={task.status} />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="px-3 py-1.5 hidden sm:table-cell" onClick={e => !isMobile && e.stopPropagation()}>
                          <Input
                            type="date"
                            defaultValue={task.due_date || ''}
                            className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent w-[110px]"
                            onBlur={e => {
                              if (e.target.value !== (task.due_date || '')) {
                                handleInlineUpdate(task.id, 'due_date', e.target.value || null, task.due_date);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                          <Input
                            defaultValue={task.description || ''}
                            placeholder="-"
                            className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent"
                            onBlur={e => {
                              if (e.target.value !== (task.description || '')) {
                                handleInlineUpdate(task.id, 'description', e.target.value || null);
                              }
                            }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <div className={isMobile ? '' : 'opacity-0 group-hover/row:opacity-100'}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                  <MoreHorizontal size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDuplicate(task)}>
                                  <Copy size={14} className="mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeleteId(task.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
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

      <TaskDetailsPanel
        task={selectedTask}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        onUpdate={handleInlineUpdate}
      />
    </div>
  );
}
