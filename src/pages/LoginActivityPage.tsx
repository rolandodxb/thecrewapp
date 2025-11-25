import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Monitor, Tablet, MapPin, Clock, AlertTriangle, Trash2, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import InspectionProtection from '../components/InspectionProtection';
import {
  LoginActivity,
  getUserLoginHistory,
  getFailedLoginAttempts,
  clearOldLoginActivity,
} from '../services/loginActivityService';

export default function LoginActivityPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [loginHistory, setLoginHistory] = useState<LoginActivity[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadLoginActivity();
    }
  }, [currentUser]);

  const loadLoginActivity = async () => {
    if (!currentUser) return;

    try {
      console.log('Loading login activity for user:', currentUser.uid);
      const history = await getUserLoginHistory(currentUser.uid, 20);
      console.log('Login history loaded:', history);
      setLoginHistory(history);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const failed = await getFailedLoginAttempts(currentUser.uid, thirtyDaysAgo);
      console.log('Failed attempts loaded:', failed);
      setFailedAttempts(failed);
    } catch (error) {
      console.error('Error loading login activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearOldActivity = async () => {
    if (!currentUser || !confirm('Clear login history older than 90 days?')) return;

    try {
      const deleted = await clearOldLoginActivity(currentUser.uid, 90);
      alert(`Deleted ${deleted} old login records`);
      await loadLoginActivity();
    } catch (error) {
      alert('Error clearing old activity. Please try again.');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  // Block free users from login activity
  if (currentUser && currentUser.plan === 'free') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Activity</h2>
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-800">
              Login activity tracking is available for <strong>Pro</strong> and <strong>VIP</strong> members only.
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Upgrade to monitor your account security and login history.
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold"
          >
            <Crown className="w-5 h-5 inline mr-2" />
            Upgrade Now
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
    <InspectionProtection>
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Login Activity</h1>
            <p className="text-gray-600">Monitor your account security and login history</p>
          </div>
          <button
            onClick={handleClearOldActivity}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            <Trash2 className="w-5 h-5" />
            Clear Old Records
          </button>
        </div>

        {failedAttempts.length > 0 && (
          <div className="glass-card rounded-2xl p-6 mb-6 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Failed Login Attempts</h2>
                <p className="text-sm text-red-700">
                  {failedAttempts.length} failed attempt{failedAttempts.length !== 1 ? 's' : ''} in the last 30 days
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {failedAttempts.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="bg-red-50 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row items-start gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
                      <div className="flex-shrink-0">
                        {getDeviceIcon(attempt.deviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-red-900 break-words">
                          {attempt.browser} on {attempt.os}
                        </p>
                        <p className="text-sm text-red-700 break-words">
                          {attempt.timestamp.toDate().toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {attempt.ipAddress && (
                      <span className="text-xs text-red-700 font-mono break-all sm:text-sm">{attempt.ipAddress}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Login History</h2>
              <p className="text-sm text-gray-600">Recent successful logins to your account</p>
            </div>
          </div>

          <div className="space-y-4">
            {loginHistory.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No login history available yet</p>
                <p className="text-sm text-gray-500 mb-4">Your login history will appear here after your next login</p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>Note:</strong> Login activity tracking is enabled. Your current session and future logins will be recorded here for security monitoring.
                  </p>
                  <p className="text-xs text-blue-600">
                    If you just logged in and don't see any data, please log out and log back in to initialize tracking.
                  </p>
                </div>
              </div>
            ) : (
              loginHistory.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-xl p-4 hover:bg-white/40 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                      {getDeviceIcon(activity.deviceType)}
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 break-words">
                          {activity.browser} on {activity.os}
                        </h3>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full w-fit">
                            CURRENT
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="break-words">{activity.timestamp.toDate().toLocaleString()}</span>
                        </div>

                        {activity.ipAddress && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="font-mono text-xs break-all">{activity.ipAddress}</span>
                          </div>
                        )}

                        {activity.location?.country && (
                          <div className="text-xs break-words">
                            {activity.location.city && `${activity.location.city}, `}
                            {activity.location.country}
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2 break-all line-clamp-2">
                        {activity.userAgent}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Security Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>Review your login history regularly for any suspicious activity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>If you see unfamiliar logins, change your password immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>Use strong, unique passwords for your account</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D71920] font-bold">•</span>
              <span>Enable two-factor authentication for extra security</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    </InspectionProtection>
  );
}
