import { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Share2, TrendingUp, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { referralService, Referral, ReferralConversion } from '../services/referralService';

export default function InviteFriendsPage() {
  const { currentUser } = useApp();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalEarnings: 0,
    pointsEarned: 0
  });
  const [recentConversions, setRecentConversions] = useState<ReferralConversion[]>([]);

  useEffect(() => {
    loadReferralData();
  }, [currentUser]);

  const loadReferralData = async () => {
    if (!currentUser) return;

    try {
      let referralData = await referralService.getReferral(currentUser.uid);

      if (!referralData) {
        const code = await referralService.createReferral(
          currentUser.uid,
          currentUser.name,
          currentUser.email
        );
        referralData = await referralService.getReferral(currentUser.uid);
      }

      setReferral(referralData);

      const statsData = await referralService.getReferralStats(currentUser.uid);
      setStats(statsData);

      const conversions = await referralService.getRecentConversions(currentUser.uid);
      setRecentConversions(conversions);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReferralLink = () => {
    if (!referral) return '';
    return `https://thecrewacademy.co/register?ref=${referral.referralCode}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getReferralLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVia = (method: 'email' | 'twitter' | 'facebook') => {
    const link = getReferralLink();
    const message = `Join Emirates Academy and get started with your cabin crew training! Use my referral link: ${link}`;

    switch (method) {
      case 'email':
        window.location.href = `mailto:?subject=Join Emirates Academy&body=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            Invite Friends
          </h1>
          <p className="text-gray-600">Share Emirates Academy and earn rewards for every friend who joins!</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Referrals</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalConversions}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Points Earned</p>
            <p className="text-3xl font-bold text-gray-900">{stats.pointsEarned}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-[#D71920]/90 to-[#B91518]/90 backdrop-blur-xl rounded-xl p-8 mb-8 text-white shadow-xl border border-white/20"
        >
          <h2 className="text-2xl font-bold mb-4">Your Referral Link</h2>
          <p className="mb-6 opacity-90">Share this link with friends to earn 50 points for each successful referral!</p>

          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-white text-[#D71920] rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => shareVia('email')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share via Email
            </button>
            <button
              onClick={() => shareVia('twitter')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share on Twitter
            </button>
            <button
              onClick={() => shareVia('facebook')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share on Facebook
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">How It Works</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Share Your Link</h4>
                <p className="text-sm text-gray-600">
                  Copy your unique referral link and share it with friends via email, social media, or messaging apps.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Friends Sign Up</h4>
                <p className="text-sm text-gray-600">
                  When your friends register using your link, they'll be tracked as your referral.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Earn Rewards</h4>
                <p className="text-sm text-gray-600">
                  You'll earn 50 points and $10 bonus for each successful referral! No limits.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {recentConversions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Recent Referrals</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Bonus</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentConversions.map((conversion) => (
                    <tr key={conversion.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{conversion.newUserName}</p>
                          <p className="text-xs text-gray-500">{conversion.newUserEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {conversion.timestamp.toDate().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {conversion.pointsAwarded} pts
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ${conversion.bonusAwarded}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          conversion.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : conversion.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {conversion.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
