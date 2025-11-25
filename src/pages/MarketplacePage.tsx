import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Heart, TrendingUp, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/marketplace/ProductCard';
import EmptyState from '../components/EmptyState';
import {
  getPublishedProducts,
  getProductsByCategory,
  searchProducts,
  toggleFavorite,
  isFavorite,
  MarketplaceProduct
} from '../services/marketplaceService';

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'Education & Courses', label: 'Education & Courses' },
  { value: 'Digital Products', label: 'Digital Products' },
  { value: 'Software & Tools', label: 'Software & Tools' },
  { value: 'Graphics & Design', label: 'Graphics & Design' },
  { value: 'Business Services', label: 'Business Services' },
  { value: 'Physical Products', label: 'Physical Products' },
  { value: 'Other', label: 'Other' }
];

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      loadProducts();
      loadFavorites();
    }
  }, [currentUser]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    console.log('🔍 MarketplacePage: Loading products...');
    try {
      const fetchedProducts = await getPublishedProducts(100);
      console.log('📦 MarketplacePage: Received products:', fetchedProducts.length);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('❌ MarketplacePage: Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!currentUser) return;

    try {
      const favoriteIds = new Set<string>();
      for (const product of products) {
        const isFav = await isFavorite(currentUser.uid, product.id);
        if (isFav) {
          favoriteIds.add(product.id);
        }
      }
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    setFilteredProducts(filtered);
  };

  const handleFavoriteToggle = async (productId: string) => {
    if (!currentUser) {
      alert('Please login to favorite products');
      return;
    }

    try {
      const newFavoriteState = await toggleFavorite(currentUser.uid, productId);
      const newFavorites = new Set(favorites);
      if (newFavoriteState) {
        newFavorites.add(productId);
      } else {
        newFavorites.delete(productId);
      }
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadProducts();
      return;
    }

    setLoading(true);
    try {
      const results = await searchProducts(searchTerm);
      setProducts(results);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50">
          <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Marketplace</h2>
          <p className="text-gray-600 mb-4">Please login to browse products</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Block free users from marketplace
  if (currentUser.plan === 'free') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Marketplace Access</h2>
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              The marketplace is available for <strong>Pro</strong> and <strong>VIP</strong> members only.
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Upgrade your plan to access exclusive products, services, and opportunities.
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg font-semibold"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/20 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                Marketplace
              </h1>
              <p className="text-gray-600 mt-1">Discover and sell amazing products</p>
            </div>
            {(currentUser?.role === 'mentor' || currentUser?.role === 'governor') && (
              <button
                onClick={() => navigate('/marketplace/create')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Sell
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              />
            </div>

            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              Search
            </button>
          </div>

          {/* Category Filter */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  selectedCategory === category.value
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/70 border border-gray-200/50'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 shadow-lg border border-blue-400/20">
            <div className="flex items-center gap-2 text-blue-50 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Total Products
            </div>
            <div className="text-2xl font-bold text-white">{products.length}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 shadow-lg border border-purple-400/20">
            <div className="flex items-center gap-2 text-purple-50 text-sm mb-1">
              <Filter className="w-4 h-4" />
              Filtered
            </div>
            <div className="text-2xl font-bold text-white">{filteredProducts.length}</div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 shadow-lg border border-pink-400/20">
            <div className="flex items-center gap-2 text-pink-50 text-sm mb-1">
              <Heart className="w-4 h-4" />
              Favorites
            </div>
            <div className="text-2xl font-bold text-white">{favorites.size}</div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 animate-pulse shadow-lg">
                <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={searchTerm ? "Try adjusting your search or filters" : "Be the first to list a product!"}
            action={currentUser?.role === 'mentor' || currentUser?.role === 'governor' ? {
              label: 'Create Product',
              onClick: () => navigate('/marketplace/create')
            } : undefined}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onFavoriteToggle={handleFavoriteToggle}
                isFavorite={favorites.has(product.id)}
                showActions={true}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
