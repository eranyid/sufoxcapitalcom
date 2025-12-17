import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CrmTask, TaskStatus, TaskUrgency, STATUS_OPTIONS, URGENCY_OPTIONS } from '@/types/crm';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { format } from 'date-fns';

interface Props {
  projectId: string;
}

const TASK_GROUPS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'waiting', label: 'Waiting / Blocked' },
  { value: 'completed', label: 'Completed' },
] as const;

type TaskGroup = typeof TASK_GROUPS[number]['value'];

export default function ProjectTasksBoard({ projectId }: Props) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CrmTask>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<TaskGroup, boolean>>({
    in_progress: true,
    backlog: true,
    waiting: true,
    completed: false,
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
      console.error(error);
      return;
    }

    setTasks(prev => [data as CrmTask, ...prev]);
    setNewTaskName('');
    setAddingToGroup(null);
    toast.success('Task added');
  };

  const handleUpdate = async (id: string, updates: Partial<CrmTask>) => {
    const { error } = await supabase
      .from('crm_tasks')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update task');
      console.error(error);
      return;
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('crm_tasks')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Failed to delete task');
      console.error(error);
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== deleteId));
    setDeleteId(null);
    toast.success('Task deleted');
  };

  const startEdit = (task: CrmTask) => {
    setEditingId(task.id);
    setEditValues(task);
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
    <div className="space-y-4">
      {TASK_GROUPS.map(group => (
        <Collapsible 
          key={group.value} 
          open={expandedGroups[group.value]}
          onOpenChange={() => toggleGroup(group.value)}
        >
          <div className="border border-border rounded-lg overflow-hidden">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  {expandedGroups[group.value] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="font-medium">{group.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {groupedTasks[group.value]?.length || 0}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingToGroup(group.value);
                    setExpandedGroups(prev => ({ ...prev, [group.value]: true }));
                  }}
                >
                  <Plus size={14} className="mr-1" />
                  Add
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Task</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addingToGroup === group.value && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="flex items-center gap-2">
                          <Input
                            value={newTaskName}
                            onChange={e => setNewTaskName(e.target.value)}
                            placeholder="Task name..."
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCreate(group.value);
                              if (e.key === 'Escape') setAddingToGroup(null);
                            }}
                          />
                          <Button size="sm" onClick={() => handleCreate(group.value)}>Add</Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddingToGroup(null)}>Cancel</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {groupedTasks[group.value]?.length === 0 && addingToGroup !== group.value && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No tasks in this group
                      </TableCell>
                    </TableRow>
                  )}
                  {groupedTasks[group.value]?.map(task => (
                    <TableRow key={task.id} className="group">
                      <TableCell>
                        {editingId === task.id ? (
                          <Input
                            value={editValues.task_name || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, task_name: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{task.task_name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === task.id ? (
                          <Input
                            value={editValues.owner || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, owner: e.target.value }))}
                            className="h-8 w-[100px]"
                          />
                        ) : (
                          task.owner || 'Me'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === task.id ? (
                          <Input
                            type="date"
                            value={editValues.due_date || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, due_date: e.target.value }))}
                            className="h-8 w-[140px]"
                          />
                        ) : (
                          task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === task.id ? (
                          <Select
                            value={editValues.urgency}
                            onValueChange={v => setEditValues(prev => ({ ...prev, urgency: v as TaskUrgency }))}
                          >
                            <SelectTrigger className="h-8 w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {URGENCY_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <TaskUrgencyBadge urgency={task.urgency} />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {editingId === task.id ? (
                          <Input
                            value={editValues.description || ''}
                            onChange={e => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                            className="h-8"
                          />
                        ) : (
                          task.description || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          {editingId === task.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdate(task.id, editValues)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(task)}>
                                <Pencil size={14} />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(task.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
