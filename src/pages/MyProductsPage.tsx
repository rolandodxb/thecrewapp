import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Edit, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/marketplace/ProductCard';
import EmptyState from '../components/EmptyState';
import {
  getMyProducts,
  publishProduct,
  archiveProduct,
  deleteProduct,
  MarketplaceProduct
} from '../services/marketplaceService';

export default function MyProductsPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  useEffect(() => {
    if (currentUser) {
      loadProducts();
    }
  }, [currentUser]);

  const loadProducts = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const fetchedProducts = await getMyProducts(currentUser.uid);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (productId: string) => {
    if (!confirm('Publish this product?')) return;

    try {
      await publishProduct(productId);
      await loadProducts();
      alert('Product published successfully!');
    } catch (error) {
      console.error('Error publishing product:', error);
      alert('Failed to publish product');
    }
  };

  const handleArchive = async (productId: string) => {
    if (!confirm('Archive this product?')) return;

    try {
      await archiveProduct(productId);
      await loadProducts();
      alert('Product archived successfully!');
    } catch (error) {
      console.error('Error archiving product:', error);
      alert('Failed to archive product');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product permanently?')) return;

    try {
      await deleteProduct(productId);
      await loadProducts();
      alert('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              My Products
            </h1>
            <p className="text-gray-600 mt-1">Manage your marketplace listings</p>
          </div>
          <button
            onClick={() => navigate('/marketplace/create')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'draft', 'published', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {status} ({products.filter(p => status === 'all' || p.status === status).length})
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Create your first product to start selling"
            action={{
              label: 'Create Product',
              onClick: () => navigate('/marketplace/create')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard
                  product={product}
                  showActions={false}
                />

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                  {product.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(product.id)}
                      className="w-9 h-9 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title="Publish"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {product.status === 'published' && (
                    <button
                      onClick={() => handleArchive(product.id)}
                      className="w-9 h-9 bg-yellow-600 hover:bg-yellow-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      title="Archive"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/marketplace/product/${product.id}`)}
                    className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
