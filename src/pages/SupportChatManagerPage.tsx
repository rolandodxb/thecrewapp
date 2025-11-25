import { useState, useEffect } from 'react';
import { MessageCircle, Filter, Search, User, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  getAllSupportTickets,
  assignTicket,
  SupportTicket,
  Department,
  Topic
} from '../services/supportChatService';

export default function SupportChatManagerPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, filterStatus, filterDepartment, searchQuery]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const allTickets = await getAllSupportTickets();
      setTickets(allTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterDepartment !== 'all') {
      filtered = filtered.filter(t => t.department === filterDepartment);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.userName.toLowerCase().includes(query) ||
        t.userEmail.toLowerCase().includes(query)
      );
    }

    setFilteredTickets(filtered);
  };

  const handleAssignToMe = async (ticket: SupportTicket) => {
    if (!currentUser) return;

    try {
      await assignTicket(ticket.id, currentUser.uid, currentUser.name, currentUser.role);
      loadTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert('Failed to assign ticket');
    }
  };

  const handleOpenChat = (ticket: SupportTicket) => {
    navigate('/support-chat', { state: { ticket } });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusIcon(status)}
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-[#1C1C1C]">Support Chat Manager</h1>
          <button
            onClick={loadTickets}
            className="px-4 py-2 bg-[#D71920] text-white rounded-lg font-bold hover:bg-[#B01518] transition"
          >
            Refresh
          </button>
        </div>
        <p className="text-gray-600">Manage and respond to support tickets</p>
      </div>

      <div className="glass-light rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by subject, user name, or email..."
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
            >
              <option value="all">All Departments</option>
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="courses">Courses</option>
              <option value="recruitment">Recruitment</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-bold">No tickets found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="glass-light rounded-xl p-4 hover:glass-bubble transition cursor-pointer"
                onClick={() => handleOpenChat(ticket)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <span className="text-xs text-gray-500">
                        {ticket.department}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{ticket.subject}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {ticket.userName}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {ticket.createdAt?.toDate?.()?.toLocaleDateString()}
                      </div>
                    </div>
                    {ticket.assignedToName && (
                      <p className="text-xs text-blue-600 mt-2">
                        Assigned to: {ticket.assignedToName}
                      </p>
                    )}
                    {ticket.escalatedToName && (
                      <p className="text-xs text-orange-600 mt-2">
                        Escalated to: {ticket.escalatedToName}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {!ticket.assignedTo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignToMe(ticket);
                        }}
                        className="px-4 py-2 bg-[#D71920] text-white rounded-lg text-sm font-bold hover:bg-[#B01518] transition"
                      >
                        Assign to Me
                      </button>
                    )}
                    <button
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
