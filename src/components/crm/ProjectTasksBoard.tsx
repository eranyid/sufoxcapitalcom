import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, MoreHorizontal, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmTask, TaskStatus, TaskUrgency, STATUS_OPTIONS, URGENCY_OPTIONS } from '@/types/crm';
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

interface Props {
  projectId: string;
}

const TASK_GROUPS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
] as const;

type TaskGroup = typeof TASK_GROUPS[number]['value'];

export default function ProjectTasksBoard({ projectId }: Props) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<TaskGroup, boolean>>({
    in_progress: true,
    backlog: true,
    done: false,
    blocked: true,
  });
  const [addingToGroup, setAddingToGroup] = useState<TaskGroup | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('crm_tasks')
      .select('*')
      .eq('project_id', projectId)
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

  const handleCreate = async (status: TaskGroup) => {
    if (!user || !newTaskName.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const tempTask: CrmTask = {
      id: tempId,
      user_id: user.id,
      project_id: projectId,
      task_name: newTaskName,
      status: status as TaskStatus,
      urgency: 'medium',
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
        status: status,
        urgency: 'medium',
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

  const handleInlineUpdate = async (id: string, field: keyof CrmTask, value: string | null) => {
    const original = tasks.find(t => t.id === id);
    if (!original) return;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));

    const { error } = await supabase
      .from('crm_tasks')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
      setTasks(prev => prev.map(t => t.id === id ? original : t));
      console.error(error);
    }
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
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete task');
      if (original) setTasks(prev => [original, ...prev]);
      console.error(error);
      return;
    }

    toast.success('Task deleted');
  };

  const toggleGroup = (group: TaskGroup) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groupedTasks = TASK_GROUPS.reduce((acc, group) => {
    acc[group.value] = tasks.filter(t => t.status === group.value);
    return acc;
  }, {} as Record<TaskGroup, CrmTask[]>);

  if (loading) {
    return <div className="h-64 bg-muted/50 animate-pulse rounded" />;
  }

  return (
    <div className="space-y-3">
      {TASK_GROUPS.map(group => (
        <Collapsible 
          key={group.value} 
          open={expandedGroups[group.value]}
          onOpenChange={() => toggleGroup(group.value)}
        >
          <div className="border border-border rounded overflow-hidden border-l-2 border-l-blue-500/50">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 border-t-2 border-t-blue-500/30">
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
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[110px]">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[120px]">Due Date</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground w-[100px]">Urgency</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[150px]">Notes</th>
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
                      <tr key={task.id} className="border-b border-border hover:bg-blue-500/5 focus-within:ring-1 focus-within:ring-blue-500/30 group/row">
                        <td className="px-3 py-1.5">
                          <Input
                            defaultValue={task.task_name}
                            className="h-7 text-sm border-transparent hover:border-border focus:border-primary bg-transparent"
                            onBlur={e => {
                              if (e.target.value !== task.task_name) {
                                handleInlineUpdate(task.id, 'task_name', e.target.value);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Select
                            value={task.status}
                            onValueChange={v => handleInlineUpdate(task.id, 'status', v)}
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
                        </td>
                        <td className="px-3 py-1.5">
                          <Input
                            type="date"
                            defaultValue={task.due_date || ''}
                            className="h-7 text-xs border-transparent hover:border-border focus:border-primary bg-transparent w-[110px]"
                            onBlur={e => {
                              if (e.target.value !== (task.due_date || '')) {
                                handleInlineUpdate(task.id, 'due_date', e.target.value || null);
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <Select
                            value={task.urgency}
                            onValueChange={v => handleInlineUpdate(task.id, 'urgency', v)}
                          >
                            <SelectTrigger className="h-7 text-xs border-transparent hover:border-border bg-transparent w-[90px]">
                              <TaskUrgencyBadge urgency={task.urgency} />
                            </SelectTrigger>
                            <SelectContent>
                              {URGENCY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-1.5">
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
                          <div className="opacity-0 group-hover/row:opacity-100">
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
    </div>
  );
}
