import React, { useState, useEffect } from 'react';
import {
  Shield,
  Trash2,
  Ban,
  VolumeX,
  Search,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { moderationService, ModerationAuditEntry } from '../../services/moderationService';
import { MessageReport } from '../../services/communityChatService';

export default function ChatModerationConsole() {
  const [activeTab, setActiveTab] = useState<'reports' | 'search' | 'audit'>('reports');
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [auditLog, setAuditLog] = useState<ModerationAuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'open' | 'reviewed' | 'closed' | 'all'>('open');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'reports') {
      const unsubscribe = moderationService.subscribeToReportedMessages(
        (reps) => {
          setReports(reps);
          setLoading(false);
        },
        filterStatus === 'all' ? undefined : filterStatus
      );
      return () => unsubscribe();
    } else if (activeTab === 'audit') {
      const unsubscribe = moderationService.subscribeToAuditLog((entries) => {
        setAuditLog(entries);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, filterStatus]);

  const handleDeleteMessage = async (conversationId: string, messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await moderationService.deleteMessage(conversationId, messageId);
      alert('Message deleted successfully');
    } catch (error) {
      alert('Failed to delete message');
    }
  };

  const handleMuteUser = async (userId: string, conversationId?: string) => {
    const duration = prompt(
      'Enter mute duration in hours (leave empty for permanent):',
      '24'
    );

    try {
      const durationMs = duration ? parseInt(duration) * 3600000 : undefined;
      await moderationService.muteUser(userId, conversationId, durationMs);
      alert('User muted successfully');
    } catch (error) {
      alert('Failed to mute user');
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;

    if (!confirm('Are you sure you want to ban this user permanently?')) return;

    try {
      await moderationService.banUser(userId, reason);
      alert('User banned successfully');
    } catch (error) {
      alert('Failed to ban user');
    }
  };

  const handleExportAuditLog = async () => {
    try {
      const csv = await moderationService.exportAuditLog();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moderation-audit-${Date.now()}.csv`;
      a.click();
    } catch (error) {
      alert('Failed to export audit log');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 glass-light/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Chat Moderation Console</h1>
              <p className="text-white/60">Monitor and moderate community conversations</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'reports'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Reports ({reports.filter((r) => r.status === 'open').length})
              </div>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </div>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'audit'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Audit Log
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="glass-light/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('open')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filterStatus === 'open' ? 'bg-yellow-500 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  Open
                </button>
                <button
                  onClick={() => setFilterStatus('reviewed')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filterStatus === 'reviewed' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  Reviewed
                </button>
                <button
                  onClick={() => setFilterStatus('closed')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filterStatus === 'closed' ? 'bg-green-500 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  Closed
                </button>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    filterStatus === 'all' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="glass-light/5 backdrop-blur-xl border border-white/10 rounded-xl p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-white/60">No reports found</p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.reporterId + report.messageId}
                  className="glass-light/5 backdrop-blur-xl border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            report.status === 'open'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : report.status === 'reviewed'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}
                        >
                          {report.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-white/40">
                          {report.createdAt.toDate().toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white text-sm mb-2">
                        <span className="font-semibold">Reason:</span> {report.reason}
                      </p>
                      <p className="text-white/60 text-xs">
                        Reporter: {report.reporterId}
                      </p>
                      <p className="text-white/60 text-xs">
                        Message: {report.messageRef}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleDeleteMessage(report.conversationId, report.messageId)
                      }
                      className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Message
                    </button>

                    <button
                      onClick={() => handleMuteUser(report.reporterId, report.conversationId)}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors text-sm"
                    >
                      <VolumeX className="w-4 h-4" />
                      Mute User
                    </button>

                    <button
                      onClick={() => handleBanUser(report.reporterId)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg transition-colors text-sm"
                    >
                      <Ban className="w-4 h-4" />
                      Ban User
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="glass-light/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex justify-between items-center">
              <p className="text-white">
                {auditLog.length} moderation actions logged
              </p>
              <button
                onClick={handleExportAuditLog}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="glass-light/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="glass-light/5">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                      Target
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">
                      Moderator
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry, index) => (
                    <tr key={index} className="border-t border-white/5">
                      <td className="px-4 py-3 text-sm text-white/80">
                        {entry.timestamp.toDate().toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {entry.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {entry.targetType}: {entry.targetId.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {entry.moderatorId.substring(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="glass-light/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="mb-6">
              <label className="block text-white mb-2">Search Messages</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search query..."
                className="w-full px-4 py-3 glass-light/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <p className="text-white/60 text-sm">
              Search functionality requires conversation selection. Use filters above to narrow
              results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
