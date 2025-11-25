import React, { useState, useRef } from 'react';
import { Send, Smile, X, Image as ImageIcon } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (content: string, file?: File) => Promise<void>;
  onTyping: () => void;
  placeholder?: string;
}

const IOS_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
  '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶',
  '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
  '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸',
  '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
  '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
  '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '👍', '👎', '👏', '🙌', '👋',
  '🤚', '✋', '🖐️', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹',
  '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '💫', '⭐', '🌟',
  '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🎮',
];

export default function MessageComposer({
  onSendMessage,
  onTyping,
  placeholder = 'Type a message...',
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    onTyping();

    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 3000);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Only images are allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setAttachment(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if ((!message.trim() && !attachment) || sending) return;

    setSending(true);
    try {
      await onSendMessage(message, attachment || undefined);
      setMessage('');
      setAttachment(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-0">
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 md:mx-4 glass-bubble rounded-2xl shadow-2xl border border-white/20 p-3 md:p-4 max-h-48 md:max-h-64 overflow-y-auto">
          <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
            {IOS_EMOJIS.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-xl md:text-2xl p-1.5 md:p-2 hover:bg-white/30 rounded-lg transition-all transform hover:scale-110 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {imagePreview && (
        <div className="mb-2 md:mb-3 flex items-center gap-2 md:gap-3 p-2 md:p-3 glass-bubble rounded-xl border border-white/20">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-gray-900 font-medium truncate">{attachment?.name}</p>
            <p className="text-xs text-gray-500">
              {attachment && (attachment.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={() => {
              setAttachment(null);
              setImagePreview(null);
            }}
            className="p-1.5 md:p-2 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5 md:gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 md:p-2 glass-bubble hover:bg-white/30 rounded-lg transition-all flex-shrink-0"
          disabled={sending}
        >
          <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
        </button>

        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 md:p-2 glass-bubble hover:bg-white/30 rounded-lg transition-all flex-shrink-0"
          disabled={sending}
        >
          <Smile className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex-1 min-w-0">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={1}
            className="w-full px-3 py-2 glass-bubble border border-white/20 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D71921]/20 focus:border-transparent resize-none text-sm"
            disabled={sending}
            style={{ minHeight: '38px', maxHeight: '100px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={(!message.trim() && !attachment) || sending}
          className="p-2 md:p-2.5 bg-gradient-to-r from-[#D71921] to-[#B01419] hover:shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4 md:w-5 md:h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
