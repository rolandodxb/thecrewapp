import { useState, useEffect } from 'react';
import { X, MessageCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
interface Mention {
  id: string;
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  messageContent: string;
  senderId: string;
  senderName: string;
  mentionedUserId: string;
  createdAt: Timestamp;
  read: boolean;
}
interface MentionsViewProps {
  userId: string;
  onClose: () => void;
}
export default function MentionsView({ userId, onClose }: MentionsViewProps) {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    loadMentions();
  }, [userId]);
  const loadMentions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'message_mentions'),
        where('mentionedUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const mentionsData: Mention[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Mention));
      setMentions(mentionsData);
    } catch (error) {
      console.error('Error loading mentions:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleMentionClick = (mention: Mention) => {
    navigate(`/community?chat=${mention.conversationId}`);
    onClose();
  };
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              Your Mentions
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : mentions.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No mentions yet</h3>
                <p className="text-gray-500">
                  When someone mentions you with @{userId}, it will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {mentions.map((mention) => (
                  <button
                    key={mention.id}
                    onClick={() => handleMentionClick(mention)}
                    className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {mention.senderName}
                          </span>
                          <span className="text-xs text-gray-500">
                            in {mention.conversationTitle}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {mention.messageContent}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {mention.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    </div>
                    {!mention.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}