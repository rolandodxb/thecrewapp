import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { auth } from '../lib/firebase';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { Search, Mic, Send, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CommunityPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showMobileMessages, setShowMobileMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading } = useChatMessages(selectedConversation?.id || null);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
    selectedConversation?.id || null,
    currentUser?.uid || '',
    currentUser?.name || ''
  );

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

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-4 gap-4 overflow-hidden">
      {/* Left Sidebar - Full screen on mobile when no conversation selected */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className={`${showMobileMessages ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col gap-3`}
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

        {/* Search Input */}
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

        {/* Conversation List Card */}
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
                  onClick={() => {
                    setSelectedConversation(conv);
                    setShowMobileMessages(true);
                  }}
                  className={`w-full px-3 py-3 text-left rounded-2xl hover:bg-gray-50 transition mb-2 ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
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

      {/* Main Chat Area */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 0.1 }}
        className={`${!showMobileMessages ? 'hidden md:flex' : 'flex'} flex-1 bg-white rounded-3xl shadow-lg overflow-hidden flex-col w-full`}
      >
        {selectedConversation ? (
          <>
            {/* Top Bar with Back Button */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button
                onClick={() => setShowMobileMessages(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-11 pr-11 py-2.5 bg-gray-50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Messages Area */}
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
                    {messages.map((message, index) => {
                      const isOwn = message.senderId === currentUser?.uid;
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            delay: index * 0.02
                          }}
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
                                <p className="text-xs font-semibold mb-1 opacity-70">
                                  {message.senderName}
                                </p>
                              )}
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>
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

            {/* Message Input */}
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
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Message</h3>
              <p className="text-sm text-gray-500">Description</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
