import { useState } from 'react';
import { Edit2, Trash2, Reply, Check, CheckCheck, MoreVertical, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedMessage, addReaction, editMessage, deleteMessage } from '../../services/enhancedChatService';

interface EnhancedMessageBubbleProps {
  message: EnhancedMessage;
  isOwnMessage: boolean;
  currentUserId: string;
  onReply?: (message: EnhancedMessage) => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢'];

export default function EnhancedMessageBubble({
  message,
  isOwnMessage,
  currentUserId,
  onReply,
}: EnhancedMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleReaction = async (emoji: string) => {
    await addReaction(message.id!, currentUserId, 'You', emoji);
    setShowReactions(false);
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage(message.id!, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this message?')) {
      await deleteMessage(message.id!);
    }
  };

  const getStatusIcon = () => {
    if (message.status === 'seen') {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    if (message.status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    }
    if (message.status === 'sent') {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
    return null;
  };

  const reactionGroups = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <div
      className={`flex items-start gap-2 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex-1 flex flex-col gap-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative max-w-md px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white ml-auto'
              : 'glass-card mr-auto'
          }`}
        >
          {!isOwnMessage && (
            <p className="text-xs font-bold text-gray-700 mb-1">{message.senderName}</p>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="px-2 py-1 bg-white/20 rounded-lg text-sm outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="text-xs px-2 py-1 bg-green-500 rounded-lg hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs px-2 py-1 bg-gray-500 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.type === 'text' && (
                <p className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-800'}`}>
                  {message.content}
                </p>
              )}

              {(message.type === 'image' || message.type === 'video') && message.fileUrl && (
                <div className="space-y-2">
                  {message.type === 'image' ? (
                    <img
                      src={message.fileUrl}
                      alt={message.fileName}
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <video src={message.fileUrl} controls className="max-w-full rounded-lg" />
                  )}
                  <p className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-gray-600'}`}>
                    {message.fileName}
                  </p>
                </div>
              )}

              {message.type === 'file' && message.fileUrl && (
                <a
                  href={message.fileUrl}
                  download={message.fileName}
                  className={`flex items-center gap-2 text-sm ${
                    isOwnMessage ? 'text-white' : 'text-gray-800'
                  } hover:underline`}
                >
                  <Download className="w-4 h-4" />
                  {message.fileName}
                  {message.fileSize && (
                    <span className="text-xs opacity-70">
                      ({(message.fileSize / 1024).toFixed(1)}KB)
                    </span>
                  )}
                </a>
              )}
            </>
          )}

          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}
            >
              {message.createdAt?.toDate?.()?.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {message.edited && (
              <span
                className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-gray-500'}`}
              >
                (edited)
              </span>
            )}
            {isOwnMessage && getStatusIcon()}
          </div>
        </motion.div>

        {message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-2">
            {Object.entries(reactionGroups).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`text-xs px-2 py-0.5 rounded-full glass-card flex items-center gap-1 hover:scale-110 transition ${
                  reactions.some((r) => r.userId === currentUserId)
                    ? 'ring-2 ring-[#D71920]'
                    : ''
                }`}
                title={reactions.map((r) => r.userName).join(', ')}
              >
                <span>{emoji}</span>
                <span className="text-gray-700 font-bold">{reactions.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col gap-1"
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 glass-card rounded-lg hover:bg-white/40 transition"
              title="React"
            >
              <span className="text-sm">😊</span>
            </button>

            {onReply && (
              <button
                onClick={() => onReply(message)}
                className="p-1 glass-card rounded-lg hover:bg-white/40 transition"
                title="Reply"
              >
                <Reply className="w-4 h-4 text-gray-700" />
              </button>
            )}

            {isOwnMessage && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 glass-card rounded-lg hover:bg-white/40 transition"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 glass-card rounded-lg hover:bg-red-100 transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-12 glass-card rounded-xl p-2 flex gap-1 shadow-lg border-2 border-white/40"
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="text-xl hover:scale-125 transition"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
