import { useState, useEffect } from 'react';
import { Power, AlertTriangle, Check, X, Clock, Shield, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import {
  FeatureKey,
  FeatureShutdown,
  FEATURE_LABELS,
  subscribeToFeatureShutdowns,
  activateFeatureShutdown,
  deactivateFeatureShutdown
} from '../../services/featureShutdownService';

export default function FeatureShutdownControl() {
  const { currentUser } = useApp();
  const [shutdowns, setShutdowns] = useState<Record<string, FeatureShutdown>>({});
  const [expandedFeature, setExpandedFeature] = useState<FeatureKey | null>(null);
  const [loading, setLoading] = useState(false);

  const [shutdownReason, setShutdownReason] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceEndDate, setMaintenanceEndDate] = useState('');
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToFeatureShutdowns((data) => {
      setShutdowns(data);
    });

    return () => unsubscribe();
  }, []);

  const allFeatures: FeatureKey[] = [
    'chat',
    'modules',
    'submodules',
    'courses',
    'videos',
    'quizzes',
    'exams',
    'notifications',
    'certificateSystem',
    'communityChat',
    'pointsSystem',
    'fileUpload',
    'profileEdit'
  ];

  const handleActivate = async (featureKey: FeatureKey) => {
    if (!currentUser) return;

    if (!shutdownReason.trim() || !maintenanceMessage.trim() || !maintenanceEndDate || !maintenanceEndTime) {
      alert('All fields are required');
      return;
    }

    const endDateTime = new Date(`${maintenanceEndDate}T${maintenanceEndTime}`);
    if (endDateTime <= new Date()) {
      alert('Maintenance end time must be in the future');
      return;
    }

    setLoading(true);
    try {
      await activateFeatureShutdown(
        featureKey,
        shutdownReason.trim(),
        maintenanceMessage.trim(),
        endDateTime,
        currentUser.id
      );

      setExpandedFeature(null);
      resetForm();
    } catch (error) {
      console.error('Error activating shutdown:', error);
      alert('Failed to activate shutdown. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (featureKey: FeatureKey) => {
    if (!currentUser) return;

    if (!confirm(`Are you sure you want to restore access to ${FEATURE_LABELS[featureKey]}?`)) {
      return;
    }

    setLoading(true);
    try {
      await deactivateFeatureShutdown(featureKey, currentUser.id);
      setExpandedFeature(null);
    } catch (error) {
      console.error('Error deactivating shutdown:', error);
      alert('Failed to deactivate shutdown. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShutdownReason('');
    setMaintenanceMessage('');
    setMaintenanceEndDate('');
    setMaintenanceEndTime('');
  };

  const toggleExpanded = (featureKey: FeatureKey) => {
    if (expandedFeature === featureKey) {
      setExpandedFeature(null);
      resetForm();
    } else {
      setExpandedFeature(featureKey);
      resetForm();
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-red-900/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" strokeWidth={1.5} />
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight uppercase">Emergency Shutdown Control</h1>
                <p className="text-gray-600 text-xs sm:text-sm font-mono mt-1">SYSTEM-WIDE FEATURE MANAGEMENT INTERFACE</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 p-3 sm:p-4 glass-light border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                <span className="text-yellow-600 font-bold">WARNING:</span> Activating a shutdown will immediately block all users from accessing the selected feature. Use with extreme caution.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-light border border-gray-300 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Feature ID
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Shutdown Reason
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Scheduled Restore
                  </th>
                  <th className="text-right px-4 sm:px-6 py-3 sm:py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allFeatures.map((featureKey, index) => {
                  const shutdown = shutdowns[featureKey];
                  const isShutdown = shutdown?.isShutdown || false;
                  const isExpanded = expandedFeature === featureKey;

                  return (
                    <>
                      <motion.tr
                        key={featureKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-gray-900 font-mono">{FEATURE_LABELS[featureKey]}</div>
                              <div className="text-xs text-gray-500 font-mono">{featureKey}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          {isShutdown ? (
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-50 border border-red-300 rounded text-xs font-bold text-red-700 uppercase tracking-wide">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                              <span className="hidden sm:inline">OFFLINE</span>
                              <span className="sm:hidden">OFF</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 border border-green-300 rounded text-xs font-bold text-green-700 uppercase tracking-wide">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="hidden sm:inline">ONLINE</span>
                              <span className="sm:hidden">ON</span>
                            </div>
                          )}
                        </td>

                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          {isShutdown && shutdown ? (
                            <div className="text-xs sm:text-sm text-gray-700 max-w-xs truncate" title={shutdown.shutdownReason}>
                              {shutdown.shutdownReason}
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-400">—</div>
                          )}
                        </td>

                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          {isShutdown && shutdown?.maintenanceEndsAt ? (
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600 font-mono">
                              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                              <span className="hidden lg:inline">{shutdown.maintenanceEndsAt.toLocaleString()}</span>
                              <span className="lg:hidden">{shutdown.maintenanceEndsAt.toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-400">—</div>
                          )}
                        </td>

                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleExpanded(featureKey)}
                              className={`px-2 sm:px-4 py-1.5 sm:py-2 border rounded text-xs font-bold uppercase tracking-wide transition-all ${
                                isExpanded
                                  ? 'bg-gray-100 border-gray-400 text-gray-700'
                                  : isShutdown
                                  ? 'bg-green-50 hover:bg-green-100 border-green-300 text-green-700'
                                  : 'bg-red-50 hover:bg-red-100 border-red-300 text-red-700'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 sm:gap-2">
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span className="hidden sm:inline">Close</span>
                                  </>
                                ) : isShutdown ? (
                                  <>
                                    <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span className="hidden sm:inline">Restore</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span className="hidden sm:inline">Shutdown</span>
                                  </>
                                )}
                              </span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            key={`${featureKey}-expanded`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td colSpan={5} className="px-4 sm:px-6 py-0">
                              <div className="py-4 border-t border-gray-200">
                                {isShutdown ? (
                                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 sm:p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="w-10 h-10 rounded-xl bg-green-100 border-2 border-green-400 flex items-center justify-center">
                                        <Power className="w-5 h-5 text-green-700" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-bold text-gray-900 uppercase">Restore Feature Access</h3>
                                        <p className="text-sm text-gray-600 font-mono">TARGET: {FEATURE_LABELS[featureKey]}</p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-4">
                                      This will immediately restore user access to <strong>{FEATURE_LABELS[featureKey]}</strong>. The feature will become operational across all connected clients.
                                    </p>
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => setExpandedFeature(null)}
                                        disabled={loading}
                                        className="px-6 py-2.5 glass-light border-2 border-gray-300 text-gray-700 rounded-xl font-bold uppercase text-sm hover:bg-gray-100 transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleDeactivate(featureKey)}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold uppercase text-sm disabled:opacity-50 transition-all shadow-lg"
                                      >
                                        {loading ? 'Restoring...' : 'Confirm Restore'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 sm:p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                      <div className="w-10 h-10 rounded-xl bg-red-100 border-2 border-red-400 flex items-center justify-center">
                                        <AlertTriangle className="w-5 h-5 text-red-700" />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-bold text-gray-900 uppercase">Initiate Feature Shutdown</h3>
                                        <p className="text-sm text-gray-600 font-mono">TARGET: {FEATURE_LABELS[featureKey]}</p>
                                      </div>
                                    </div>

                                    <div className="space-y-4 mb-4">
                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                          Shutdown Reason <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          value={shutdownReason}
                                          onChange={(e) => setShutdownReason(e.target.value)}
                                          placeholder="e.g., Critical security vulnerability detected"
                                          className="w-full px-4 py-2.5 glass-light border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none font-mono text-sm"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                          User-Facing Message <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                          value={maintenanceMessage}
                                          onChange={(e) => setMaintenanceMessage(e.target.value)}
                                          placeholder="Message displayed to users during shutdown..."
                                          rows={3}
                                          className="w-full px-4 py-2.5 glass-light border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none resize-none font-mono text-sm"
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Restore Date <span className="text-red-600">*</span>
                                          </label>
                                          <input
                                            type="date"
                                            value={maintenanceEndDate}
                                            onChange={(e) => setMaintenanceEndDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2.5 glass-light border-2 border-gray-300 rounded-xl text-gray-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none font-mono text-sm"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Restore Time <span className="text-red-600">*</span>
                                          </label>
                                          <input
                                            type="time"
                                            value={maintenanceEndTime}
                                            onChange={(e) => setMaintenanceEndTime(e.target.value)}
                                            className="w-full px-4 py-2.5 glass-light border-2 border-gray-300 rounded-xl text-gray-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all outline-none font-mono text-sm"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => {
                                          setExpandedFeature(null);
                                          resetForm();
                                        }}
                                        disabled={loading}
                                        className="px-6 py-2.5 glass-light border-2 border-gray-300 text-gray-700 rounded-xl font-bold uppercase text-sm hover:bg-gray-100 transition-all"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleActivate(featureKey)}
                                        disabled={loading}
                                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-sm disabled:opacity-50 transition-all shadow-lg"
                                      >
                                        {loading ? 'Initiating...' : 'Execute Shutdown'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
