import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, User, MessageCircle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BugReport, BugResponse, addResponseToBugReport } from '../services/bugReportService';
import { Timestamp } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

interface ExpandableBugReportCardProps {
  report: BugReport;
  onUpdate?: () => void;
}

export default function ExpandableBugReportCard({ report, onUpdate }: ExpandableBugReportCardProps) {
  const { currentUser } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escalated':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !comment.trim() || !report.id) return;

    setSubmitting(true);
    try {
      const response: BugResponse = {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: currentUser.name,
        userRole: currentUser.role,
        message: comment,
        createdAt: Timestamp.now(),
      };

      await addResponseToBugReport(report.id, response);
      setComment('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'N/A';
    }
  };

  const responses = report.responses || [];
  const hasComments = responses.length > 0;

  return (
    <div className="glass-card rounded-2xl shadow-lg border-2 border-transparent hover:border-[#D71920]/20 transition">
      <div
        className="p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                {report.status.replace('-', ' ').toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(report.priority)}`}>
                {report.priority.toUpperCase()}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                {report.category}
              </span>
              {hasComments && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                  <MessageCircle className="w-3 h-3" />
                  {responses.length} {responses.length === 1 ? 'Comment' : 'Comments'}
                </span>
              )}
            </div>
          </div>
          <button className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        <p className="text-gray-700 text-sm line-clamp-2">{report.description}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{report.reportedByName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(report.createdAt)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-gray-200">
              <div className="pt-6 space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{report.description}</p>
                </div>

                {report.assignedToName && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Assigned To</h4>
                    <p className="text-gray-700 text-sm">{report.assignedToName}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Comments & Status History
                  </h4>
                  {responses.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No comments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {responses.map((response) => (
                        <div key={response.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {response.userName[0]}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{response.userName}</p>
                                <p className="text-xs text-gray-500 capitalize">{response.userRole}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(response.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap ml-10">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {currentUser && (currentUser.role === 'mentor' || currentUser.role === 'governor') && (
                  <form onSubmit={handleAddComment} className="mt-6">
                    <h4 className="font-bold text-gray-900 mb-3">Add Comment</h4>
                    <div className="flex gap-2">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Type your response..."
                        rows={3}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition resize-none outline-none"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !comment.trim()}
                        className="px-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {submitting ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
