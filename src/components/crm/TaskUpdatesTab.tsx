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
      {/* Input Section - Mobile optimized */}
      <div className="p-3 sm:p-4 border-b border-border">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write an update..."
          className="min-h-[80px] sm:min-h-[100px] resize-none bg-muted/30 border-border text-sm"
        />
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
            Press ⌘+Enter to post
          </span>
          <Button 
            onClick={handlePost} 
            disabled={!content.trim() || posting}
            size="sm"
            className="ml-auto h-9 px-4"
          >
            <Send size={14} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Post Update</span>
            <span className="sm:hidden">Post</span>
          </Button>
        </div>
      </div>

      {/* Updates List - Mobile optimized */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 sm:p-4 space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 sm:h-20 bg-muted/30 animate-pulse rounded" />
            ))}
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 sm:p-8">
            <MessageSquare size={40} className="text-muted-foreground/30 mb-3 sm:mb-4 sm:w-12 sm:h-12" />
            <h3 className="font-medium text-muted-foreground text-sm sm:text-base">No updates yet</h3>
            <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
              Be the first to add an update
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
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
    <div className="bg-muted/20 rounded-lg p-2.5 sm:p-3 border border-border/50">
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] sm:text-xs text-primary font-medium">U</span>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
          {format(new Date(update.created_at), 'MMM d, yyyy · h:mm a')}
        </span>
      </div>
      <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{update.content}</p>
    </div>
  );
}
