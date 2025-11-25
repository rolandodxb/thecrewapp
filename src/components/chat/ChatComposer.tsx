import { useState, useRef, useEffect } from 'react';
import { Send, Image, Smile, Paperclip } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatComposerProps {
  onSend: (message: string, file?: File) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatComposer({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatComposerProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if ((!message.trim() && !selectedFile) || disabled) return;

    onSend(message.trim(), selectedFile || undefined);
    setMessage('');
    setSelectedFile(null);
    setShowEmojiPicker(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="p-4">
      {selectedFile && (
        <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-900 truncate">
            {selectedFile.name}
          </span>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 bg-white border border-gray-300 rounded-2xl focus-within:border-blue-500 transition">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-gray-900 placeholder-gray-400 max-h-[150px]"
            style={{ minHeight: '48px' }}
          />

          <div className="flex items-center gap-1 px-3 pb-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="Attach image"
            >
              <Image className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
                title="Add emoji"
              >
                <Smile className="w-5 h-5 text-gray-600" />
              </button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 z-50"
                  >
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || disabled}
          className="h-12 w-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition flex items-center justify-center shadow-lg hover:shadow-xl flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
