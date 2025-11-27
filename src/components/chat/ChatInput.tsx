import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="p-2">
      {selectedFile && (
        <div className="mb-2 px-2 py-1.5 bg-blue-50 rounded-lg flex items-center justify-between text-xs">
          <span className="text-blue-900 truncate">{selectedFile.name}</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="text-red-600 hover:text-red-700 font-medium ml-2"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5">
        <div className="flex-1 relative bg-gray-100 rounded-2xl focus-within:bg-white focus-within:ring-1 focus-within:ring-gray-300 transition">
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
            className="w-full px-3 py-2 bg-transparent resize-none focus:outline-none text-sm text-gray-900 placeholder-gray-500 max-h-[120px]"
            style={{ minHeight: '36px' }}
          />

          <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5">
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
              className="p-1.5 hover:bg-gray-200 rounded-full transition disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className="p-1.5 hover:bg-gray-200 rounded-full transition disabled:opacity-50"
                title="Add emoji"
              >
                <Smile className="w-4 h-4 text-gray-600" />
              </button>
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
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
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition flex items-center justify-center flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
