import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { auth } from '../lib/firebase';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { Search, Mic, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommunityPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading } = useChatMessages(selectedConversation?.id || null);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    selectedConversation?.id || null,
    currentUser?.uid || '',
    currentUser?.name || ''
  );

  const isMobile = window.innerWidth < 768;

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
      if (!selectedConversation && convs.length > 0) {
        setSelectedConversation(convs[0]);
      }
    });

    return () => {
      presenceService.cleanup();
      unsubscribeConversations();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentUser || !selectedConversation || !messageText.trim()) return;

    setSending(true);
    try {
      await communityChatService.sendMessage(
        selectedConversation.id,
        messageText.trim(),
        'text'
      );
      setMessageText('');
      stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to access community chat.</p>
      </div>
    );
  }

  // -----------------------------
  // FULL UI WITH MOBILE LOGIC
  // -----------------------------

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-4 gap-4 overflow-hidden">

      {/* MOBILE MODE */}
      {isMobile ? (
        <>
          {/* MOBILE: Conversation list only */}
          {!selectedConversation && (
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="w-full flex flex-col gap-3"
            >
              {/* Top Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                >
                  home
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="px-5 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                >
                  back
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="w-full pl-11 pr-11 py-2.5 bg-white rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm"
                />
                <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Conversation List */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col"
              >
                <div className="p-4">
                  <p className="text-sm text-gray-500 font-medium">conversation list</p>
                </div>

                <div className="flex-1 overflow-y-auto px-2">
                  <AnimatePresence mode="popLayout">
                    {filteredConversations.map((conv, index) => (
                      <motion.button
                        key={conv.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full px-3 py-3 text-left rounded-2xl hover:bg-gray-50 transition mb-2 ${selectedConversation?.id === conv.id ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {conv.title?.charAt(0) || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{conv.title}</h3>
                            <p className="text-xs text-gray-500 truncate">
                              {conv.members?.length || 0} members
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* MOBILE CHAT SCREEN */}
          {selectedConversation && (
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col"
            >
              {/* Mobile Back Button */}
              <div className="p-3 border-b border-gray-200 md:hidden">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="text-blue-600 font-medium"
                >
                  ← Back
                </button>
              </div>

              {/* --- CHAT SCREEN CONTENT --- */}
              {ChatScreen({
                selectedConversation,
                messages,
                loading,
                typingUsers,
                messageText,
                setMessageText,
                startTyping,
                handleSendMessage,
                sending,
                messagesEndRef,
                currentUser
              })}
            </motion.div>
          )}
        </>
      ) : (
        // ---------------------------------------------------------
        // DESKTOP MODE (unchanged split layout)
        // ---------------------------------------------------------
        <>
          {/* LEFT SIDEBAR */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="w-80 flex flex-col gap-3"
          >
            {/* Paste same sidebar from mobile here (identical code) */}
            {/* Top Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                home
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                back
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full pl-11 pr-11 py-2.5 bg-white rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm"
              />
              <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            {/* Conversation List */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col"
            >
              <div className="p-4">
                <p className="text-sm text-gray-500 font-medium">conversation list</p>
              </div>

              <div className="flex-1 overflow-y-auto px-2">
                <AnimatePresence mode="popLayout">
                  {filteredConversations.map((conv, index) => (
                    <motion.button
                      key={conv.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full px-3 py-3 text-left rounded-2xl hover:bg-gray-50 transition mb-2 ${selectedConversation?.id === conv.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {conv.title?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">{conv.title}</h3>
                          <p className="text-xs text-gray-500 truncate">
                            {conv.members?.length || 0} members
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>

          {/* CHAT PANEL (desktop) */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
            className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col"
          >
            {ChatScreen({
              selectedConversation,
              messages,
              loading,
              typingUsers,
              messageText,
              setMessageText,
              startTyping,
              handleSendMessage,
              sending,
              messagesEndRef,
              currentUser
            })}
          </motion.div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------
// CHAT SCREEN COMPONENT (shared for mobile & desktop)
// ------------------------------------------------------

function ChatScreen({
  selectedConversation,
  messages,
  loading,
  typingUsers,
  messageText,
  setMessageText,
  startTyping,
  handleSendMessage,
  sending,
  messagesEndRef,
  currentUser
}: any) {
  if (!selectedConversation) return null;

  return (
    <>
      {/* Top Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-11 pr-11 py-2.5 bg-gray-50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {!loading && messages.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-full flex flex-col items-center justify-center"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Message</h3>
              <p className="text-sm text-gray-500">Description</p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message: any, index: number) => {
                const isOwn = message.senderId === currentUser?.uid;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300, delay: index * 0.02 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {message.senderName?.charAt(0) || 'U'}
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isOwn
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-semibold mb-1 opacity-70">{message.senderName}</p>
                        )}

                        <p className="text-sm leading-relaxed">{message.content}</p>

                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-white/70' : 'text-gray-500'
                          }`}
                        >
                          {message.createdAt?.toDate?.()?.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <div className="flex gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                  />
                </div>
                <span>{typingUsers.join(', ')} typing...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                startTyping();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type Message"
              className="w-full pl-4 pr-11 py-3 bg-gray-100 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer hover:text-blue-500 transition" />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full hover:shadow-lg transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </>
  );
}
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
