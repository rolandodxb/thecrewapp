import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { communityChatService, Message } from '../../services/communityChatService';

interface MarketplaceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  onConversationCreated?: (conversationId: string) => void;
}

export default function MarketplaceChatModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  productImage,
  sellerId,
  sellerName,
  onConversationCreated
}: MarketplaceChatModalProps) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      const unsubscribe = communityChatService.subscribeToMessages(
        conversationId,
        (newMessages) => {
          setMessages(newMessages);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      );

      return unsubscribe;
    }
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!currentUser || !newMessage.trim()) return;

    setSending(true);
    try {
      let convId = conversationId;

      if (!convId) {
        const title = `${currentUser.name} and ${sellerName} for ${productTitle}`;
        convId = await communityChatService.createConversation(
          'private',
          title,
          [currentUser.uid, sellerId],
          'marketplace'
        );

        setConversationId(convId);
        if (onConversationCreated) {
          onConversationCreated(convId);
        }
      }

      await communityChatService.sendMessage(
        convId,
        newMessage,
        'text'
      );

      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Chat with Seller</h3>
                <p className="text-xs text-gray-600">{sellerName}</p>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productTitle}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{productTitle}</p>
                <p className="text-xs text-gray-600">Product Inquiry</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 overflow-y-auto bg-white space-y-3 min-h-[400px] max-h-[500px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-gray-600 text-sm font-medium mb-1">Start a conversation</p>
                <p className="text-xs text-gray-500">Send a message to {sellerName}</p>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.senderId === currentUser.uid;
                const isSystemMessage = message.contentType === 'system';

                if (isSystemMessage) {
                  return (
                    <div key={message.messageId} className="flex justify-center">
                      <div className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {message.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-lg ${
                        isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1 opacity-80">
                        {isUser ? 'You' : sellerName}
                      </p>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.createdAt?.toDate?.()?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                placeholder={conversationId ? "Type your message..." : `Ask ${sellerName} about this product...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
