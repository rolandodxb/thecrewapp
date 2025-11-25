import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, TrendingUp, DollarSign, Edit, Trash2, BarChart3, ShoppingBag, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { getSellerProducts, deleteProduct, MarketplaceProduct, updateSellerNameOnProducts } from '../services/marketplaceService';
import { formatPrice } from '../services/stripeService';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [updatingNames, setUpdatingNames] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadProducts();
    }
  }, [currentUser]);

  const loadProducts = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const sellerProducts = await getSellerProducts(currentUser.uid);
      setProducts(sellerProducts);

      const totalViews = sellerProducts.reduce((sum, p) => sum + (p.views_count || 0), 0);
      const totalSales = sellerProducts.reduce((sum, p) => sum + (p.sales_count || 0), 0);
      const totalRevenue = sellerProducts.reduce((sum, p) => sum + ((p.sales_count || 0) * p.price), 0);

      setStats({
        totalProducts: sellerProducts.length,
        totalViews,
        totalSales,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error loading seller products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const handleUpdateSellerNames = async () => {
    if (!currentUser) return;

    if (!confirm(`Update all your products to show "${currentUser.name}" as the seller name?`)) return;

    setUpdatingNames(true);
    try {
      const count = await updateSellerNameOnProducts(currentUser.uid, currentUser.name);
      alert(`✅ Successfully updated ${count} product(s)!`);
      await loadProducts();
    } catch (error) {
      console.error('Error updating seller names:', error);
      alert('Failed to update seller names');
    } finally {
      setUpdatingNames(false);
    }
  };

  const getStatusBadge = (product: MarketplaceProduct) => {
    if (product.status === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending Review</span>;
    }
    if (product.status === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Rejected</span>;
    }
    if (product.product_type === 'physical' && product.stock_quantity === 0) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Out of Stock</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please login to access seller dashboard</p>
        </div>
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
              Only <strong>Mentors</strong> and <strong>Governors</strong> can access the seller dashboard.
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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
              Seller Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your products and track performance</p>
          </div>
          <button
            onClick={handleUpdateSellerNames}
            disabled={updatingNames || products.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {updatingNames ? 'Updating...' : 'Update Seller Name'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Products</span>
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProducts}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/20 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Views</span>
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalViews}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/20 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Sales</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalSales}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/20 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(stats.totalRevenue, 'USD')}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => navigate('/marketplace/create')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
          >
            <Package className="w-5 h-5" />
            Create New Product
          </button>
          <button
            onClick={() => navigate('/seller/billing')}
            className="px-6 py-3 bg-white/20 backdrop-blur-xl hover:bg-white/30 border border-white/30 text-gray-900 rounded-lg font-medium transition-all flex items-center gap-2 shadow-xl"
          >
            <BarChart3 className="w-5 h-5" />
            View Billing
          </button>
        </div>

        {/* Products Table */}
        <div className="bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Products</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You haven't created any products yet</p>
              <button
                onClick={() => navigate('/marketplace/create')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
              >
                Create Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10 backdrop-blur-xl">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/10 backdrop-blur-xl divide-y divide-gray-200/50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1557821552-17105176677c?w=100'}
                            alt={product.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{product.title}</div>
                            <div className="text-xs text-gray-500">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(product)}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {formatPrice(product.price, product.currency)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.views_count || 0}</td>
                      <td className="px-6 py-4 text-gray-600">{product.sales_count || 0}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {formatPrice((product.sales_count || 0) * product.price, product.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/marketplace/product/${product.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/marketplace/edit/${product.id}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
