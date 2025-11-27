import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { auth } from '../lib/firebase';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { Search, Mic, Send, ArrowLeft } from 'lucide-react';
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
    <div className="h-[100svh] w-full flex bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-hidden">

      {/* MOBILE BEHAVIOR */}
      <div className="flex w-full h-full">

        {/* SIDEBAR (hidden on mobile if chat is open) */}
        <motion.div
          className={`w-full md:w-80 flex-shrink-0 flex flex-col gap-3 p-4 transition-all duration-300
            ${selectedConversation ? 'hidden md:flex' : 'flex'}
          `}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              home
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search"
              className="w-full pl-11 py-2.5 bg-white rounded-full text-sm text-gray-700 shadow-sm"
            />
          </div>

          <div className="flex-1 bg-white rounded-3xl shadow-lg overflow-y-auto">
            <div className="p-4">
              <p className="text-sm text-gray-500 font-medium">conversation list</p>
            </div>

            <div className="px-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full px-3 py-3 mb-2 text-left rounded-2xl hover:bg-gray-50 transition ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full text-white flex items-center justify-center font-bold">
                      {conv.title?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{conv.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{conv.members?.length} members</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CHAT WINDOW (hidden on mobile until open) */}
        <motion.div
          className={`flex-1 bg-white rounded-none md:rounded-3xl shadow-lg flex flex-col overflow-hidden transition-all duration-300
            ${selectedConversation ? 'flex' : 'hidden md:flex'}
          `}
        >
          {selectedConversation && (
            <>
              {/* BACK BUTTON (mobile only) */}
              <div className="md:hidden flex items-center gap-3 p-4 border-b">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h2 className="font-semibold text-gray-800">{selectedConversation.title}</h2>
              </div>

              {/* MESSAGES */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.map((message, index) => {
                  const isOwn = message.senderId === currentUser.uid;
                  return (
                    <div key={index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-4 py-3 rounded-2xl mb-3 ${
                          isOwn
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        {!isOwn && (
                          <p className="text-xs font-semibold opacity-70">{message.senderName}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT BAR */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      startTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    placeholder="Type Message..."
                    className="flex-1 bg-gray-100 px-4 py-3 rounded-full"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="p-3 bg-blue-500 text-white rounded-full"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
