import { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, BarChart3, ArrowLeft, FileText, Image, File, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message, Conversation } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { AnalysisShareCard } from './AnalysisShareCard';
import { ShareAnalysisDialog } from './ShareAnalysisDialog';
import { SendCalendarInviteDialog } from './SendCalendarInviteDialog';

interface MessageThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onSendAnalysis: (analysisId: string, analysisType: string, analysisTitle: string, snapshot?: Record<string, unknown>) => Promise<void>;
  onBack?: () => void;
}

export function MessageThread({ conversation, messages, loading, onSendMessage, onSendFile, onSendAnalysis, onBack }: MessageThreadProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showShareAnalysis, setShowShareAnalysis] = useState(false);
  const [showCalendarInvite, setShowCalendarInvite] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await onSendMessage(input);
    setInput('');
    setSending(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onSendFile(file);
    e.target.value = '';
  };

  const getConversationTitle = () => {
    if (!conversation) return '';
    if (conversation.type === 'group' && conversation.name) return conversation.name;
    const others = conversation.participants.filter(p => p.user_id !== user?.id);
    return others.map(p => p.profile?.display_name || p.profile?.email || 'Unknown').join(', ');
  };

  const getParticipantCount = () => conversation?.participants.length || 0;

  const getFileIcon = (contentType: string | null) => {
    if (contentType?.startsWith('image/')) return <Image size={16} className="text-primary" />;
    if (contentType?.includes('pdf')) return <FileText size={16} className="text-destructive" />;
    return <File size={16} className="text-muted-foreground" />;
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('message-files').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-20">💬</div>
          <p className="text-sm text-muted-foreground font-mono">Select a conversation</p>
          <p className="text-xs text-muted-foreground/60 mt-1">or start a new one</p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedByDate: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const dateStr = format(new Date(msg.created_at), 'MMMM d, yyyy');
    const lastGroup = groupedByDate[groupedByDate.length - 1];
    if (lastGroup?.date === dateStr) {
      lastGroup.msgs.push(msg);
    } else {
      groupedByDate.push({ date: dateStr, msgs: [msg] });
    }
  });

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        {onBack && (
          <Button variant="ghost" size="icon" className="h-7 w-7 md:hidden" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
        )}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-mono">
            {getConversationTitle().substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xs font-semibold text-foreground">{getConversationTitle()}</h3>
          <p className="text-[10px] text-muted-foreground">
            {getParticipantCount()} participant{getParticipantCount() !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1 relative"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / 0.04) 1px, transparent 1px)`,
          backgroundSize: '14px 14px',
        }}
      >
        {loading && <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>}
        {groupedByDate.map(group => (
          <div key={group.date}>
            <div className="flex items-center justify-center my-3">
              <span className="text-[10px] text-muted-foreground/60 bg-muted/20 px-3 py-0.5 rounded-full font-mono">
                {group.date}
              </span>
            </div>
            {group.msgs.map(msg => {
              const isOwn = msg.sender_id === user?.id;
              const senderName = msg.sender_profile?.display_name || msg.sender_profile?.email || 'Unknown';

              return (
                <div key={msg.id} className={cn("mb-2", isOwn ? "flex justify-end" : "flex justify-start")}>
                  <div className={cn("max-w-[75%] md:max-w-[60%]")}>
                    {/* Sender name */}
                    {!isOwn && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                          {senderName}
                        </span>
                      </div>
                    )}

                    <div className={cn(
                      "rounded-md px-3 py-2",
                      isOwn ? "bg-primary/15 border border-primary/20" : "bg-muted/40 border border-border"
                    )}>
                      {msg.message_type === 'text' && (
                        <p className="text-xs text-foreground whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {msg.message_type === 'file' && (
                        <button
                          onClick={() => msg.file_path && handleDownloadFile(msg.file_path, msg.file_name || 'file')}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          {getFileIcon(msg.file_content_type)}
                          <div className="text-left">
                            <p className="text-xs text-foreground font-medium truncate max-w-[200px]">
                              {msg.file_name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {msg.file_size ? `${(msg.file_size / 1024).toFixed(0)} KB` : ''}
                            </p>
                          </div>
                        </button>
                      )}

                      {msg.message_type === 'analysis_share' && (
                        <AnalysisShareCard
                          title={msg.analysis_title || 'Analysis'}
                          type={msg.analysis_type || 'unknown'}
                          snapshot={msg.analysis_snapshot}
                          senderName={senderName}
                          analysisId={msg.analysis_id || undefined}
                        />
                      )}
                    </div>

                    <p className={cn(
                      "text-[9px] text-muted-foreground/50 mt-0.5 font-mono",
                      isOwn ? "text-right" : "text-left"
                    )}>
                      {format(new Date(msg.created_at), 'HH:mm:ss')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.xlsx,.csv,.xls,.doc,.docx,.png,.jpg,.jpeg,.gif"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
            onClick={() => setShowShareAnalysis(true)}
          >
            <BarChart3 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
            onClick={() => setShowCalendarInvite(true)}
            title="Send calendar invite"
          >
            <CalendarPlus size={14} />
          </Button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Enter message"
            className="h-8 text-xs bg-muted/20 border-border flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            <Send size={14} />
          </Button>
        </div>
      </div>

      <ShareAnalysisDialog
        open={showShareAnalysis}
        onOpenChange={setShowShareAnalysis}
        onShareAnalysis={(id, type, title, snapshot) => {
          onSendAnalysis(id, type, title, snapshot);
          setShowShareAnalysis(false);
        }}
      />

      <SendCalendarInviteDialog
        open={showCalendarInvite}
        onOpenChange={setShowCalendarInvite}
        onSendInvite={onSendAnalysis}
      />
    </div>
  );
}
