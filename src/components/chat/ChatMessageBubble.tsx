import { useState } from 'react';
import { Edit2, Smile, Flag, Check, X } from 'lucide-react';
import { Message } from '../../services/communityChatService';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessageBubbleProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReport?: (messageId: string) => void;
}

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '👏'];

export default function ChatMessageBubble({ message, currentUserId, showAvatar = true, onReact, onEdit, onReport }: ChatMessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isOwnMessage = message.senderId === currentUserId;

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (message.contentType === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showAvatar && (
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${
            isOwnMessage
              ? 'from-blue-500 to-blue-600'
              : 'from-gray-400 to-gray-500'
          } flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
        >
          {(message.senderName || 'U').charAt(0).toUpperCase()}
        </div>
      )}

      {!showAvatar && <div className="w-8 flex-shrink-0"></div>}

      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && showAvatar && (
          <span className="text-xs text-gray-600 font-medium mb-1 px-1">
            {message.senderName || 'Unknown'}
          </span>
        )}

        <div className="relative group">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl px-4 py-2.5 shadow-sm ${
              isOwnMessage
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm'
            }`}
          >
            {message.attachmentUrl && message.contentType === 'image' && (
              <img
                src={message.attachmentUrl}
                alt="attachment"
                className="max-w-xs max-h-64 object-contain rounded-lg mb-2"
              />
            )}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1 bg-white/90 text-gray-900 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editContent.trim() && editContent !== message.content) {
                        onEdit?.(message.messageId, editContent.trim());
                      }
                      setIsEditing(false);
                    }}
                    className="p-1 bg-green-600 hover:bg-green-700 text-white rounded transition"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditContent(message.content);
                      setIsEditing(false);
                    }}
                    className="p-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {formatTime(message.createdAt)}
              </span>
              {message.editedAt && (
                <span
                  className={`text-xs italic ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  (edited)
                </span>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute top-0 ${
                  isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
                } flex items-center gap-1`}
              >
                {isOwnMessage ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 bg-white hover:bg-gray-100 rounded-lg shadow-md transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShowReactionPicker(!showReactionPicker)}
                      className="p-1.5 bg-white hover:bg-gray-100 rounded-lg shadow-md transition"
                      title="React"
                    >
                      <Smile className="w-4 h-4 text-gray-600" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowReactionPicker(!showReactionPicker)}
                      className="p-1.5 bg-white hover:bg-gray-100 rounded-lg shadow-md transition"
                      title="React"
                    >
                      <Smile className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => onReport?.(message.messageId)}
                      className="p-1.5 bg-white hover:bg-gray-100 rounded-lg shadow-md transition"
                      title="Report"
                    >
                      <Flag className="w-4 h-4 text-red-600" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} bottom-full mb-2 flex gap-1 bg-white p-2 rounded-lg shadow-xl`}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (onReact) onReact(message.messageId, emoji);
                      setShowReactionPicker(false);
                    }}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <div
                key={emoji}
                className="px-2 py-0.5 bg-gray-100 rounded-full text-xs flex items-center gap-1"
              >
                <span>{emoji}</span>
                <span className="text-gray-600">{(users as string[]).length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
