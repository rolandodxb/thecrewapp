import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, TrendingUp, Users, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { aiModerationService, ModerationInsights, ModerationLog } from '../../services/aiModerationService';
import { useApp } from '../../context/AppContext';

export default function ModerationInsightsPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<ModerationInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ModerationLog | null>(null);
  const [reviewingAppeal, setReviewingAppeal] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'governor') {
      navigate('/dashboard');
      return;
    }

    loadInsights();
  }, [currentUser, navigate]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await aiModerationService.getInsights();
      setInsights(data);
    } catch (error) {
      console.error('Failed to load moderation insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAppeal = async (logId: string, approved: boolean) => {
    setReviewingAppeal(true);
    try {
      await aiModerationService.reviewAppeal(logId, approved, currentUser?.uid || '');
      await loadInsights();
      setSelectedLog(null);
    } catch (error) {
      console.error('Failed to review appeal:', error);
    } finally {
      setReviewingAppeal(false);
    }
  };

  if (loading || !insights) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    spam: 'bg-yellow-500',
    harassment: 'bg-red-500',
    scam: 'bg-orange-500',
    'off-topic': 'bg-gray-500',
    explicit: 'bg-purple-500',
    'hate-speech': 'bg-red-700',
    violence: 'bg-red-600',
    'self-harm': 'bg-pink-600',
    fraud: 'bg-orange-600',
  };

  const severityColors: Record<string, string> = {
    LOW: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Moderation Insights</h1>
          <p className="text-gray-600">Monitor and manage content moderation across the platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Total Violations</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{insights.totalViolations}</p>
            <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Pending Appeals</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{insights.pendingAppeals}</p>
            <p className="text-sm text-gray-500 mt-1">Awaiting review</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Top Offenders</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{insights.topOffenders.length}</p>
            <p className="text-sm text-gray-500 mt-1">Repeat violators</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-700">Protection Rate</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {insights.totalViolations > 0
                ? Math.round(
                    ((insights.violationsBySeverity.MEDIUM +
                      insights.violationsBySeverity.HIGH +
                      insights.violationsBySeverity.CRITICAL) /
                      insights.totalViolations) *
                      100
                  )
                : 0}
              %
            </p>
            <p className="text-sm text-gray-500 mt-1">Blocked serious content</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Violations by Category</h2>
            <div className="space-y-3">
              {Object.entries(insights.violationsByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700 capitalize">
                        {category.replace('-', ' ')}
                      </span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${categoryColors[category]} h-2 rounded-full transition-all`}
                        style={{
                          width: `${(count / insights.totalViolations) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Violations by Severity</h2>
            <div className="space-y-3">
              {Object.entries(insights.violationsBySeverity)
                .sort(([, a], [, b]) => b - a)
                .map(([severity, count]) => (
                  <div key={severity}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{severity}</span>
                      <span className="text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${severityColors[severity]} h-2 rounded-full transition-all`}
                        style={{
                          width: `${(count / insights.totalViolations) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Offenders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Violations</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {insights.topOffenders.map((offender) => (
                  <tr key={offender.userId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{offender.userName}</div>
                      <div className="text-sm text-gray-500">{offender.userId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {offender.count} violations
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Violations</h2>
          <div className="space-y-3">
            {insights.recentViolations.map((log) => (
              <div
                key={log.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{log.userName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                          severityColors[log.severity]
                        }`}
                      >
                        {log.severity}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {log.contentType}
                      </span>
                      {log.status === 'appealed' && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          Appeal Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{log.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {log.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {log.timestamp?.toDate().toLocaleString()}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{log.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Violation Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">User</label>
                  <p className="text-gray-900">{selectedLog.userName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Content</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLog.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Severity</label>
                    <p className={`font-bold ${severityColors[selectedLog.severity]}`}>
                      {selectedLog.severity}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Action Taken</label>
                    <p className="font-medium text-gray-900 capitalize">{selectedLog.action}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Categories</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedLog.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedLog.aiAnalysis && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">AI Analysis</label>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">
                      {selectedLog.aiAnalysis}
                    </p>
                  </div>
                )}

                {selectedLog.ruleViolations && selectedLog.ruleViolations.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rule Violations</label>
                    <ul className="list-disc list-inside text-gray-700 bg-red-50 p-3 rounded-lg">
                      {selectedLog.ruleViolations.map((violation, idx) => (
                        <li key={idx}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedLog.status === 'appealed' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Appeal Reason</label>
                      <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg">
                        {selectedLog.appealReason}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleReviewAppeal(selectedLog.id!, true)}
                        disabled={reviewingAppeal}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve Appeal
                      </button>
                      <button
                        onClick={() => handleReviewAppeal(selectedLog.id!, false)}
                        disabled={reviewingAppeal}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                        Deny Appeal
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
