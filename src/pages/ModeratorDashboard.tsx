import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Flag, MessageCircle, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, limit, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ModerationLog {
  id: string;
  userId: string;
  userName: string;
  contentType: 'post' | 'comment' | 'chat' | 'marketplace' | 'profile';
  content: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categories: string[];
  action: 'allow' | 'warn' | 'block' | 'ban' | 'escalate';
  reason: string;
  confidence: number;
  timestamp: Timestamp;
  ruleViolations?: string[];
  status: 'pending' | 'reviewed' | 'appealed' | 'resolved';
}

interface ModStats {
  totalViolations: number;
  warnings: number;
  blocked: number;
  criticalToday: number;
}

export default function ModeratorDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ModStats>({
    totalViolations: 0,
    warnings: 0,
    blocked: 0,
    criticalToday: 0
  });
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'warnings' | 'blocked' | 'critical'>('all');

  useEffect(() => {
    if (currentUser?.role === 'moderator' || currentUser?.role === 'governor') {
      loadModeratorData();
    }
  }, [currentUser, filter]);

  const loadModeratorData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      let logsQuery;
      if (filter === 'warnings') {
        logsQuery = query(
          collection(db, 'moderation_logs'),
          where('action', '==', 'warn'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      } else if (filter === 'blocked') {
        logsQuery = query(
          collection(db, 'moderation_logs'),
          where('action', '==', 'block'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      } else if (filter === 'critical') {
        logsQuery = query(
          collection(db, 'moderation_logs'),
          where('severity', '==', 'CRITICAL'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      } else {
        logsQuery = query(
          collection(db, 'moderation_logs'),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const logsSnapshot = await getDocs(logsQuery);
      const moderationLogs: ModerationLog[] = [];
      let warningCount = 0;
      let blockedCount = 0;
      let criticalTodayCount = 0;

      logsSnapshot.forEach((doc) => {
        const log = doc.data();

        moderationLogs.push({
          id: doc.id,
          userId: log.userId,
          userName: log.userName,
          contentType: log.contentType,
          content: log.content,
          severity: log.severity,
          categories: log.categories || [],
          action: log.action,
          reason: log.reason,
          confidence: log.confidence,
          timestamp: log.timestamp,
          ruleViolations: log.ruleViolations,
          status: log.status || 'pending'
        });

        if (log.action === 'warn') warningCount++;
        if (log.action === 'block') blockedCount++;
        if (log.severity === 'CRITICAL' && log.timestamp?.toDate() >= today) criticalTodayCount++;
      });

      setStats({
        totalViolations: logsSnapshot.size,
        warnings: warningCount,
        blocked: blockedCount,
        criticalToday: criticalTodayCount
      });

      setLogs(moderationLogs);
    } catch (error) {
      console.error('Error loading moderator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeration = async (itemId: string, action: 'approve' | 'reject') => {
    try {
      const postRef = doc(db, 'community_posts', itemId);
      await updateDoc(postRef, {
        moderationStatus: action === 'approve' ? 'approved' : 'rejected',
        [`${action}dAt`]: Timestamp.now(),
        [`${action}dBy`]: currentUser?.uid
      });

      alert(`Content ${action}d successfully`);
      loadModeratorData();
    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
      alert(`Failed to ${action} content`);
    }
  };

  if (!currentUser || (currentUser.role !== 'moderator' && currentUser.role !== 'governor')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/30 max-w-md">
          <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only Moderators and Governors can access the moderation dashboard.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                Moderator Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Review and moderate community content</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('warnings')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'warnings'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                Warnings
              </button>
              <button
                onClick={() => setFilter('blocked')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'blocked'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                Blocked
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'critical'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                Critical
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Violations</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalViolations}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Warnings Issued</p>
            <p className="text-2xl font-bold text-gray-900">{stats.warnings}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Content Blocked</p>
            <p className="text-2xl font-bold text-gray-900">{stats.blocked}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Flag className="w-6 h-6 text-white" />
              </div>
              <Flag className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Critical Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.criticalToday}</p>
          </motion.div>
        </div>

        {/* Moderation Logs */}
        <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">AI Moderation Logs</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p>No moderation violations found!</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.contentType === 'post'
                            ? 'bg-blue-100 text-blue-800'
                            : log.contentType === 'comment'
                            ? 'bg-purple-100 text-purple-800'
                            : log.contentType === 'chat'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {log.contentType}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{log.userName}</span>
                        <span className="text-xs text-gray-500">
                          {log.timestamp.toDate().toLocaleString()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : log.severity === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : log.severity === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.severity}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.action === 'ban'
                            ? 'bg-red-100 text-red-800'
                            : log.action === 'block'
                            ? 'bg-orange-100 text-orange-800'
                            : log.action === 'warn'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {log.action}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2 line-clamp-2">{log.content}</p>
                      <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-2">
                        <p className="text-xs text-amber-900 font-medium">{log.reason}</p>
                      </div>
                      {log.ruleViolations && log.ruleViolations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {log.ruleViolations.map((violation, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded">
                              {violation}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Confidence: {Math.round(log.confidence * 100)}%</span>
                        {log.categories.length > 0 && (
                          <>
                            <span>•</span>
                            <span>Categories: {log.categories.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
