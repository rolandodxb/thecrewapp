import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { auth } from '../lib/firebase';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { Search, Mic, Send, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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

  // INIT COMMUNITY CHAT
  useEffect(() => {
    const init = async () => {
      await communityChatService.ensureCommunityChat();
      const userId = auth.currentUser?.uid;
      if (userId) await communityChatService.joinCommunityChat(userId);
    };

    init();
    presenceService.initializePresence();

    const unsub = communityChatService.subscribeToConversations((c) => {
      setConversations(c);
      if (!selectedConversation && c.length > 0) {
        setSelectedConversation(c[0]);
      }
    });

    return () => {
      presenceService.cleanup();
      unsub();
    };
  }, []);

  // SCROLL TO BOTTOM
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
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) return null;

  return (
    <div className="h-[100svh] w-full flex bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 overflow-hidden">

      {/* ============= LEFT SIDEBAR ============ */}
      <div
        className={`w-full md:w-80 h-full p-4 flex flex-col gap-3 overflow-hidden 
          ${selectedConversation ? 'hidden md:flex' : 'flex'}
        `}
      >
        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 bg-white rounded-full shadow-sm text-gray-700"
          >
            home
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="w-full pl-11 py-2.5 bg-white rounded-full shadow-sm text-gray-700"
          />
        </div>

        {/* CONVERSATIONS LIST */}
        <div className="flex-1 bg-white rounded-3xl shadow-lg overflow-y-auto">
          <div className="p-4">
            <p className="text-sm text-gray-500 font-medium">Conversation list</p>
          </div>

          <div className="px-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full px-3 py-3 mb-2 rounded-2xl text-left hover:bg-gray-50 ${
                  selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {conv.title?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {conv.title}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.members?.length} members
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ============= CHAT WINDOW ============ */}
      <motion.div
        className={`flex-1 bg-white flex flex-col overflow-hidden 
          ${selectedConversation ? 'flex' : 'hidden md:flex'}
        `}
      >
        {selectedConversation && (
          <>
            {/* ALWAYS VISIBLE BACK BUTTON (MOBILE) */}
            <div className="md:hidden flex items-center gap-3 p-4 border-b bg-white flex-shrink-0 sticky top-0 z-50">
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 bg-gray-200 rounded-full"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h2 className="font-semibold text-gray-800 truncate">
                {selectedConversation.title}
              </h2>
            </div>

            {/* DESKTOP HEADER */}
            <div className="hidden md:flex items-center p-4 border-b bg-white flex-shrink-0">
              <h2 className="font-semibold text-gray-800">
                {selectedConversation.title}
              </h2>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messages.map((msg, i) => {
                const isOwn = msg.senderId === currentUser.uid;
                return (
                  <div
                    key={i}
                    className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                        isOwn
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}
                    >
                      {!isOwn && (
                        <p className="text-xs font-semibold opacity-70">{msg.senderName}</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT BAR */}
            <div className="p-4 border-t bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    startTyping();
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type message..."
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
  );
}
