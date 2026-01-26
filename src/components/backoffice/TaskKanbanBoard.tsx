import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CrmTask, TaskStatus, STATUS_OPTIONS } from '@/types/crm';
import { TaskKanbanCard } from './TaskKanbanCard';
import { TaskDetailsPanel } from '@/components/crm/TaskDetailsPanel';

interface TaskKanbanBoardProps {
  tasks: CrmTask[];
  onUpdateTask: (id: string, updates: Partial<CrmTask>) => Promise<boolean>;
  onDeleteTask: (id: string) => Promise<boolean>;
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'backlog', label: 'Backlog', color: 'border-gray-500/50' },
  { status: 'planned', label: 'Planned', color: 'border-blue-500/50' },
  { status: 'in_progress', label: 'In Progress', color: 'border-amber-500/50' },
  { status: 'completed', label: 'Completed', color: 'border-emerald-500/50' },
  { status: 'canceled', label: 'Canceled', color: 'border-red-500/50' },
];

export function TaskKanbanBoard({ tasks, onUpdateTask, onDeleteTask }: TaskKanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<CrmTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<CrmTask | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if dropped on a column
    const targetColumn = COLUMNS.find(col => col.status === over.id);
    if (targetColumn && task.status !== targetColumn.status) {
      await onUpdateTask(taskId, { status: targetColumn.status });
    }
  };

  const handleCardClick = (task: CrmTask) => {
    setSelectedTask(task);
    setPanelOpen(true);
  };

  const handleTaskUpdate = async (id: string, field: keyof CrmTask, value: string | null) => {
    await onUpdateTask(id, { [field]: value });
    if (selectedTask?.id === id) {
      setSelectedTask(prev => prev ? { ...prev, [field]: value } : null);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map(column => {
            const columnTasks = getTasksByStatus(column.status);
            return (
              <div
                key={column.status}
                id={column.status}
                className={`flex-shrink-0 w-[280px] bg-muted/20 rounded-lg border-t-2 ${column.color}`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-foreground">{column.label}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Body */}
                <SortableContext
                  id={column.status}
                  items={columnTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-2 space-y-2 min-h-[200px]">
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <TaskKanbanCard
                          key={task.id}
                          task={task}
                          onClick={() => handleCardClick(task)}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-card border border-primary rounded-lg p-3 shadow-xl opacity-90">
              <h4 className="text-sm font-medium text-foreground">
                {activeTask.task_name}
              </h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Details Panel */}
      <TaskDetailsPanel
        task={selectedTask}
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={handleTaskUpdate}
        onDelete={onDeleteTask}
      />
    </>
  );
}
