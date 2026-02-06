import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface RecentMessage {
  id: string;
  content: string | null;
  message_type: string;
  analysis_title: string | null;
  created_at: string;
  sender_name: string;
  conversation_id: string;
  conversation_name: string;
}

export function HeaderMessagesWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasUnread = useUnreadMessages();
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;

    const fetchRecent = async () => {
      // Get user's conversations
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!participants?.length) return;

      const convIds = participants.map(p => p.conversation_id);

      // Fetch recent messages from those conversations
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, content, message_type, analysis_title, created_at, sender_id, conversation_id')
        .in('conversation_id', convIds)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (!msgs?.length) { setRecentMessages([]); return; }

      // Enrich with sender profiles and conversation names
      const senderIds = [...new Set(msgs.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', senderIds);

      const uniqueConvIds = [...new Set(msgs.map(m => m.conversation_id))];
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, name')
        .in('id', uniqueConvIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const convoMap = new Map((convos || []).map(c => [c.id, c]));

      setRecentMessages(msgs.map(m => {
        const profile = profileMap.get(m.sender_id);
        const convo = convoMap.get(m.conversation_id);
        return {
          ...m,
          sender_name: profile?.display_name || profile?.email || 'Unknown',
          conversation_name: convo?.name || profile?.display_name || 'Chat',
        };
      }));
    };

    fetchRecent();
  }, [open, user]);

  const getPreview = (msg: RecentMessage) => {
    if (msg.message_type === 'text') return msg.content?.substring(0, 60) || '';
    if (msg.message_type === 'file') return '📎 File shared';
    if (msg.message_type === 'analysis_share') return `📊 ${msg.analysis_title || 'Shared item'}`;
    return msg.content?.substring(0, 60) || '';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted/50 transition-colors">
          <MessageSquare size={12} className="text-muted-foreground" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full border border-secondary" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 bg-card border-border">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-[10px] font-mono text-primary uppercase tracking-wider">Recent Messages</span>
          <button 
            onClick={() => { setOpen(false); navigate('/messages'); }}
            className="text-[9px] text-primary hover:underline font-medium"
          >
            View All
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {recentMessages.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-4">No recent messages</p>
          )}
          {recentMessages.map(msg => (
            <button
              key={msg.id}
              onClick={() => { setOpen(false); navigate('/messages'); }}
              className="w-full text-left px-3 py-2 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold text-foreground truncate">{msg.sender_name}</span>
                <span className="text-[8px] text-muted-foreground/60 font-mono shrink-0 ml-2">
                  {format(new Date(msg.created_at), 'HH:mm')}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{getPreview(msg)}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
