import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Download, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';
import { getMyOrders, MarketplaceOrder, canDownload, incrementDownloadCount } from '../services/orderService';
import { formatPrice } from '../services/stripeService';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadOrders();
    }
  }, [currentUser]);

  const loadOrders = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const fetchedOrders = await getMyOrders(currentUser.uid);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (order: MarketplaceOrder) => {
    if (!order.digital_download_url) {
      alert('Download link not available');
      return;
    }

    const allowed = await canDownload(order.id);
    if (!allowed) {
      alert('Download limit reached or link expired');
      return;
    }

    window.open(order.digital_download_url, '_blank');
    await incrementDownloadCount(order.id);
    await loadOrders();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
      case 'refunded':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
            My Orders
          </h1>
          <p className="text-gray-600 mt-1">Track and manage your purchases</p>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Start shopping to see your orders here"
            action={{
              label: 'Browse Marketplace',
              onClick: () => navigate('/marketplace')
            }}
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-6">
                  {/* Product Image */}
                  <img
                    src={order.product_image || ''}
                    alt={order.product_title}
                    className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                  />

                  {/* Order Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {order.product_title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Order #{order.order_number}</span>
                          <span>•</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(order.total_amount, order.currency)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Qty: {order.quantity}
                        </div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-medium text-sm ${getStatusColor(order.payment_status)}`}>
                        {getStatusIcon(order.payment_status)}
                        <span className="capitalize">{order.payment_status}</span>
                      </div>

                      {order.delivery_status && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-medium text-sm ${getStatusColor(order.delivery_status)}`}>
                          {getStatusIcon(order.delivery_status)}
                          <span className="capitalize">{order.delivery_status}</span>
                        </div>
                      )}

                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                        <Package className="w-4 h-4" />
                        {order.product_type}
                      </span>
                    </div>

                    {/* Seller Info */}
                    <div className="text-sm text-gray-600 mb-4">
                      Sold by: <span className="font-medium text-gray-900">{order.seller_name}</span>
                    </div>

                    {/* Digital Download */}
                    {order.product_type === 'digital' && order.payment_status === 'completed' && (
                      <div className="pt-4 border-t border-gray-200">
                        {order.digital_download_url ? (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Downloads: {order.download_count || 0} / {order.max_downloads}
                            </div>
                            <button
                              onClick={() => handleDownload(order)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-600">
                            Download link will be available shortly...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-200 flex gap-3">
                      <button
                        onClick={() => navigate(`/marketplace/product/${order.product_id}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                      >
                        View Product
                      </button>
                      <button
                        onClick={() => window.location.href = `mailto:${order.seller_email}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                      >
                        Contact Seller
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
