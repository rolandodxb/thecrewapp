import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { communityChatService, Conversation } from '../services/communityChatService';
import { presenceService } from '../services/presenceService';
import { auth, db } from '../lib/firebase';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import CreateConversationDropdown from '../components/chat/CreateConversationDropdown';
import { useChatMessages } from '../hooks/useChatMessages';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Home, User, Settings, LogOut, Bell, ChevronDown } from 'lucide-react';

export default function CommunityPage() {
  const { currentUser, logout } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleCreateConversation = () => {
    setShowCreateModal(true);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser || !selectedConversation) return;

    try {
      await communityChatService.addReaction(
        selectedConversation.id,
        messageId,
        emoji,
        currentUser.uid
      );
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentUser || !selectedConversation) return;

    try {
      await communityChatService.editMessage(
        selectedConversation.id,
        messageId,
        newContent
      );
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const handleReportMessage = async (messageId: string) => {
    if (!currentUser || !selectedConversation) return;

    const reason = prompt('Please provide a reason for reporting this message:');
    if (!reason || !reason.trim()) return;

    try {
      await communityChatService.reportMessage(
        selectedConversation.id,
        messageId,
        reason.trim()
      );
      alert('Message reported successfully. Our team will review it.');
    } catch (error) {
      console.error('Error reporting message:', error);
      alert('Failed to report message');
    }
  };

  const handleCreateGroup = async (title: string, memberIds: string[]) => {
    if (!currentUser) return;

    try {
      const conversationId = await communityChatService.createConversation(
        'group',
        title,
        memberIds
      );
      const newConv = conversations.find((c) => c.id === conversationId);
      if (newConv) {
        setSelectedConversation(newConv);
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  const handleCreatePrivate = async (memberId: string) => {
    if (!currentUser) return;

    try {
      const conversationId = await communityChatService.createConversation(
        'private',
        'Direct Message',
        [memberId]
      );
      const newConv = conversations.find((c) => c.id === conversationId);
      if (newConv) {
        setSelectedConversation(newConv);
      }
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating private chat:', error);
      alert('Failed to create private chat');
    }
  };

  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; photoURL?: string }>>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      try {
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '!=', currentUser.uid)
        );
        const snapshot = await getDocs(usersQuery);
        const users = snapshot.docs.map((doc) => ({
          id: doc.data().uid,
          name: doc.data().name || 'Unknown',
          photoURL: doc.data().photoURL,
        }));
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

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
    <>
      {/* Mobile View - Toggle between sidebar and chat */}
      <div className="h-full lg:hidden">
        {!selectedConversation ? (
          <ChatSidebar
            conversations={conversations}
            selectedConversationId={null}
            currentUserId={currentUser.uid}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
            showCreateForm={showCreateModal}
            createFormContent={
              <CreateConversationDropdown
                onClose={() => setShowCreateModal(false)}
                onCreateGroup={handleCreateGroup}
                onCreatePrivate={handleCreatePrivate}
                availableUsers={availableUsers}
              />
            }
          />
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
            onReact={handleReaction}
            onEdit={handleEditMessage}
            onReport={handleReportMessage}
          />
        )}
      </div>

      {/* Desktop View - Full screen with sidebar */}
      <div className="hidden lg:flex lg:fixed lg:inset-0 lg:z-10 lg:bg-gray-50">
        {/* Left sidebar with conversations and navigation */}
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
          {/* Top navigation header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-70 transition">
              <Home className="w-5 h-5 text-gray-700" />
              <span className="font-bold text-gray-900">Crew Academy</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link to="/notifications" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Bell className="w-5 h-5 text-gray-700" />
              </Link>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-medium">Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-900 font-medium">Settings</span>
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={() => {
                        logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat conversations list */}
          <div className="flex-1 overflow-hidden">
            <ChatSidebar
              conversations={conversations}
              selectedConversationId={selectedConversation?.id || null}
              currentUserId={currentUser.uid}
              onSelectConversation={handleSelectConversation}
              onCreateConversation={handleCreateConversation}
              showCreateForm={showCreateModal}
              createFormContent={
                <CreateConversationDropdown
                  onClose={() => setShowCreateModal(false)}
                  onCreateGroup={handleCreateGroup}
                  onCreatePrivate={handleCreatePrivate}
                  availableUsers={availableUsers}
                />
              }
            />
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
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
              onReact={handleReaction}
              onEdit={handleEditMessage}
              onReport={handleReportMessage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose from your conversations to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
