import { Users, MessageCircle, Search } from 'lucide-react';
import { Conversation } from '../../services/communityChatService';
import { useState } from 'react';

interface SidebarConversationsProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
}

export default function SidebarConversations({
  conversations,
  selectedConversationId,
  currentUserId,
  onSelectConversation,
}: SidebarConversationsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConversationIcon = (conversation: Conversation) => {
    if (conversation.id === 'publicRoom') {
      return <span className="text-2xl">🌍</span>;
    }
    if (conversation.type === 'marketplace') {
      return <span className="text-2xl">🛒</span>;
    }
    if (conversation.type === 'private') {
      return <span className="text-lg font-bold">{conversation.title.charAt(0).toUpperCase()}</span>;
    }
    return <Users className="w-5 h-5" />;
  };

  const getConversationBg = (conversation: Conversation) => {
    if (conversation.id === 'publicRoom') {
      return 'bg-gradient-to-br from-orange-500 to-orange-600';
    }
    if (conversation.type === 'marketplace') {
      return 'bg-gradient-to-br from-green-500 to-emerald-600';
    }
    if (conversation.type === 'private') {
      return 'bg-gray-600';
    }
    return 'bg-blue-600';
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
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
                  className={`w-full p-4 text-left transition hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white ${getConversationBg(
                        conversation
                      )}`}
                    >
                      {getConversationIcon(conversation)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
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
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.text}
                        </p>
                      )}
                    </div>
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
