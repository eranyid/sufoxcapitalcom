import { useEffect, useCallback } from 'react';
import { X, MessageSquare, Paperclip, Activity } from 'lucide-react';
import { CrmTask, STATUS_OPTIONS, URGENCY_OPTIONS } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { TaskStatusBadge } from './TaskStatusBadge';
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
}

export function TaskDetailsPanel({ task, isOpen, onClose, onUpdate }: Props) {
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
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9">
              <X size={18} />
            </Button>
          </div>

          {/* Status & Urgency - Mobile optimized with wrapping */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
            <Select
              value={task.status}
              onValueChange={v => onUpdate(task.id, 'status', v, task.status)}
            >
              <SelectTrigger className="h-7 sm:h-8 w-auto gap-1.5 sm:gap-2 border-border bg-muted/30 text-xs sm:text-sm">
                <TaskStatusBadge status={task.status} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={task.urgency}
              onValueChange={v => onUpdate(task.id, 'urgency', v, task.urgency)}
            >
              <SelectTrigger className="h-7 sm:h-8 w-auto gap-1.5 sm:gap-2 border-border bg-muted/30 text-xs sm:text-sm">
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
              className="h-7 sm:h-8 w-auto text-[10px] sm:text-xs border-border bg-muted/30"
              onBlur={e => {
                if (e.target.value !== (task.due_date || '')) {
                  onUpdate(task.id, 'due_date', e.target.value || null, task.due_date);
                }
              }}
            />
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
      </div>
    </>
  );
}
