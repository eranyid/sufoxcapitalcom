import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  last_message?: Message | null;
  unread_count: number;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  profile?: { display_name: string | null; email: string | null; avatar_url: string | null };
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: 'text' | 'file' | 'analysis_share';
  content: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  file_content_type: string | null;
  analysis_id: string | null;
  analysis_type: string | null;
  analysis_title: string | null;
  analysis_snapshot: Record<string, unknown> | null;
  created_at: string;
  sender_profile?: { display_name: string | null; email: string | null; avatar_url: string | null };
}

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      // Fetch conversations where user is participant
      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // For each conversation, fetch participants and last message
      const enriched: Conversation[] = await Promise.all(
        (convos || []).map(async (c) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', c.id);

          // Get profile info for each participant
          const enrichedParticipants = await Promise.all(
            (participants || []).map(async (p) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, email, avatar_url')
                .eq('id', p.user_id)
                .maybeSingle();
              return { ...p, profile } as ConversationParticipant;
            })
          );

          // Get last message
          const { data: lastMsgs } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', c.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Calculate unread
          const myParticipant = enrichedParticipants.find(p => p.user_id === user.id);
          const lastReadAt = myParticipant?.last_read_at;
          let unread_count = 0;
          if (lastReadAt) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', c.id)
              .gt('created_at', lastReadAt)
              .neq('sender_id', user.id);
            unread_count = count || 0;
          }

          const lastMsg = lastMsgs?.[0] ? {
            ...lastMsgs[0],
            message_type: lastMsgs[0].message_type as 'text' | 'file' | 'analysis_share',
            analysis_snapshot: lastMsgs[0].analysis_snapshot as Record<string, unknown> | null,
          } : null;

          return {
            ...c,
            type: c.type as 'direct' | 'group',
            participants: enrichedParticipants,
            last_message: lastMsg,
            unread_count,
          };
        })
      );

      setConversations(enriched);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  const createConversation = async (participantIds: string[], name?: string, type: 'direct' | 'group' = 'direct') => {
    if (!user) return null;

    // For direct conversations, check if one already exists
    if (type === 'direct' && participantIds.length === 1) {
      const existing = conversations.find(c => 
        c.type === 'direct' && 
        c.participants.length === 2 &&
        c.participants.some(p => p.user_id === participantIds[0])
      );
      if (existing) return existing.id;
    }

    try {
      const { data: convo, error } = await supabase
        .from('conversations')
        .insert({ type, name: name || null, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      // Add all participants including the creator
      const allParticipants = [user.id, ...participantIds].map(uid => ({
        conversation_id: convo.id,
        user_id: uid,
      }));

      const { error: pError } = await supabase
        .from('conversation_participants')
        .insert(allParticipants);

      if (pError) throw pError;

      await fetchConversations();
      return convo.id;
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
      return null;
    }
  };

  return { conversations, loading, createConversation, refetch: fetchConversations };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enrich with sender profiles
      const enriched = await Promise.all(
        (data || []).map(async (m) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email, avatar_url')
            .eq('id', m.sender_id)
            .maybeSingle();
          return {
            ...m,
            message_type: m.message_type as 'text' | 'file' | 'analysis_share',
            analysis_snapshot: m.analysis_snapshot as Record<string, unknown> | null,
            sender_profile: profile,
          } as Message;
        })
      );

      setMessages(enriched);

      // Mark as read
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time for this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email, avatar_url')
          .eq('id', newMsg.sender_id)
          .maybeSingle();

        setMessages(prev => [...prev, {
          ...newMsg,
          message_type: newMsg.message_type as 'text' | 'file' | 'analysis_share',
          analysis_snapshot: newMsg.analysis_snapshot as Record<string, unknown> | null,
          sender_profile: profile,
        }]);

        // Mark as read
        if (newMsg.sender_id !== user?.id) {
          await supabase
            .from('conversation_participants')
            .update({ last_read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .eq('user_id', user?.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;
    await supabase.from('messages').insert([{
      conversation_id: conversationId,
      sender_id: user.id,
      message_type: 'text',
      content: content.trim(),
    }]);
    // Update conversation updated_at
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  };

  const sendFile = async (file: File) => {
    if (!conversationId || !user) return;
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('message-files')
      .upload(filePath, file);
    if (uploadError) { console.error(uploadError); return; }

    await supabase.from('messages').insert([{
      conversation_id: conversationId,
      sender_id: user.id,
      message_type: 'file',
      content: file.name,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_content_type: file.type,
    }]);
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  };

  const sendAnalysisShare = async (analysisId: string, analysisType: string, analysisTitle: string, snapshot?: Record<string, unknown>) => {
    if (!conversationId || !user) return;
    await supabase.from('messages').insert([{
      conversation_id: conversationId,
      sender_id: user.id,
      message_type: 'analysis_share',
      content: `Shared analysis: ${analysisTitle}`,
      analysis_id: analysisId,
      analysis_type: analysisType,
      analysis_title: analysisTitle,
      analysis_snapshot: (snapshot || null) as any,
    }]);
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  };

  return { messages, loading, sendMessage, sendFile, sendAnalysisShare, refetch: fetchMessages };
}
