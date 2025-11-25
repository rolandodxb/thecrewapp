import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllProducts,
  removeProduct,
  bulkRemoveProducts,
  flagProduct,
  getModerationLogs,
  REMOVAL_REASONS,
  ModerationFilters,
  RemovalReason
} from '../../services/marketplaceModerationService';
import { MarketplaceProduct } from '../../services/marketplaceService';

export default function MarketplaceModerationDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [viewingProduct, setViewingProduct] = useState<MarketplaceProduct | null>(null);
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [productToRemove, setProductToRemove] = useState<string | null>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [removalDetails, setRemovalDetails] = useState('');
  const [processing, setProcessing] = useState(false);

  const [filters, setFilters] = useState<ModerationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    flagged: 0
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    loadProducts();
  }, [currentUser, filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { products: fetchedProducts } = await getAllProducts(filters, 100);
      setProducts(fetchedProducts);

      setStats({
        total: fetchedProducts.length,
        published: fetchedProducts.filter(p => p.status === 'published').length,
        flagged: fetchedProducts.filter(p => (p as any).flagged).length
      });
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setProductToRemove(productId);
    setShowRemovalModal(true);
  };

  const confirmRemoval = async () => {
    if (!currentUser || !productToRemove || !removalReason) return;

    setProcessing(true);
    try {
      await removeProduct(
        productToRemove,
        currentUser.uid,
        currentUser.displayName || 'Moderator',
        currentUser.email || '',
        removalReason,
        removalDetails
      );

      setProducts(products.filter(p => p.id !== productToRemove));
      setShowRemovalModal(false);
      setProductToRemove(null);
      setRemovalReason('');
      setRemovalDetails('');
    } catch (error: any) {
      alert('Failed to remove product: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkRemove = async () => {
    if (!currentUser || selectedProducts.size === 0 || !removalReason) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedProducts.size} products?`
    );

    if (!confirmed) return;

    setProcessing(true);
    try {
      const result = await bulkRemoveProducts(
        Array.from(selectedProducts),
        currentUser.uid,
        currentUser.displayName || 'Moderator',
        currentUser.email || '',
        removalReason,
        removalDetails
      );

      alert(`Removed ${result.success} products. ${result.failed} failed.`);

      setProducts(products.filter(p => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
      setRemovalReason('');
      setRemovalDetails('');
    } catch (error: any) {
      alert('Failed to remove products: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" />
            Marketplace Moderation
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Review and manage marketplace products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Flagged</p>
                <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search products..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 pt-4 border-t"
            >
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <input
                type="number"
                placeholder="Min Price"
                value={filters.priceMin || ''}
                onChange={(e) => setFilters({ ...filters, priceMin: parseFloat(e.target.value) || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />

              <input
                type="number"
                placeholder="Max Price"
                value={filters.priceMax || ''}
                onChange={(e) => setFilters({ ...filters, priceMax: parseFloat(e.target.value) || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />

              <button
                onClick={() => setFilters({})}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                Clear Filters
              </button>
            </motion.div>
          )}

          {selectedProducts.size > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                {selectedProducts.size} product(s) selected
              </p>
              <div className="flex gap-2">
                <select
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  className="px-3 py-1.5 border border-blue-300 rounded text-sm"
                >
                  <option value="">Select reason...</option>
                  {REMOVAL_REASONS.map(reason => (
                    <option key={reason.code} value={reason.code}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkRemove}
                  disabled={!removalReason || processing}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedProducts.size === products.length && products.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              Select All
            </label>
          </div>

          {products.map(product => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0"
                  />

                  {product.images[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {formatPrice(product.price, product.currency)}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                        {product.category}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded capitalize">
                        {product.product_type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        {product.seller_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewingProduct(product)}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {products.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {viewingProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setViewingProduct(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">{viewingProduct.title}</h2>
                    <button
                      onClick={() => setViewingProduct(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {viewingProduct.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${viewingProduct.title} ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-700">{viewingProduct.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="font-semibold">{formatPrice(viewingProduct.price, viewingProduct.currency)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="font-semibold">{viewingProduct.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-semibold capitalize">{viewingProduct.product_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Seller</p>
                        <p className="font-semibold">{viewingProduct.seller_name}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <button
                        onClick={() => {
                          handleRemoveProduct(viewingProduct.id);
                          setViewingProduct(null);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-5 h-5" />
                        Remove Product
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showRemovalModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowRemovalModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-lg max-w-md w-full p-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Remove Product</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Removal *
                    </label>
                    <select
                      value={removalReason}
                      onChange={(e) => setRemovalReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a reason...</option>
                      {REMOVAL_REASONS.map(reason => (
                        <option key={reason.code} value={reason.code}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {removalReason && REMOVAL_REASONS.find(r => r.code === removalReason)?.requiresDetails && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Details *
                      </label>
                      <textarea
                        value={removalDetails}
                        onChange={(e) => setRemovalDetails(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Provide more information..."
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setShowRemovalModal(false)}
                      disabled={processing}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmRemoval}
                      disabled={!removalReason || processing}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {processing ? 'Removing...' : 'Confirm Removal'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
