import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Search, Edit3, RefreshCw, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { reputationService, UserReputation } from '../../services/reputationService';
import { ReputationBadge } from '../../components/ReputationBadge';
import { useNavigate } from 'react-router-dom';

export default function ReputationManager() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [reputations, setReputations] = useState<UserReputation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [recalculating, setRecalculating] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editScore, setEditScore] = useState(50);
  const [editReason, setEditReason] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'governor' && currentUser?.role !== 'mentor') {
      navigate('/dashboard');
      return;
    }
    loadReputations();
  }, [currentUser, navigate]);

  const loadReputations = async () => {
    setLoading(true);
    try {
      const reps = await reputationService.getAllReputations();
      setReputations(reps);
    } catch (error) {
      console.error('Error loading reputations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateAll = async () => {
    if (!confirm('Recalculate all user reputation scores? This may take a few minutes.')) {
      return;
    }

    setRecalculating(true);
    try {
      await reputationService.recalculateAllScores();
      alert('All reputation scores have been recalculated successfully!');
      await loadReputations();
    } catch (error) {
      console.error('Error recalculating scores:', error);
      alert('Failed to recalculate scores. Please try again.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleManualOverride = async (userId: string) => {
    if (!editReason.trim()) {
      alert('Please provide a reason for the manual override.');
      return;
    }

    try {
      await reputationService.manualOverride(userId, editScore, currentUser!.uid, editReason);
      alert('Reputation score updated successfully!');
      setEditingUser(null);
      setEditScore(50);
      setEditReason('');
      await loadReputations();
    } catch (error) {
      console.error('Error updating score:', error);
      alert('Failed to update score. Please try again.');
    }
  };

  const filteredReputations = reputations.filter(rep =>
    rep.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                Reputation Management
              </h1>
              <p className="text-gray-600 mt-2">Monitor and manage user reputation scores</p>
            </div>
            <button
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${recalculating ? 'animate-spin' : ''}`} />
              {recalculating ? 'Recalculating...' : 'Recalculate All'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{reputations.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Avg Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(reputations.reduce((sum, r) => sum + r.score, 0) / reputations.length) || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">High Rep (75+)</p>
            <p className="text-2xl font-bold text-gray-900">
              {reputations.filter(r => r.score >= 75).length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Low Rep (&lt;40)</p>
            <p className="text-2xl font-bold text-gray-900">
              {reputations.filter(r => r.score < 40).length}
            </p>
          </motion.div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or ID..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Reputation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Restrictions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReputations.map((rep) => (
                  <tr key={rep.userId} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900">{rep.userName}</p>
                        <p className="text-xs text-gray-500">{rep.userId.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ReputationBadge score={rep.score} tier={rep.tier} size="sm" showScore />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-1">
                        <p className="text-gray-600">Posts: {rep.metrics.totalPosts} ({rep.metrics.helpfulPosts} helpful)</p>
                        <p className="text-gray-600">Violations: {rep.metrics.violations} | Warnings: {rep.metrics.warnings}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {rep.restrictions.cooldownUntil && rep.restrictions.cooldownUntil.toMillis() > Date.now() ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                          Cooldown
                        </span>
                      ) : rep.restrictions.postingLimited ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                          Limited ({rep.restrictions.maxPostsPerHour}/hr)
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {editingUser === rep.userId ? (
                        <div className="flex items-center gap-2 justify-end">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editScore}
                            onChange={(e) => setEditScore(parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Reason..."
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => handleManualOverride(rep.userId)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setEditScore(50);
                              setEditReason('');
                            }}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingUser(rep.userId);
                            setEditScore(rep.score);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                        >
                          <Edit3 className="w-3 h-3" />
                          Override
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
