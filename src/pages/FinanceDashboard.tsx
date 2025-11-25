import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Package, CreditCard, Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatPrice } from '../services/stripeService';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionRevenue: number;
  marketplaceRevenue: number;
  totalTransactions: number;
  activeSubscriptions: number;
}

interface Transaction {
  id: string;
  type: 'subscription' | 'marketplace';
  amount: number;
  date: Timestamp;
  description: string;
  status: string;
}

export default function FinanceDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    subscriptionRevenue: 0,
    marketplaceRevenue: 0,
    totalTransactions: 0,
    activeSubscriptions: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (currentUser?.role === 'finance' || currentUser?.role === 'governor') {
      loadFinanceData();
    }
  }, [currentUser, timeRange]);

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Get marketplace orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);

      let marketplaceTotal = 0;
      const transactions: Transaction[] = [];

      ordersSnapshot.forEach((doc) => {
        const order = doc.data();
        marketplaceTotal += order.totalAmount || 0;
        transactions.push({
          id: doc.id,
          type: 'marketplace',
          amount: order.totalAmount || 0,
          date: order.createdAt,
          description: `Order from ${order.buyerName}`,
          status: order.status
        });
      });

      // Get subscription data
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);

      let subscriptionTotal = 0;
      let activeSubscriptions = 0;

      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        if (user.plan === 'pro') {
          subscriptionTotal += 29;
          activeSubscriptions++;
        } else if (user.plan === 'vip') {
          subscriptionTotal += 99;
          activeSubscriptions++;
        }
      });

      setRevenueData({
        totalRevenue: marketplaceTotal + subscriptionTotal,
        monthlyRevenue: marketplaceTotal + subscriptionTotal,
        subscriptionRevenue: subscriptionTotal,
        marketplaceRevenue: marketplaceTotal,
        totalTransactions: transactions.length,
        activeSubscriptions
      });

      setRecentTransactions(transactions.slice(0, 10));
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const csvContent = [
      ['Transaction ID', 'Type', 'Amount', 'Date', 'Description', 'Status'],
      ...recentTransactions.map(t => [
        t.id,
        t.type,
        t.amount.toString(),
        t.date.toDate().toLocaleDateString(),
        t.description,
        t.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!currentUser || (currentUser.role !== 'finance' && currentUser.role !== 'governor')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <DollarSign className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only Finance role and Governors can access the finance dashboard.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                Finance Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Monitor revenue, transactions, and financial metrics</p>
            </div>
            <div className="flex gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(revenueData.totalRevenue)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Subscriptions</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(revenueData.subscriptionRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">{revenueData.activeSubscriptions} active</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Marketplace</p>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(revenueData.marketplaceRevenue)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/50 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-gray-600 text-sm mb-1">Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{revenueData.totalTransactions}</p>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/80 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No transactions found for the selected period
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'marketplace'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatPrice(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.date.toDate().toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
