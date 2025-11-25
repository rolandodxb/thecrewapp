import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MessageCircle, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  sendSupportMessage,
  subscribeToTicketMessages,
  markMessagesAsRead,
  SupportMessage,
  SupportTicket
} from '../services/supportChatService';

export default function SupportChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(location.state?.ticket || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticket?.id) return;

    const unsubscribe = subscribeToTicketMessages(ticket.id, (newMessages) => {
      setMessages(newMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    markMessagesAsRead(ticket.id, 'user');

    return unsubscribe;
  }, [ticket?.id]);

  const handleSend = async () => {
    if (!ticket?.id || !newMessage.trim() || !currentUser) return;

    setSending(true);
    try {
      await sendSupportMessage(
        ticket.id,
        currentUser.uid,
        currentUser.name,
        'user',
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'in-progress':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!ticket) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No active support conversation</p>
          <button
            onClick={() => navigate('/support')}
            className="px-6 py-3 bg-[#D71921] text-white rounded-xl font-bold hover:bg-[#B01419] transition"
          >
            Go to Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <button
          onClick={() => navigate('/support')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Support</span>
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D71921] to-[#B01419] rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(ticket.status)}
              <span className="text-sm font-medium text-gray-600 capitalize">{ticket.status}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-600">{ticket.department}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Conversation started</p>
                <p className="text-sm text-gray-400">Our team will respond shortly</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.senderRole === 'user';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUser ? 'bg-[#D71921]' : 'bg-gray-600'
                      }`}>
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl px-4 py-3 ${
                          isUser
                            ? 'bg-gradient-to-r from-[#D71921] to-[#B01419] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-xs font-bold mb-1 opacity-80">{message.senderName}</p>
                          <p className="text-sm md:text-base">{message.message}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {message.timestamp?.toDate?.().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D71921] focus:border-transparent"
              disabled={sending || ticket.status === 'resolved'}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending || ticket.status === 'resolved'}
              className="px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B01419] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          {ticket.status === 'resolved' && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              This ticket has been resolved. Create a new ticket for additional support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
