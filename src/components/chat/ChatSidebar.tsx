import { useState } from 'react';
import { Search, MessageSquare, Plus, Users } from 'lucide-react';
import { Conversation } from '../../services/communityChatService';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation?: () => void;
  showCreateForm?: boolean;
  createFormContent?: React.ReactNode;
}

export default function ChatSidebar({
  conversations,
  selectedConversationId,
  currentUserId,
  onSelectConversation,
  onCreateConversation,
  showCreateForm,
  createFormContent,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getAvatar = (conversation: Conversation) => {
    if (conversation.id === 'publicRoom') return '🌍';
    if (conversation.type === 'marketplace') return '🛒';
    if (conversation.type === 'private') return conversation.title.charAt(0).toUpperCase();
    return '💬';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/20 backdrop-blur-sm bg-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          </div>
          {onCreateConversation && (
            <button
              onClick={onCreateConversation}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="New Conversation"
            >
              <Plus className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white/20 border border-white/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600"
          />
        </div>
      </div>

      {showCreateForm && createFormContent}

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const lastMessageTime = conversation.lastMessage?.createdAt;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/20 transition ${
                    isSelected ? 'bg-white/30 backdrop-blur-sm' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base flex-shrink-0">
                    {getAvatar(conversation)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {conversation.title}
                      </h3>
                      {lastMessageTime && (
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTimestamp(lastMessageTime)}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-xs text-gray-600 truncate">
                        {conversation.lastMessage.text}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
