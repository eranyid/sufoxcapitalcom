import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTaskUpdates, TaskUpdate } from '@/hooks/useTaskUpdates';

interface Props {
  taskId: string;
}

export function TaskUpdatesTab({ taskId }: Props) {
  const { updates, loading, fetchUpdates, createUpdate } = useTaskUpdates(taskId);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const handlePost = async () => {
    if (!content.trim()) return;
    
    setPosting(true);
    await createUpdate(content);
    setContent('');
    setPosting(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input Section */}
      <div className="p-4 border-b border-border">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write an update..."
          className="min-h-[100px] resize-none bg-muted/30 border-border"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            Press ⌘+Enter to post
          </span>
          <Button 
            onClick={handlePost} 
            disabled={!content.trim() || posting}
            size="sm"
          >
            <Send size={14} className="mr-1.5" />
            Post Update
          </Button>
        </div>
      </div>

      {/* Updates List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-muted/30 animate-pulse rounded" />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-muted-foreground">No updates yet</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Be the first to add an update
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {updates.map(update => (
              <UpdateItem key={update.id} update={update} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UpdateItem({ update }: { update: TaskUpdate }) {
  return (
    <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xs text-primary font-medium">U</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(update.created_at), 'MMM d, yyyy · h:mm a')}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{update.content}</p>
    </div>
  );
}
