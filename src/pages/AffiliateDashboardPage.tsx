import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, MousePointer, ShoppingCart, Link as LinkIcon, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { affiliateService, AffiliateAccount, Commission, AffiliateLink } from '../services/affiliateService';

export default function AffiliateDashboardPage() {
  const { currentUser } = useApp();
  const [account, setAccount] = useState<AffiliateAccount | null>(null);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalCommissions: 0,
    pendingPayout: 0,
    paidOut: 0
  });
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
  const [topProducts, setTopProducts] = useState<Array<{ productId: string; productName: string; commissionsEarned: number }>>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      let accountData = await affiliateService.getAffiliateAccount(currentUser.uid);

      if (!accountData && (currentUser.role === 'mentor' || currentUser.role === 'governor')) {
        await affiliateService.createAffiliateAccount(
          currentUser.uid,
          currentUser.name,
          currentUser.email,
          currentUser.role
        );
        accountData = await affiliateService.getAffiliateAccount(currentUser.uid);
      }

      if (!accountData) {
        setLoading(false);
        return;
      }

      const dashboard = await affiliateService.getAffiliateDashboard(currentUser.uid);
      setAccount(dashboard.account);
      setStats(dashboard.stats);
      setRecentCommissions(dashboard.recentCommissions);
      setTopProducts(dashboard.topProducts);

      const links = await affiliateService.getAllAffiliateLinks(currentUser.uid);
      setAffiliateLinks(links);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!currentUser) return;

    setRequestingPayout(true);
    try {
      const result = await affiliateService.requestPayout(currentUser.uid);
      if (result.success) {
        alert(result.message);
        await loadDashboardData();
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center border border-white/30 shadow-lg">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Affiliate Program</h2>
            <p className="text-gray-600 mb-6">
              The affiliate program is available for Mentors and Governors only.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            Affiliate Dashboard
          </h1>
          <p className="text-gray-600">Track your performance and earnings</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <MousePointer className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Clicks</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalClicks}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Conversions</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalConversions}</p>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 shadow-lg text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-white/80 text-sm mb-1">Total Commissions</p>
            <p className="text-3xl font-bold">${stats.totalCommissions.toFixed(2)}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Payout Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Commission Rate</span>
                <span className="text-xl font-bold text-blue-600">{(account.commissionRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <span className="text-gray-700 font-medium">Pending Payout</span>
                <span className="text-xl font-bold text-yellow-600">${stats.pendingPayout.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Paid Out</span>
                <span className="text-xl font-bold text-green-600">${stats.paidOut.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={requestingPayout || stats.pendingPayout < 50}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {requestingPayout ? 'Processing...' : 'Request Payout'}
            </button>
            {stats.pendingPayout < 50 && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Minimum payout amount is $50
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Your Affiliate Code</h3>
            <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-lg p-6 text-white mb-4">
              <p className="text-sm opacity-80 mb-2">Affiliate Code</p>
              <p className="text-3xl font-bold font-mono tracking-wider">{account.affiliateCode}</p>
            </div>
            <p className="text-sm text-gray-600">
              Add this code as a parameter (?ref={account.affiliateCode}) to any marketplace product URL to create your affiliate link and earn commissions on purchases.
            </p>
          </motion.div>
        </div>

        {topProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden mb-8"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Top Performing Products</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900">{product.productName}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${product.commissionsEarned.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {recentCommissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Recent Commissions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Order Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{commission.productName}</p>
                        <p className="text-xs text-gray-500">Order #{commission.orderId.substring(0, 8)}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {commission.createdAt.toDate().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${commission.orderAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        ${commission.commissionAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          commission.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : commission.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : commission.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {commission.status}
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
