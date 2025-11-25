import { ArrowLeft, MoreVertical, Users } from 'lucide-react';
import { Conversation } from '../../services/communityChatService';

interface TopNavChatProps {
  conversation: Conversation | null;
  onBack?: () => void;
  onlineCount?: number;
}

export default function TopNavChat({ conversation, onBack, onlineCount }: TopNavChatProps) {
  if (!conversation) {
    return (
      <div className="p-4">
        <div className="h-10 flex items-center">
          <span className="text-gray-500 text-sm">Select a conversation</span>
        </div>
      </div>
    );
  }

  const getIcon = () => {
    if (conversation.id === 'publicRoom') {
      return <span className="text-2xl">🌍</span>;
    }
    if (conversation.type === 'marketplace') {
      return <span className="text-2xl">🛒</span>;
    }
    if (conversation.type === 'private') {
      return <span className="text-lg font-bold">{conversation.title.charAt(0).toUpperCase()}</span>;
    }
    return <Users className="w-5 h-5 text-white" />;
  };

  const getBgColor = () => {
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

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getBgColor()}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{conversation.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {onlineCount !== undefined && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {onlineCount} online
                </span>
              )}
              {conversation.type === 'group' && <span>Group Chat</span>}
              {conversation.type === 'private' && <span>Private Chat</span>}
              {conversation.type === 'marketplace' && <span>Marketplace</span>}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
