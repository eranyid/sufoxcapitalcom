import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CrmTask, TaskUrgency } from '@/types/crm';
import { TaskUrgencyBadge } from '@/components/crm/TaskUrgencyBadge';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';

interface TaskKanbanCardProps {
  task: CrmTask;
  onClick: () => void;
}

export function TaskKanbanCard({ task, onClick }: TaskKanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.due_date && 
    new Date(task.due_date) < new Date() && 
    task.status !== 'completed' && 
    task.status !== 'canceled';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-card border border-border rounded-lg p-3 cursor-pointer
        hover:bg-muted/30 transition-colors
        ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}
      `}
    >
      {/* Task Name */}
      <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2">
        {task.task_name}
      </h4>

      {/* Meta Info */}
      <div className="flex items-center justify-between gap-2">
        <TaskUrgencyBadge urgency={task.urgency as TaskUrgency} />
        
        {task.due_date && (
          <div className={`flex items-center gap-1 text-xs ${
            isOverdue ? 'text-red-400' : 'text-muted-foreground'
          }`}>
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(task.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>

      {/* Owner */}
      {task.owner && task.owner !== 'Me' && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{task.owner}</span>
        </div>
      )}
    </div>
  );
}
