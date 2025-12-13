import { useCrmTasks } from '@/hooks/useCrmTasks';
import { AddTaskDialog } from '@/components/crm/AddTaskDialog';
import { TasksTable } from '@/components/crm/TasksTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function CRMTasks() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useCrmTasks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/crm" className="inline-flex items-center text-xs text-muted-foreground hover:text-primary mb-2">
            <ChevronLeft size={14} className="mr-1" />
            Back to CRM
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Operational task management and workflow control</p>
        </div>
        <AddTaskDialog onAdd={createTask} />
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <TasksTable 
          tasks={tasks} 
          onUpdate={updateTask} 
          onDelete={deleteTask} 
        />
      )}
    </div>
  );
}
