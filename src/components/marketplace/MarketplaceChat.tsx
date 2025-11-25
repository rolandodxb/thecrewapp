import { useState, useEffect, useRef } from 'react';
import { Send, X, MessageCircle, Package, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import {
  MarketplaceConversation,
  createConversation,
  sendMessage,
  subscribeToConversation,
  markMessagesAsRead,
} from '../../services/marketplaceMessagingService';

interface MarketplaceChatProps {
  productId: string;
  productTitle: string;
  productImage?: string;
  sellerId: string;
  sellerName: string;
  onClose: () => void;
}

export default function MarketplaceChat({
  productId,
  productTitle,
  productImage,
  sellerId,
  sellerName,
  onClose,
}: MarketplaceChatProps) {
  const { currentUser } = useApp();
  const [conversation, setConversation] = useState<MarketplaceConversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    initializeChat();
  }, [currentUser, productId, sellerId]);

  useEffect(() => {
    if (conversation && currentUser) {
      const unsubscribe = subscribeToConversation(conversation.id, (updatedConv) => {
        if (updatedConv) {
          setConversation(updatedConv);
          markMessagesAsRead(updatedConv.id, currentUser.uid);
        }
      });

      return () => unsubscribe();
    }
  }, [conversation?.id, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const initializeChat = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const conversationId = await createConversation(
        currentUser.uid,
        currentUser.displayName || 'Unknown',
        sellerId,
        sellerName,
        productId,
        productTitle,
        productImage
      );

      // The subscription will update the conversation state
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!message.trim() || !conversation || !currentUser) return;

    const otherParticipant = conversation.participants.find(p => p !== currentUser.uid);
    if (!otherParticipant) return;

    try {
      await sendMessage(
        conversation.id,
        currentUser.uid,
        currentUser.displayName || 'Unknown',
        otherParticipant,
        conversation.participantNames[otherParticipant],
        message
      );

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentUser) {
    return null;
  }

  const isSeller = currentUser.uid === sellerId;

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl shadow-2xl cursor-pointer hover:shadow-3xl transition-shadow z-50"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">{isSeller ? 'Chat with Buyer' : sellerName}</p>
            <p className="text-xs text-blue-100">{productTitle}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-[440px] max-w-[95vw] h-[700px] max-h-[90vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm">{isSeller ? 'Chat with Buyer' : `Chat with ${sellerName}`}</h3>
            <p className="text-xs text-blue-100">About: {productTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      {productImage && (
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <img src={productImage} alt={productTitle} className="w-12 h-12 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{productTitle}</p>
            <p className="text-xs text-gray-500">Product Discussion</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : conversation?.messages && conversation.messages.length > 0 ? (
          conversation.messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser.uid;
            return (
              <div
                key={index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Now'}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
