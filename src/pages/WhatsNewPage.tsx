import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Zap, Package, Calendar, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { updatesService, Update } from '../services/updatesService';
import { useNavigate } from 'react-router-dom';

export default function WhatsNewPage() {
  const navigate = useNavigate();
  const [majorUpdates, setMajorUpdates] = useState<Update[]>([]);
  const [majorUpgrades, setMajorUpgrades] = useState<Update[]>([]);
  const [newFeatures, setNewFeatures] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    updates: true,
    upgrades: true,
    features: true,
  });

  useEffect(() => {
    loadWhatsNew();
  }, []);

  const loadWhatsNew = async () => {
    try {
      setLoading(true);

      // Get all recent updates
      const allUpdates = await updatesService.getRecentUpdates(100);

      // Filter by type
      const updates = allUpdates.filter(u => u.type === 'update').slice(0, 10);
      const upgrades = allUpdates.filter(u => u.type === 'upgrade').slice(0, 5);
      const features = allUpdates.filter(u => u.type === 'feature').slice(0, 3);

      setMajorUpdates(updates);
      setMajorUpgrades(upgrades);
      setNewFeatures(features);
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-3xl mb-6 shadow-2xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What's New</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay up to date with the latest features, improvements, and updates to Emirates Academy
          </p>
        </motion.div>

        {/* New Features Section */}
        {newFeatures.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="liquid-crystal-panel p-6 md:p-8 border-2 border-green-200">
              <button
                onClick={() => toggleSection('features')}
                className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-gray-900">Latest Functions & Features</h2>
                    <p className="text-sm text-gray-600">3 newest additions to the platform</p>
                  </div>
                </div>
                {expandedSections.features ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>

              {expandedSections.features && (
                <div className="space-y-4">
                  {newFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="liquid-glass rounded-2xl p-6 border-2 border-green-100 hover:border-green-300 transition-all cursor-pointer group"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0 shadow-md">
                          🎉
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                            {feature.version && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                v{feature.version}
                              </span>
                            )}
                            <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {feature.createdAt.toDate().toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{feature.description}</p>
                          {feature.details && (
                            <div className="bg-white/50 rounded-lg p-3 text-sm text-gray-600">
                              {feature.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Major Upgrades Section */}
        {majorUpgrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="liquid-crystal-panel p-6 md:p-8 border-2 border-blue-200">
              <button
                onClick={() => toggleSection('upgrades')}
                className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-gray-900">Major Upgrades</h2>
                    <p className="text-sm text-gray-600">5 most recent system improvements</p>
                  </div>
                </div>
                {expandedSections.upgrades ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>

              {expandedSections.upgrades && (
                <div className="grid md:grid-cols-2 gap-4">
                  {majorUpgrades.map((upgrade, index) => (
                    <motion.div
                      key={upgrade.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="liquid-glass rounded-xl p-5 border-2 border-blue-100 hover:border-blue-300 transition-all group"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg">
                          📈
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{upgrade.title}</h3>
                          {upgrade.version && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-mono">
                              v{upgrade.version}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{upgrade.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {upgrade.createdAt.toDate().toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Major Updates Section */}
        {majorUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="liquid-crystal-panel p-6 md:p-8 border-2 border-purple-200">
              <button
                onClick={() => toggleSection('updates')}
                className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-gray-900">Recent Updates</h2>
                    <p className="text-sm text-gray-600">10 most recent platform updates</p>
                  </div>
                </div>
                {expandedSections.updates ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </button>

              {expandedSections.updates && (
                <div className="space-y-3">
                  {majorUpdates.map((update, index) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="liquid-glass rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-all group flex items-center gap-3"
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                        <span className="text-sm">{updatesService.getUpdateIcon(update.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate">{update.title}</h3>
                          {update.version && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-mono whitespace-nowrap">
                              v{update.version}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{update.description}</p>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {update.createdAt.toDate().toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {majorUpdates.length === 0 && majorUpgrades.length === 0 && newFeatures.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Updates Yet</h3>
            <p className="text-gray-600 mb-6">Check back soon for new features and improvements</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition inline-flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
