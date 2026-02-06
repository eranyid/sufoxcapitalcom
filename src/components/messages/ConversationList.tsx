import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Conversation } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { NewConversationDialog } from './NewConversationDialog';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewConversation: (participantIds: string[], name?: string, type?: 'direct' | 'group') => Promise<string | null>;
}

export function ConversationList({ conversations, selectedId, onSelect, onNewConversation }: ConversationListProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  const getConversationDisplay = (conv: Conversation) => {
    if (conv.type === 'group' && conv.name) return conv.name;
    const otherParticipants = conv.participants.filter(p => p.user_id !== user?.id);
    if (otherParticipants.length === 0) return 'You';
    return otherParticipants.map(p => p.profile?.display_name || p.profile?.email || 'Unknown').join(', ');
  };

  const getInitials = (conv: Conversation) => {
    const name = getConversationDisplay(conv);
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const display = getConversationDisplay(c).toLowerCase();
    return display.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-mono font-semibold text-foreground tracking-wider">MESSAGES</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowNew(true)}>
            <Plus size={14} />
          </Button>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-muted/30 border-border"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {conversations.length === 0 ? 'No conversations yet' : 'No results'}
          </div>
        )}
        {filtered.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 border-b border-border/50 text-left transition-colors",
              "hover:bg-muted/30",
              selectedId === conv.id && "bg-primary/10 border-l-2 border-l-primary"
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-[10px] bg-muted text-foreground font-mono">
                {getInitials(conv)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground truncate">
                  {getConversationDisplay(conv)}
                </span>
                {conv.last_message && (
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-muted-foreground truncate">
                  {conv.last_message?.message_type === 'file' ? `📎 ${conv.last_message.file_name}` :
                   conv.last_message?.message_type === 'analysis_share' ? `📊 ${conv.last_message.analysis_title}` :
                   conv.last_message?.content || 'No messages yet'}
                </p>
                {conv.unread_count > 0 && (
                  <span className="shrink-0 ml-2 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <NewConversationDialog
        open={showNew}
        onOpenChange={setShowNew}
        onCreateConversation={async (ids, name, type) => {
          const id = await onNewConversation(ids, name, type);
          if (id) { onSelect(id); setShowNew(false); }
        }}
      />
    </div>
  );
}
