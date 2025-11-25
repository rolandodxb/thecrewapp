import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  subscribeToAllTickets,
  subscribeToTicketMessages,
  sendSupportMessage,
  updateTicketStatus,
  markMessagesAsRead,
  SupportTicket,
  SupportMessage
} from '../../../services/supportChatService';

export default function SupportChatManager() {
  const { currentUser } = useApp();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllTickets((newTickets) => {
      setTickets(newTickets);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedTicket?.id) return;

    const unsubscribe = subscribeToTicketMessages(selectedTicket.id, (newMessages) => {
      setMessages(newMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    markMessagesAsRead(selectedTicket.id, 'governor');

    return unsubscribe;
  }, [selectedTicket?.id]);

  const handleSendMessage = async () => {
    if (!currentUser || !selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      await sendSupportMessage(
        selectedTicket.id,
        currentUser.uid,
        currentUser.name,
        'governor',
        newMessage
      );

      setNewMessage('');

      if (selectedTicket.status === 'open') {
        await updateTicketStatus(selectedTicket.id, 'in_progress');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await updateTicketStatus(ticketId, status);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    const badges = {
      open: { color: 'bg-blue-100 text-blue-700 border border-blue-300', icon: Clock, label: 'Open' },
      in_progress: { color: 'bg-yellow-100 text-yellow-700 border border-yellow-300', icon: AlertCircle, label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-700 border border-green-300', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'bg-gray-100 text-gray-700 border border-gray-300', icon: CheckCircle, label: 'Closed' },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light border border-gray-200 rounded-xl shadow-xl overflow-hidden"
    >
      <div className="flex items-center gap-3 p-6 border-b border-gray-200">
        <MessageCircle className="w-6 h-6 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900">Support Chat Manager</h2>
        <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold border border-red-300">
          {tickets.filter(t => t.unreadByGovernor > 0).length} unread
        </span>
      </div>

      <div className="flex h-[600px]">
        <div className="w-80 border-r border-gray-200 overflow-y-auto glass-light">
          {tickets.length === 0 ? (
            <div className="p-4 text-center text-gray-600">No support tickets yet</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 cursor-pointer transition ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-gray-100'
                      : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{ticket.subject}</h4>
                      <p className="text-xs text-gray-600 truncate">{ticket.userName}</p>
                    </div>
                    {ticket.unreadByGovernor > 0 && (
                      <span className="px-2 py-1 bg-red-600 text-white rounded-full text-xs font-bold">
                        {ticket.unreadByGovernor}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs text-gray-500">
                      {ticket.lastMessageAt?.toDate?.()?.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a ticket to view conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-200 glass-light">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedTicket.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedTicket.userName} • {selectedTicket.userEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as any)}
                      className="px-3 py-1 glass-light text-gray-900 rounded text-sm font-bold border border-gray-300 focus:outline-none focus:border-[#D71920]"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto glass-light space-y-3">
                {messages.map((message) => {
                  const isGovernor = message.senderRole === 'governor';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isGovernor ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isGovernor
                            ? 'bg-gradient-to-r from-[#3D4A52] to-[#2A3439] text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1 opacity-70">
                          {message.senderName}
                        </div>
                        <p className="text-sm">{message.message}</p>
                        <div className="text-xs mt-1 opacity-50">
                          {message.timestamp?.toDate?.()?.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 glass-light border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-2 glass-light border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#D71920] focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
