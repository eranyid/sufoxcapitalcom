import { useState } from 'react';
import { useConversations, useMessages } from '@/hooks/useConversations';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageThread } from '@/components/messages/MessageThread';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Messages = () => {
  const isMobile = useIsMobile();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const { conversations, loading: convLoading, createConversation } = useConversations();
  const { messages, loading: msgLoading, sendMessage, sendFile, sendAnalysisShare } = useMessages(selectedConvId);

  const selectedConversation = conversations.find(c => c.id === selectedConvId) || null;

  // Mobile: show either list or thread
  const showThread = isMobile ? selectedConvId !== null : true;
  const showList = isMobile ? selectedConvId === null : true;

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] flex rounded-md overflow-hidden border border-border bg-card">
      {/* Conversation List */}
      {showList && (
        <div className={cn("flex-shrink-0", isMobile ? "w-full" : "w-72")}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedConvId}
            onSelect={setSelectedConvId}
            onNewConversation={createConversation}
          />
        </div>
      )}

      {/* Message Thread */}
      {showThread && (
        <MessageThread
          conversation={selectedConversation}
          messages={messages}
          loading={msgLoading}
          onSendMessage={(content, replyToId) => sendMessage(content, replyToId)}
          onSendFile={sendFile}
          onSendAnalysis={sendAnalysisShare}
          onBack={isMobile ? () => setSelectedConvId(null) : undefined}
        />
      )}
    </div>
  );
};

export default Messages;
