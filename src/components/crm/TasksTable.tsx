import { useState, useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Trash2, Check, X, CalendarIcon, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrmTask, TaskStatus, TaskUrgency, STATUS_OPTIONS, URGENCY_OPTIONS } from '@/types/crm';
import { TaskStatusBadge } from './TaskStatusBadge';
import { TaskUrgencyBadge } from './TaskUrgencyBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TasksTableProps {
  tasks: CrmTask[];
  onUpdate: (id: string, updates: Partial<CrmTask>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

type SortField = 'task_name' | 'due_date' | 'status' | 'urgency' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function TasksTable({ tasks, onUpdate, onDelete }: TasksTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<CrmTask>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterUrgency, setFilterUrgency] = useState<TaskUrgency | 'all'>('all');

  const startEdit = (task: CrmTask) => {
    setEditingId(task.id);
    setEditValues({
      task_name: task.task_name,
      description: task.description,
      due_date: task.due_date,
      status: task.status,
      urgency: task.urgency,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const success = await onUpdate(editingId, editValues);
    if (success) {
      setEditingId(null);
      setEditValues({});
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply filters
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }
    if (filterUrgency !== 'all') {
      result = result.filter(t => t.urgency === filterUrgency);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'task_name':
          comparison = a.task_name.localeCompare(b.task_name);
          break;
        case 'due_date':
          const dateA = a.due_date ? new Date(a.due_date).getTime() : 0;
          const dateB = b.due_date ? new Date(b.due_date).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'status':
          const statusOrder = { backlog: 0, in_progress: 1, waiting: 2, completed: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'urgency':
          const urgencyOrder = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, filterStatus, filterUrgency, sortField, sortDir]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground -ml-2"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown size={12} className="ml-1 opacity-50" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter size={14} className="text-muted-foreground" />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterUrgency} onValueChange={(v) => setFilterUrgency(v as TaskUrgency | 'all')}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
            <SelectValue placeholder="All Urgencies" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">All Urgencies</SelectItem>
            {URGENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterStatus !== 'all' || filterUrgency !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setFilterStatus('all'); setFilterUrgency('all'); }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[280px]">
                <SortableHeader field="task_name">Task</SortableHeader>
              </TableHead>
              <TableHead className="w-[220px]">Description</TableHead>
              <TableHead className="w-[120px]">
                <SortableHeader field="due_date">Due Date</SortableHeader>
              </TableHead>
              <TableHead className="w-[130px]">
                <SortableHeader field="status">Status</SortableHeader>
              </TableHead>
              <TableHead className="w-[100px]">
                <SortableHeader field="urgency">Urgency</SortableHeader>
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className={cn(
                    'group',
                    editingId === task.id && 'bg-muted/30'
                  )}
                >
                  {/* Task Name */}
                  <TableCell>
                    {editingId === task.id ? (
                      <Input
                        value={editValues.task_name || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, task_name: e.target.value }))}
                        className="h-8 text-sm bg-background"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className="cursor-pointer text-primary hover:text-primary/80 transition-colors font-medium"
                        onClick={() => startEdit(task)}
                      >
                        {task.task_name}
                      </span>
                    )}
                  </TableCell>

                  {/* Description */}
                  <TableCell>
                    {editingId === task.id ? (
                      <Textarea
                        value={editValues.description || ''}
                        onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))}
                        className="h-16 text-xs bg-background resize-none"
                        rows={2}
                      />
                    ) : (
                      <span 
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground line-clamp-2"
                        onClick={() => startEdit(task)}
                      >
                        {task.description || '—'}
                      </span>
                    )}
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>
                    {editingId === task.id ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              'h-8 w-full justify-start text-left text-xs bg-background',
                              !editValues.due_date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-1.5 h-3 w-3" />
                            {editValues.due_date ? format(parseISO(editValues.due_date), 'MMM d, yyyy') : 'Pick date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={editValues.due_date ? parseISO(editValues.due_date) : undefined}
                            onSelect={(date) => setEditValues(v => ({ 
                              ...v, 
                              due_date: date ? format(date, 'yyyy-MM-dd') : null 
                            }))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span 
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => startEdit(task)}
                      >
                        {task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : '—'}
                      </span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {editingId === task.id ? (
                      <Select 
                        value={editValues.status} 
                        onValueChange={(v) => setEditValues(prev => ({ ...prev, status: v as TaskStatus }))}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="cursor-pointer" onClick={() => startEdit(task)}>
                        <TaskStatusBadge status={task.status} />
                      </span>
                    )}
                  </TableCell>

                  {/* Urgency */}
                  <TableCell>
                    {editingId === task.id ? (
                      <Select 
                        value={editValues.urgency} 
                        onValueChange={(v) => setEditValues(prev => ({ ...prev, urgency: v as TaskUrgency }))}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border z-50">
                          {URGENCY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="cursor-pointer" onClick={() => startEdit(task)}>
                        <TaskUrgencyBadge urgency={task.urgency} />
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    {editingId === task.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          onClick={saveEdit}
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={cancelEdit}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteId(task.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
