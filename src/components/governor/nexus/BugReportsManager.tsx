import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, User, Calendar, ArrowUp, CheckCircle, Clock, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  getAllBugReports,
  getBugReportsByRole,
  updateBugReportStatus,
  escalateBugReport,
  addResponseToBugReport,
  BugReport,
  BugStatus
} from '../../../services/bugReportService';

export default function BugReportsManager() {
  const { currentUser } = useApp();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [responseMessages, setResponseMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReports();
  }, [currentUser]);

  const loadReports = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const fetchedReports = await getBugReportsByRole(currentUser.role);
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error loading bug reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (reportId: string) => {
    setExpandedId(expandedId === reportId ? null : reportId);
  };

  const handleStatusChange = async (reportId: string, newStatus: BugStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateBugReportStatus(reportId, newStatus, currentUser?.uid, currentUser?.name);
      await loadReports();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleEscalate = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      await escalateBugReport(reportId, currentUser.uid, currentUser.name);
      await loadReports();
      alert('Bug report escalated to Governor!');
    } catch (error) {
      console.error('Error escalating bug:', error);
      alert('Failed to escalate bug report');
    }
  };

  const handleAddResponse = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const message = responseMessages[reportId];
    if (!message?.trim() || !currentUser) return;

    try {
      await addResponseToBugReport(reportId, {
        id: Date.now().toString(),
        userId: currentUser.uid,
        userName: currentUser.name,
        userRole: currentUser.role,
        message: message.trim(),
        createdAt: new Date()
      });

      setResponseMessages(prev => ({ ...prev, [reportId]: '' }));
      await loadReports();
    } catch (error) {
      console.error('Error adding response:', error);
      alert('Failed to add response');
    }
  };

  const getStatusColor = (status: BugStatus) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'escalated': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-[#D71920] text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-[#3D4A52] text-white';
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true;
    return report.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="glass-light border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-light border border-gray-200 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Bug className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold text-gray-900">Bug Reports</h2>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 glass-light border border-gray-300 rounded-xl text-gray-900 text-sm"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <Bug className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No bug reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div key={report.id} className="glass-light border border-gray-300 rounded-xl overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => toggleExpand(report.id!)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(report.priority)}`}>
                        {report.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded border text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status.toUpperCase()}
                      </span>
                      {report.escalatedToGovernor && (
                        <span className="px-2 py-1 rounded bg-[#3D4A52] text-white text-xs font-bold">
                          ESCALATED
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">{report.category}</span>
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 break-words">{report.title}</h3>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2 break-words">{report.description}</p>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="break-all">{report.reportedByName} ({report.reportedByRole})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{report.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}</span>
                      </div>
                      {report.responses && report.responses.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />
                          <span>{report.responses.length} responses</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {expandedId === report.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </motion.div>

              <AnimatePresence>
                {expandedId === report.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-gray-300"
                  >
                    <div className="p-4 md:p-6 space-y-6 bg-gray-50">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Full Description</h4>
                        <p className="text-gray-900 break-words whitespace-pre-wrap">{report.description}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Reported by:</span>
                          <p className="text-gray-900 font-semibold break-words">{report.reportedByName}</p>
                          <p className="text-xs text-gray-600">{report.reportedByRole}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Date:</span>
                          <p className="text-gray-900 font-semibold">
                            {report.createdAt?.toDate?.()?.toLocaleString?.() || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {report.responses && report.responses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Responses ({report.responses.length})
                          </h4>
                          <div className="space-y-3">
                            {report.responses.map((response) => (
                              <div key={response.id} className="glass-light rounded-xl p-3 border border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                                  <span className="text-sm font-semibold text-gray-900 break-words">{response.userName}</span>
                                  <span className="text-xs text-gray-600">
                                    {response.createdAt?.toDate?.()?.toLocaleString?.() || 'N/A'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 break-words whitespace-pre-wrap">{response.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Add Response</h4>
                        <textarea
                          value={responseMessages[report.id!] || ''}
                          onChange={(e) => setResponseMessages(prev => ({ ...prev, [report.id!]: e.target.value }))}
                          placeholder="Type your response..."
                          rows={3}
                          className="w-full px-4 py-3 glass-light border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#D71920] focus:outline-none resize-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={(e) => handleAddResponse(report.id!, e)}
                            disabled={!responseMessages[report.id!]?.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                          >
                            Send Response
                          </button>

                          {currentUser?.role === 'governor' && (
                            <div className="flex flex-wrap gap-2">
                              {report.status !== 'in-progress' && (
                                <button
                                  onClick={(e) => handleStatusChange(report.id!, 'in-progress', e)}
                                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition text-sm flex items-center gap-1"
                                >
                                  <Clock className="w-3 h-3" />
                                  In Progress
                                </button>
                              )}
                              {report.status !== 'resolved' && (
                                <button
                                  onClick={(e) => handleStatusChange(report.id!, 'resolved', e)}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition text-sm flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Resolve
                                </button>
                              )}
                              {report.status !== 'closed' && (
                                <button
                                  onClick={(e) => handleStatusChange(report.id!, 'closed', e)}
                                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition text-sm"
                                >
                                  Close
                                </button>
                              )}
                            </div>
                          )}

                          {currentUser?.role === 'mentor' && !report.escalatedToGovernor && report.status !== 'resolved' && (
                            <button
                              onClick={(e) => handleEscalate(report.id!, e)}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition text-sm flex items-center gap-1"
                            >
                              <ArrowUp className="w-3 h-3" />
                              Escalate to Governor
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
