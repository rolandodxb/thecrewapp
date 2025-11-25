import { useState, useEffect } from 'react';
import { Shield, TrendingUp, AlertCircle, Eye, EyeOff, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reputationService, UserReputation } from '../services/reputationService';
import { ReputationBadge } from './ReputationBadge';

interface ReputationDisplayProps {
  userId: string;
  isOwnProfile: boolean;
}

export function ReputationDisplay({ userId, isOwnProfile }: ReputationDisplayProps) {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadReputation();
  }, [userId]);

  const loadReputation = async () => {
    try {
      const rep = await reputationService.getReputation(userId);
      setReputation(rep);
    } catch (error) {
      console.error('Error loading reputation:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async () => {
    if (!reputation) return;
    try {
      await reputationService.toggleVisibility(userId, !reputation.visibilityPublic);
      setReputation({
        ...reputation,
        visibilityPublic: !reputation.visibilityPublic
      });
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!reputation) {
    return null;
  }

  if (!reputation.visibilityPublic && !isOwnProfile) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg">
        <div className="flex items-center gap-3 text-gray-500">
          <EyeOff className="w-5 h-5" />
          <p className="text-sm">Reputation score is private</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'from-green-500 to-emerald-500';
    if (score >= 50) return 'from-blue-500 to-cyan-500';
    if (score >= 25) return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Reputation Score</h3>
            <p className="text-sm text-gray-600">Community standing</p>
          </div>
        </div>
        {isOwnProfile && (
          <button
            onClick={toggleVisibility}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={reputation.visibilityPublic ? 'Make private' : 'Make public'}
          >
            {reputation.visibilityPublic ? (
              <Eye className="w-5 h-5 text-gray-600" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-600" />
            )}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <ReputationBadge score={reputation.score} tier={reputation.tier} size="lg" showScore />
          <span className={`text-3xl font-bold ${getScoreColor(reputation.score)}`}>
            {reputation.score}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${reputation.score}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${getScoreBg(reputation.score)} rounded-full`}
          />
        </div>
      </div>

      {reputation.restrictions.cooldownUntil && reputation.restrictions.cooldownUntil.toMillis() > Date.now() && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900">Cooldown Active</p>
              <p className="text-xs text-red-700">
                Limited posting until {reputation.restrictions.cooldownUntil.toDate().toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {reputation.perks.highlightBadge && (
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-semibold text-purple-900">Active Perks</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {reputation.perks.fastPosting && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    Fast Posting
                  </span>
                )}
                {reputation.perks.highlightBadge && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                    Highlight Badge
                  </span>
                )}
                {reputation.perks.visibilityBoost && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    Visibility Boost
                  </span>
                )}
                {reputation.perks.prioritySupport && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                    Priority Support
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
      >
        <TrendingUp className="w-4 h-4" />
        {showDetails ? 'Hide' : 'Show'} Details
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 mb-1">Helpful Posts</p>
                <p className="text-2xl font-bold text-blue-900">{reputation.metrics.helpfulPosts}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 mb-1">Total Posts</p>
                <p className="text-2xl font-bold text-green-900">{reputation.metrics.totalPosts}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600 mb-1">Engagement</p>
                <p className="text-2xl font-bold text-purple-900">{reputation.metrics.engagement.toFixed(1)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-orange-600 mb-1">Consistency</p>
                <p className="text-2xl font-bold text-orange-900">{reputation.metrics.consistency.toFixed(1)}</p>
              </div>
            </div>

            {reputation.metrics.violations > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-900">
                    {reputation.metrics.violations} violations, {reputation.metrics.warnings} warnings
                  </p>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Last updated: {reputation.lastCalculated.toDate().toLocaleDateString()}
            </div>

            {reputation.manualOverride.active && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-yellow-900">Manual Override Active</p>
                <p className="text-xs text-yellow-700 mt-1">{reputation.manualOverride.reason}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
