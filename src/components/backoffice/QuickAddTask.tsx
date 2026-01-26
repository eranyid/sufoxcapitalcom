import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QuickAddTaskProps {
  onAdd: (name: string) => Promise<void>;
}

export function QuickAddTask({ onAdd }: QuickAddTaskProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    setIsSubmitting(true);
    await onAdd(taskName.trim());
    setTaskName('');
    setIsAdding(false);
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsAdding(false);
      setTaskName('');
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
      >
        <Plus className="h-4 w-4" />
        <span>Add new issue...</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 border-t border-border bg-muted/20">
      <Input
        autoFocus
        placeholder="Enter issue name..."
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={!taskName.trim() || isSubmitting}>
        Add
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          setIsAdding(false);
          setTaskName('');
        }}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
    </form>
  );
}
