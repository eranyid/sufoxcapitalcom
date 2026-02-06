import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkUnread = async () => {
      // Get conversations where user is a participant
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (!participants || participants.length === 0) {
        setHasUnread(false);
        return;
      }

      // Check if any conversation has messages newer than last_read_at
      for (const p of participants) {
        const query = supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', p.conversation_id)
          .neq('sender_id', user.id);

        if (p.last_read_at) {
          query.gt('created_at', p.last_read_at);
        }

        const { count } = await query;
        if (count && count > 0) {
          setHasUnread(true);
          return;
        }
      }
      setHasUnread(false);
    };

    checkUnread();

    // Subscribe to new messages for real-time updates
    const channel = supabase
      .channel('unread-messages-indicator')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        checkUnread();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_participants' }, () => {
        checkUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return hasUnread;
}
