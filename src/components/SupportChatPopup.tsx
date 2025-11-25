import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, CheckCircle, Clock, AlertCircle, Minus, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  createSupportTicket,
  sendSupportMessage,
  subscribeToTicketMessages,
  markMessagesAsRead,
  escalateTicket,
  SupportMessage,
  SupportTicket,
  Department,
  Topic
} from '../services/supportChatService';

interface SupportChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: SupportTicket | null;
}

export default function SupportChatPopup({ isOpen, onClose, ticket: existingTicket }: SupportChatPopupProps) {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState<Department>('general');
  const [topic, setTopic] = useState<Topic>('other');
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(existingTicket || null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingTicket) {
      setTicket(existingTicket);
    }
  }, [existingTicket]);

  useEffect(() => {
    if (!ticket?.id) return;

    const unsubscribe = subscribeToTicketMessages(ticket.id, (newMessages) => {
      setMessages(newMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    markMessagesAsRead(ticket.id, 'user');

    return unsubscribe;
  }, [ticket?.id]);

  const handleCreateTicket = async () => {
    if (!currentUser || !subject.trim() || !newMessage.trim()) {
      console.log('Validation failed:', { currentUser, subject: subject.trim(), message: newMessage.trim() });
      return;
    }

    console.log('Creating support ticket...');
    setSending(true);
    try {
      const ticketId = await createSupportTicket(
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        subject,
        newMessage,
        department,
        topic
      );

      console.log('Ticket created with ID:', ticketId);

      setTicket({
        id: ticketId,
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        status: 'open',
        priority: 'medium',
        subject,
        department,
        topic,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessageAt: new Date(),
        unreadByUser: 0,
        unreadByStaff: 1,
        participants: [{ id: currentUser.uid, name: currentUser.name, role: currentUser.role, joinedAt: new Date() }],
      });

      setSubject('');
      setNewMessage('');
      setDepartment('general');
      setTopic('other');
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      alert(`Failed to create support ticket: ${error.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    if (!currentUser || !ticket) return;

    try {
      setSending(true);
      await escalateTicket(
        ticket.id,
        'governor_id',
        'Governor',
        'governor',
        currentUser.uid,
        currentUser.name
      );
      setShowEscalateConfirm(false);
      alert('Ticket escalated to Governor successfully');
    } catch (error: any) {
      console.error('Error escalating ticket:', error);
      alert(`Failed to escalate ticket: ${error.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser || !ticket || !newMessage.trim()) return;

    setSending(true);
    try {
      await sendSupportMessage(
        ticket.id,
        currentUser.uid,
        currentUser.name,
        'user',
        newMessage
      );

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    const badges = {
      open: { className: 'status-badge status-badge-open', icon: Clock, label: 'Open' },
      in_progress: { className: 'status-badge status-badge-progress', icon: AlertCircle, label: 'In Progress' },
      resolved: { className: 'status-badge status-badge-resolved', icon: CheckCircle, label: 'Resolved' },
      closed: { className: 'status-badge status-badge-closed', icon: CheckCircle, label: 'Closed' },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={badge.className}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const handleClose = () => {
    setTicket(null);
    setMessages([]);
    setNewMessage('');
    setSubject('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
              style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
              onClick={handleClose}
            />
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? '64px' : 'auto',
              maxHeight: isMinimized ? '64px' : 'calc(100vh - 120px)'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Support Chat</h3>
                  {ticket && !isMinimized && (
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(ticket.status)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && !ticket ? (
              <div className="flex-1 p-4 overflow-y-auto">
                <h4 className="font-bold text-gray-900 mb-4">Start a new support conversation</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Department
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as Department)}
                      className="w-full chat-input-field"
                    >
                      <option value="general">General Support</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="courses">Course Support</option>
                      <option value="recruitment">Recruitment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Topic
                    </label>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value as Topic)}
                      className="w-full chat-input-field"
                    >
                      <option value="account">Account Issues</option>
                      <option value="payment">Payment Issues</option>
                      <option value="course_access">Course Access</option>
                      <option value="bug_report">Bug Report</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="complaint">Complaint</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What do you need help with?"
                      className="w-full chat-input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Describe your issue..."
                      rows={6}
                      className="w-full chat-input-field resize-none"
                    />
                  </div>
                  <button
                    onClick={handleCreateTicket}
                    disabled={!subject.trim() || !newMessage.trim() || sending}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Starting Chat...' : 'Start Chat'}
                  </button>
                </div>
              </div>
            ) : !isMinimized ? (
              <>
                <div className="flex-1 p-4 overflow-y-auto bg-white space-y-4">
                  {messages.map((message) => {
                    const isUser = message.senderRole === 'student';
                    const isSystemMessage = message.isSystemMessage || message.senderRole === 'system';

                    if (isSystemMessage) {
                      return (
                        <div key={message.id} className="flex justify-center my-4">
                          <div className="chat-system-message">
                            {message.message}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={isUser ? 'chat-bubble-user' : 'chat-bubble-staff'}
                        >
                          <div className="chat-message-meta">
                            {message.senderName}
                          </div>
                          <p className="chat-message-text">{message.message}</p>
                          <div className="chat-message-time">
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

                <div className="chat-input-container space-y-2">
                  {currentUser?.role !== 'student' && ticket && !ticket.escalatedTo && (
                    <button
                      onClick={() => setShowEscalateConfirm(true)}
                      className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Escalate to Governor
                    </button>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 chat-input-field"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </motion.div>

          {showEscalateConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center"
              onClick={() => setShowEscalateConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Escalate Ticket</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to escalate this ticket to the Governor? This will notify the Governor and add them to the conversation.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEscalateConfirm(false)}
                    className="flex-1 px-4 py-2 chat-input-field font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEscalate}
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    {sending ? 'Escalating...' : 'Escalate'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
