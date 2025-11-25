import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, Search, Plus, X, Hash } from 'lucide-react';
import { communityChatService, Conversation } from '../../services/communityChatService';
import { getAllUsers, User } from '../../services/chatService';
import { auth } from '../../lib/firebase';

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
  onClose?: () => void;
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
  onClose,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [conversationType, setConversationType] = useState<'private' | 'group'>('private');
  const [groupTitle, setGroupTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const initCommunityChat = async () => {
      await communityChatService.ensureCommunityChat();
    };

    initCommunityChat();

    const unsubscribe = communityChatService.subscribeToConversations((convs) => {
      setConversations(convs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showNewConversation) {
      loadUsers();
    }
  }, [showNewConversation]);

  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      const currentUserId = auth.currentUser?.uid;
      const filteredUsers = users.filter((u) => u.uid !== currentUserId);
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    if (conversationType === 'group' && !groupTitle.trim()) {
      alert('Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) throw new Error('Not authenticated');

      const title = conversationType === 'private'
        ? availableUsers.find(u => u.uid === selectedUsers[0])?.name || 'Conversation'
        : groupTitle;

      const conversationId = await communityChatService.createConversation(
        conversationType,
        title,
        selectedUsers
      );

      setShowNewConversation(false);
      setSelectedUsers([]);
      setGroupTitle('');
      onSelectConversation(conversationId);
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      alert(error.message || 'Failed to create conversation');
    } finally {
      setCreating(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (conversationType === 'private') {
      setSelectedUsers([userId]);
    } else {
      setSelectedUsers(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
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
        return 'glass-bubble text-gray-700';
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupChats = filteredConversations.filter(c => c.type === 'group' || c.id === 'publicRoom');
  const privateChats = filteredConversations.filter(c => c.type === 'private');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D71921]"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 glass-light flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowNewConversation(true)}
            className="p-2 bg-gradient-to-r from-[#D71921] to-[#B01419] hover:shadow-lg rounded-xl transition-all"
            title="New conversation"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 glass-light border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D71921] focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto glass-light">
        {groupChats.length > 0 && (
          <div className="mb-1">
            <div className="px-4 py-2 glass-light border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Chats</h3>
                <span className="text-xs text-gray-400">({groupChats.length})</span>
              </div>
            </div>
            <div className="glass-light">
              {groupChats.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:glass-bubble transition-all border-b border-gray-100 ${
                    selectedConversationId === conversation.id
                      ? 'bg-[#D71921]/10 border-l-4 border-l-[#D71921]'
                      : ''
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 ${
                    conversation.id === 'publicRoom'
                      ? 'bg-gradient-to-br from-[#D71921] to-[#FF6B35] text-2xl'
                      : 'bg-gradient-to-br from-[#D71921] to-[#B01419]'
                  }`}>
                    {conversation.id === 'publicRoom' ? (
                      '🌍'
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-gray-900 truncate text-sm">
                        {conversation.title}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {conversation.lastMessage.createdAt.toDate().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {conversation.lastMessage ? (
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        No messages yet
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {conversation.members.length} members
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {privateChats.length > 0 && (
          <div>
            <div className="px-4 py-2 glass-light border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Private Chats</h3>
                <span className="text-xs text-gray-400">({privateChats.length})</span>
              </div>
            </div>
            <div className="glass-light">
              {privateChats.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:glass-bubble transition-all border-b border-gray-100 ${
                    selectedConversationId === conversation.id
                      ? 'bg-[#D71921]/10 border-l-4 border-l-[#D71921]'
                      : ''
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#D71920] to-[#B91518] shadow-md">
                    {conversation.photoURL ? (
                      <img
                        src={conversation.photoURL}
                        alt={conversation.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {conversation.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-gray-900 truncate text-sm">
                        {conversation.title}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {conversation.lastMessage.createdAt.toDate().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {conversation.lastMessage ? (
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        No messages yet
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <MessageCircle className="w-16 h-16 mb-4 text-gray-300" />
            <p className="font-medium">No conversations yet</p>
            <p className="text-sm text-gray-400 mt-1">Start a new chat to get started</p>
          </div>
        )}
      </div>

      {showNewConversation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-light rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">New Conversation</h2>
                <button
                  onClick={() => {
                    setShowNewConversation(false);
                    setSelectedUsers([]);
                    setGroupTitle('');
                  }}
                  className="p-2 hover:glass-bubble rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => {
                    setConversationType('private');
                    setSelectedUsers([]);
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl font-bold transition-colors ${
                    conversationType === 'private'
                      ? 'bg-gradient-to-r from-[#D71921] to-[#B01419] text-white shadow-lg'
                      : 'glass-bubble text-gray-700 hover:glass-light'
                  }`}
                >
                  Private Chat
                </button>
                <button
                  onClick={() => {
                    setConversationType('group');
                    setSelectedUsers([]);
                  }}
                  className={`flex-1 py-2 px-4 rounded-xl font-bold transition-colors ${
                    conversationType === 'group'
                      ? 'bg-gradient-to-r from-[#D71921] to-[#B01419] text-white shadow-lg'
                      : 'glass-bubble text-gray-700 hover:glass-light'
                  }`}
                >
                  Group Chat
                </button>
              </div>

              {conversationType === 'group' && (
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D71921] focus:border-transparent"
                />
              )}

              <p className="text-sm text-gray-600 mt-2">
                {conversationType === 'private'
                  ? 'Select one user to start a private conversation'
                  : `Select users to add to the group (${selectedUsers.length} selected)`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {availableUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users className="w-16 h-16 mb-4" />
                  <p>No users available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => toggleUserSelection(user.uid)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        selectedUsers.includes(user.uid)
                          ? 'border-[#D71921] bg-[#D71921]/10 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 glass-light hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#D71921] to-[#B01419] shadow-md">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900">{user.name}</p>
                            <span className="text-lg">{getCountryFlag(user.country)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeColor(
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
                        {selectedUsers.includes(user.uid) && (
                          <div className="w-6 h-6 bg-[#D71921] rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewConversation(false);
                    setSelectedUsers([]);
                    setGroupTitle('');
                  }}
                  className="flex-1 py-3 px-6 glass-bubble text-gray-700 rounded-xl font-bold hover:glass-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConversation}
                  disabled={creating || selectedUsers.length === 0 || (conversationType === 'group' && !groupTitle.trim())}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-[#D71921] to-[#B01419] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Conversation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
