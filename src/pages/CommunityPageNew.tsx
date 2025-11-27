import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { aiModeratorBotService } from '../services/aiModeratorBotService';
import { auth } from '../lib/firebase';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';
import ChatLayout from '../components/chat/ChatLayout';
import SidebarConversations from '../components/chat/SidebarConversations';
import TopNavChat from '../components/chat/TopNavChat';
import MessageList from '../components/chat/MessageList';
import ChatComposer from '../components/chat/ChatComposer';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { MessageCircle } from 'lucide-react';

export default function CommunityPageNew() {
  const { currentUser } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);
  const moderatorUnsubscribeRef = useRef<(() => void) | null>(null);

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
      if (moderatorUnsubscribeRef.current) {
        moderatorUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedConversation && selectedConversation.id === 'publicRoom') {
      if (moderatorUnsubscribeRef.current) {
        moderatorUnsubscribeRef.current();
      }

      moderatorUnsubscribeRef.current = aiModeratorBotService.subscribeToConversationForModeration(
        selectedConversation.id,
        (message) => {
          aiModeratorBotService.monitorMessage(selectedConversation.id, message);
        }
      );
    }

    return () => {
      if (moderatorUnsubscribeRef.current) {
        moderatorUnsubscribeRef.current();
        moderatorUnsubscribeRef.current = null;
      }
    };
  }, [selectedConversation]);

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

  const handleNavigateToMessage = (conversationId: string, messageId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
      setTimeout(() => {
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('animate-pulse');
          setTimeout(() => messageElement.classList.remove('animate-pulse'), 2000);
        }
      }, 100);
    }
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
    <ChatLayout
      sidebar={
        <SidebarConversations
          conversations={conversations}
          selectedConversationId={selectedConversation?.id || null}
          currentUserId={currentUser.uid}
          onSelectConversation={handleSelectConversation}
        />
      }
      navbar={
        <TopNavChat
          conversation={selectedConversation}
          currentUserId={currentUser.uid}
          onNavigateToMessage={handleNavigateToMessage}
        />
      }
      messages={
        selectedConversation ? (
          <MessageList
            messages={messages}
            currentUserId={currentUser.uid}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMoreMessages}
            typingUsers={typingUsers}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 text-lg font-medium">Select a conversation</p>
              <p className="text-gray-500 text-sm mt-1">Choose from your conversations to start chatting</p>
            </div>
          </div>
        )
      }
      composer={
        selectedConversation ? (
          <ChatComposer
            onSend={handleSendMessage}
            onTyping={startTyping}
            disabled={sending}
            placeholder={`Message ${selectedConversation.title}...`}
            conversationMembers={selectedConversation.members || []}
          />
        ) : (
          <div className="p-4 text-center text-gray-400 text-sm">
            Select a conversation to start messaging
          </div>
        )
      }
    />
  );
}
