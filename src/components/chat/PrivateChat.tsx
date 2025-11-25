import { useState, useEffect, useRef } from 'react';
import { Send, Users, X, MessageCircle, Bot, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getAllUsers,
  getOrCreateConversation,
  sendPrivateMessage,
  subscribeToPrivateMessages,
  User,
  PrivateMessage,
} from '../../services/chatService';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';

export default function PrivateChat() {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [showAIBanner, setShowAIBanner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToPrivateMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      const filteredUsers = allUsers.filter((u) => u.uid !== currentUser?.uid);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSelectUser = async (user: User) => {
    if (!currentUser) return;

    setSelectedUser(user);
    setMessages([]);
    setShowUserList(false);

    const hasSeenPrivateAIWelcome = localStorage.getItem('hasSeenPrivateAIWelcome');
    if (!hasSeenPrivateAIWelcome) {
      setShowAIBanner(true);
      localStorage.setItem('hasSeenPrivateAIWelcome', 'true');
    }

    try {
      const convId = await getOrCreateConversation(
        currentUser.uid,
        currentUser.name,
        currentUser.role,
        user.uid,
        user.name,
        user.role
      );
      setConversationId(convId);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !conversationId || !currentUser || isSending) return;

    setIsSending(true);
    try {
      await sendPrivateMessage(
        conversationId,
        currentUser.uid,
        currentUser.role as 'student' | 'mentor' | 'governor',
        messageText
      );
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getCountryFlag = (country?: string) => {
    const flags: Record<string, string> = {
      'United Arab Emirates': '🇦🇪',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'India': '🇮🇳',
      'Philippines': '🇵🇭',
      'Pakistan': '🇵🇰',
      'Egypt': '🇪🇬',
      'South Africa': '🇿🇦',
    };
    return flags[country || ''] || '🌍';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'mentor':
        return 'bg-red-100 text-red-700';
      case 'governor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-full">
      <div
        className={`${
          showUserList ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 border-r-2 border-gray-200 bg-gray-50`}
      >
        <div className="p-4 border-b-2 border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D71921]" />
            <h3 className="font-bold text-[#000000]">Available Users</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm">No users available</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-4 text-left hover:bg-white transition ${
                    selectedUser?.uid === user.uid ? 'bg-white border-l-4 border-[#D71921]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {user.photoURL || user.profilePicture || user.photo_base64 ? (
                      <img
                        src={user.photoURL || user.profilePicture || user.photo_base64}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-10 h-10 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-full flex items-center justify-center text-white font-bold" style={{ display: user.photoURL || user.profilePicture || user.photo_base64 ? 'none' : 'flex' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#000000] truncate">{user.name}</p>
                        <span className="text-lg">{getCountryFlag(user.country)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                        {user.isOnline && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b-2 border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowUserList(true)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Users className="w-5 h-5" />
                </button>
                {selectedUser.photoURL || selectedUser.profilePicture || selectedUser.photo_base64 ? (
                  <img
                    src={selectedUser.photoURL || selectedUser.profilePicture || selectedUser.photo_base64}
                    alt={selectedUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-10 h-10 bg-gradient-to-br from-[#D71921] to-[#B91518] rounded-full flex items-center justify-center text-white font-bold" style={{ display: selectedUser.photoURL || selectedUser.profilePicture || selectedUser.photo_base64 ? 'none' : 'flex' }}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[#000000]">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{selectedUser.role}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setConversationId(null);
                  setMessages([]);
                  setShowUserList(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
              {showAIBanner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-3 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-blue-900 text-sm">AI Moderator</h4>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      </div>
                      <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                        👋 This conversation is AI-moderated for your safety. All messages are reviewed to ensure a respectful environment.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAIBanner(false)}
                      className="text-blue-600 hover:text-blue-800 transition p-1 flex-shrink-0"
                      aria-label="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">
                    Start your conversation
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Send a message to {selectedUser.name} to begin chatting.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      text={message.text}
                      senderRole={message.senderRole}
                      createdAt={message.createdAt}
                      isOwn={message.senderId === currentUser?.uid}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="border-t-2 border-gray-200 p-4 bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${selectedUser.name}...`}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  disabled={isSending}
                />
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() || isSending}
                  className="px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  Press Enter to send, Shift+Enter for new line
                </p>
                <div className="flex items-center gap-1.5 text-xs text-blue-600">
                  <Shield className="w-3 h-3" />
                  <span className="font-medium">AI Moderated</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <button
              onClick={() => setShowUserList(true)}
              className="md:hidden mb-6 px-6 py-3 bg-[#D71921] text-white rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Show Users
            </button>
            <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">
              Select a user to start chatting
            </h3>
            <p className="text-gray-500 max-w-md">
              Choose someone from the list to begin a private conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
