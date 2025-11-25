import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Bot, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  sendGroupMessage,
  subscribeToGroupMessages,
  GroupMessage,
} from '../../services/chatService';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';

export default function GroupChat() {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAIBanner, setShowAIBanner] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGroupMessages((newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const hasSeenAIWelcome = localStorage.getItem('hasSeenGroupChatAIWelcome');
    if (!hasSeenAIWelcome) {
      setShowAIBanner(true);
      localStorage.setItem('hasSeenGroupChatAIWelcome', 'true');
    } else {
      setShowAIBanner(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || !currentUser || isSending) return;

    setIsSending(true);
    try {
      await sendGroupMessage(
        currentUser.uid,
        currentUser.name,
        currentUser.role as 'student' | 'mentor' | 'governor',
        messageText
      );
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
        {showAIBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-3 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-blue-900 text-sm">AI Moderator</h4>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </div>
                <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                  👋 Welcome! I'm the AI moderator for this chat. I'm here 24/7 to keep our conversations safe and respectful. All messages are automatically reviewed to maintain a positive community environment.
                </p>
              </div>
              <button
                onClick={() => setShowAIBanner(false)}
                className="text-blue-600 hover:text-blue-800 transition p-1 flex-shrink-0"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              Start the conversation!
            </h3>
            <p className="text-gray-500 max-w-md">
              Everyone can see your message. Share your thoughts, ask questions, or help others in their cabin crew journey.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                text={message.text}
                senderName={message.senderName}
                senderRole={message.senderRole}
                createdAt={message.createdAt}
                isOwn={message.senderId === currentUser?.uid}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t-2 border-gray-200 p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </p>
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <Shield className="w-3 h-3" />
            <span className="font-medium">AI Moderated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
