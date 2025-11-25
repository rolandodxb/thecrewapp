import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { auth } from '../lib/firebase';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';

export default function ChatPage() {
  const { currentUser } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);

  const { messages, loading, hasMore, loadMoreMessages } = useChatMessages(
    selectedConversation?.id || null
  );

  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    selectedConversation?.id || null,
    currentUser?.uid || '',
    currentUser?.name || ''
  );

  useEffect(() => {
    const chatId = searchParams.get('chat');
    if (chatId && conversations.length > 0) {
      const conversation = conversations.find((c) => c.id === chatId);
      if (conversation) {
        setSelectedConversation(conversation);
        setSearchParams({});
      }
    }
  }, [searchParams, conversations, setSearchParams]);

  useEffect(() => {
    const initCommunityChat = async () => {
      try {
        await communityChatService.ensureCommunityChat();
        const userId = auth.currentUser?.uid;
        if (userId) {
          await communityChatService.joinCommunityChat(userId);
        }
      } catch (error) {
        console.error('Error initializing community chat:', error);
      }
    };

    initCommunityChat();
    presenceService.initializePresence();

    const unsubscribeConversations = communityChatService.subscribeToConversations((convs) => {
      setConversations(convs);
    });

    return () => {
      presenceService.cleanup();
      unsubscribeConversations();
    };
  }, []);

  const handleSendMessage = async (message: string, file?: File) => {
    if (!currentUser || !selectedConversation || !message.trim()) return;

    setSending(true);
    try {
      await communityChatService.sendMessage(
        selectedConversation.id,
        message,
        file ? 'image' : 'text',
        file
      );
      stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  if (!currentUser) return null;

  const chatAccess = checkFeatureAccess(currentUser, 'chat');
  if (!chatAccess.allowed) {
    return (
      <FeatureLock
        requiredPlan={chatAccess.requiresPlan || 'pro'}
        featureName="Community Chat"
        description={chatAccess.message}
      />
    );
  }

  return (
    <div className="h-screen bg-white">
      {!selectedConversation ? (
        <div className="h-full max-w-2xl mx-auto">
          <ChatSidebar
            conversations={conversations}
            selectedConversationId={null}
            currentUserId={currentUser.uid}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      ) : (
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          currentUserId={currentUser.uid}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMoreMessages}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onTyping={startTyping}
          sending={sending}
          onBack={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
}
