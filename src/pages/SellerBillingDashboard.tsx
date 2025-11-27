import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, CreditCard, RefreshCw, Users, Filter, Download, Search, MapPin, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import InspectionProtection from '../components/InspectionProtection';
import { useApp } from '../context/AppContext';
import { getSellerOrders, Order } from '../services/orderService';
import { formatPrice } from '../services/stripeService';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Transaction {
  id: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  productTitle: string;
  createdAt: Date;
  address?: {
    line1: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
  };
  phone?: string;
}

export default function SellerBillingDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    processedRefunds: 0,
    totalCustomers: 0,
  });

  useEffect(() => {
    if (currentUser) {
      loadBillingData();
    }
  }, [currentUser]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const loadBillingData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const orders = await getSellerOrders(currentUser.uid);

      const transactionsList: Transaction[] = orders.map(order => ({
        id: order.id,
        orderId: order.id,
        buyerName: order.buyer_name || 'Unknown',
        buyerEmail: order.buyer_email || 'N/A',
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        paymentMethod: order.payment_method || 'Card',
        productTitle: order.product_title,
        createdAt: order.created_at.toDate(),
        address: order.shipping_address,
        phone: order.buyer_phone,
      }));

      setTransactions(transactionsList);

      const totalEarnings = transactionsList
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingPayments = transactionsList
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

      const processedRefunds = transactionsList
        .filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + t.amount, 0);

      const uniqueCustomers = new Set(transactionsList.map(t => t.buyerEmail)).size;

      setStats({
        totalEarnings,
        pendingPayments,
        processedRefunds,
        totalCustomers: uniqueCustomers,
      });
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.buyerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleRefund = async (transactionId: string) => {
    const reason = prompt('Please enter the reason for refund:');
    if (!reason) return;

    if (!confirm('Are you sure you want to process this refund?')) return;

    try {
      const orderRef = doc(db, 'orders', transactionId);
      await updateDoc(orderRef, {
        status: 'refunded',
        refund_reason: reason,
        refunded_at: Timestamp.now(),
      });

      alert('Refund processed successfully');
      await loadBillingData();
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      case 'failed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Product', 'Amount', 'Status', 'Payment Method'];
    const rows = filteredTransactions.map(t => [
      t.orderId,
      t.createdAt.toLocaleDateString(),
      t.buyerName,
      t.productTitle,
      formatPrice(t.amount, t.currency),
      t.status,
      t.paymentMethod,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to access billing dashboard</p>
      </div>
    );
  }

  // Restrict access to mentors and governors only
  if (currentUser.role === 'student') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800">
              Only <strong>Mentors</strong> and <strong>Governors</strong> can access billing and earnings.
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            You can browse and purchase products from the marketplace.
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <InspectionProtection>
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-300" />
            Billing Dashboard
          </h1>
          <p className="text-gray-200 mt-1">Track your earnings and manage payments</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-gray-900 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100 text-sm">Total Earnings</span>
              <DollarSign className="w-5 h-5 text-green-100" />
            </div>
            <div className="text-3xl font-bold">{formatPrice(stats.totalEarnings, 'USD')}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-gray-900 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-100 text-sm">Pending Payments</span>
              <RefreshCw className="w-5 h-5 text-yellow-100" />
            </div>
            <div className="text-3xl font-bold">{formatPrice(stats.pendingPayments, 'USD')}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-gray-900 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-100 text-sm">Processed Refunds</span>
              <CreditCard className="w-5 h-5 text-red-100" />
            </div>
            <div className="text-3xl font-bold">{formatPrice(stats.processedRefunds, 'USD')}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-gray-900 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Total Customers</span>
              <Users className="w-5 h-5 text-blue-100" />
            </div>
            <div className="text-3xl font-bold">{stats.totalCustomers}</div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, product, or order ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/20 backdrop-blur-xl"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/20 backdrop-blur-xl"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-gray-900 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-gray-200/50">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{transaction.buyerName}</div>
                        <div className="text-xs text-gray-500">{transaction.buyerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{transaction.productTitle}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatPrice(transaction.amount, transaction.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{transaction.paymentMethod}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Details
                          </button>
                          {transaction.status === 'completed' && (
                            <button
                              onClick={() => handleRefund(transaction.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/30"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Transaction Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Order ID</label>
                  <p className="text-gray-900">{selectedTransaction.orderId}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Customer Name</label>
                  <p className="text-gray-900">{selectedTransaction.buyerName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{selectedTransaction.buyerEmail}</p>
                </div>

                {selectedTransaction.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{selectedTransaction.phone}</p>
                  </div>
                )}

                {selectedTransaction.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Shipping Address
                    </label>
                    <div className="bg-white/20 backdrop-blur-xl rounded-lg p-4 text-sm text-gray-900">
                      <p>{selectedTransaction.address.line1}</p>
                      <p>
                        {selectedTransaction.address.city}, {selectedTransaction.address.state}{' '}
                        {selectedTransaction.address.postal_code}
                      </p>
                      <p>{selectedTransaction.address.country}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Product</label>
                  <p className="text-gray-900">{selectedTransaction.productTitle}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Payment Method</label>
                  <p className="text-gray-900">{selectedTransaction.paymentMethod}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900">{selectedTransaction.createdAt.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-all"
                >
                  Close
                </button>
                {selectedTransaction.status === 'completed' && (
                  <button
                    onClick={() => {
                      handleRefund(selectedTransaction.id);
                      setSelectedTransaction(null);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-gray-900 rounded-lg font-medium transition-all"
                  >
                    Process Refund
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
    </InspectionProtection>
  );
}
