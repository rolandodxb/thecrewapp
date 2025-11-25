import { useState, useEffect } from 'react';
import { AtSign, MessageCircle, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { messageMentionsService, MessageMention } from '../../services/messageMentionsService';
import { formatDistanceToNow } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

interface MentionsDropdownProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMessage: (conversationId: string, messageId: string) => void;
}

export default function MentionsDropdown({
  userId,
  isOpen,
  onClose,
  onNavigateToMessage,
}: MentionsDropdownProps) {
  const [mentions, setMentions] = useState<MessageMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = messageMentionsService.subscribeToUserMentions(
      userId,
      (newMentions) => {
        setMentions(newMentions);
        setLoading(false);
      },
      showUnreadOnly
    );

    return () => unsubscribe();
  }, [userId, isOpen, showUnreadOnly]);

  const handleMarkAsRead = async (mentionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await messageMentionsService.markMentionAsRead(mentionId);
  };

  const handleMarkAllAsRead = async () => {
    await messageMentionsService.markAllMentionsAsRead(userId);
  };

  const handleMentionClick = async (mention: MessageMention) => {
    await messageMentionsService.markMentionAsRead(mention.id);
    onNavigateToMessage(mention.conversationId, mention.messageId);
    onClose();
  };

  const unreadCount = mentions.filter((m) => !m.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AtSign className="w-5 h-5" />
                  <h3 className="text-lg font-bold">Mentions</h3>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-white text-blue-600 rounded-full text-xs font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    showUnreadOnly
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-600 text-white border border-white/30'
                  }`}
                >
                  {showUnreadOnly ? 'Show All' : 'Unread Only'}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white border border-white/30 hover:bg-blue-700 transition"
                  >
                    Mark All Read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-600">Loading mentions...</p>
                </div>
              ) : mentions.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No mentions yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    When someone tags you with @username, it will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {mentions.map((mention) => (
                    <div
                      key={mention.id}
                      onClick={() => handleMentionClick(mention)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                        !mention.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {mention.senderName}
                            </span>
                            {!mention.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{mention.conversationTitle}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(mention.createdAt.toDate())}
                            </span>
                          </div>
                        </div>
                        {!mention.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(mention.id, e)}
                            className="p-1.5 hover:bg-white rounded-lg transition flex-shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm line-clamp-2">
                        {mention.messageContent}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {mentions.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                <button
                  onClick={onClose}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
