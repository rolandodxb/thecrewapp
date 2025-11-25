import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, Eye, Package, Download, Mail, Share2, Tag, MessageCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  getProduct,
  incrementProductViews,
  toggleFavorite,
  isFavorite,
  MarketplaceProduct
} from '../services/marketplaceService';
import { formatPrice } from '../services/stripeService';
import MarketplaceChatModal from '../components/marketplace/MarketplaceChatModal';

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    if (productId && currentUser) {
      loadProduct();
    }
  }, [productId, currentUser]);

  const loadProduct = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const fetchedProduct = await getProduct(productId);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
        await incrementProductViews(productId);

        if (currentUser) {
          const favorite = await isFavorite(currentUser.uid, productId);
          setIsFav(favorite);
        }
      } else {
        alert('Product not found');
        navigate('/marketplace');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Failed to load product');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!currentUser || !productId) return;

    try {
      const newState = await toggleFavorite(currentUser.uid, productId);
      setIsFav(newState);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite');
    }
  };

  const handleBuyClick = () => {
    if (!product) return;
    navigate(`/marketplace/checkout/${product.id}`);
  };

  const handleContactSeller = () => {
    if (!product || !currentUser) return;
    if (currentUser.uid === product.seller_id) {
      alert('You cannot message yourself');
      return;
    }
    setShowChatModal(true);
  };

  const handleChatModalClose = () => {
    setShowChatModal(false);
  };

  const handleConversationCreated = (conversationId: string) => {
    console.log('Conversation created:', conversationId);
  };

  const handleShare = () => {
    if (!product) return;
    const url = `${window.location.origin}/marketplace/product/${product.id}`;
    setShowShareMenu(true);
  };

  const copyInternalLink = () => {
    if (!product) return;
    const internalLink = `/marketplace/product/${product.id}`;
    navigator.clipboard.writeText(internalLink);
    alert('Internal link copied! You can share this in community chat.');
    setShowShareMenu(false);
  };

  const copyFullLink = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-4"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const selectedImage = product.images && product.images.length > 0
    ? product.images[selectedImageIndex]
    : 'https://images.unsplash.com/photo-1557821552-17105176677c?w=800&h=600&fit=crop';

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Marketplace
        </button>

        {/* Warning Banner */}
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Important Safety Notice</h3>
              <p className="text-sm text-yellow-700">
                Any sales made outside this app are not secured by our system, support, or governors.
                For your protection, please complete all transactions through the marketplace chat and payment system only.
              </p>
            </div>
          </div>
        </div>

        {/* Product Detail */}
        <div className="bg-white/30 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Images */}
            <div>
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4"
              >
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {/* Type Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                {product.product_type === 'digital' && <Download className="w-4 h-4" />}
                {product.product_type === 'physical' && <Package className="w-4 h-4" />}
                {product.product_type === 'service' && <Tag className="w-4 h-4" />}
                <span className="capitalize">{product.product_type}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{product.views_count || 0} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{product.likes_count || 0} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{product.sales_count || 0} sold</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900">
                  {formatPrice(product.price, product.currency)}
                </div>
                {product.product_type === 'physical' && product.stock_quantity !== undefined && (
                  <div className="text-sm text-gray-600 mt-2">
                    {product.stock_quantity > 0 ? (
                      <span className="text-green-600 font-medium">
                        {product.stock_quantity} in stock
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">Out of stock</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleBuyClick}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Buy Now
                </button>

                <button
                  onClick={handleFavoriteToggle}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    isFav
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handleShare}
                  className="px-4 py-3 border-2 border-gray-300 bg-white text-gray-600 hover:border-gray-400 rounded-lg transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>

              {/* Category & Tags */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {product.category}
                </span>

                {product.tags && product.tags.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Seller</h3>
                <div className="flex items-center gap-3 mb-4">
                  {product.seller_photo_url ? (
                    <img
                      src={product.seller_photo_url}
                      alt={product.seller_name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-xl font-bold text-gray-600">
                      {product.seller_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{product.seller_name?.includes('@') ? product.seller_name.split('@')[0] : product.seller_name}</div>
                    <div className="text-sm text-gray-600">Verified Seller</div>
                  </div>
                </div>

                <button
                  onClick={handleContactSeller}
                  disabled={currentUser?.uid === product.seller_id}
                  className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {showChatModal ? 'Hide Chat' : 'Contact Seller'}
                </button>

                {/* Inline Chat Dropdown */}
                {showChatModal && product && (
                  <MarketplaceChatModal
                    isOpen={showChatModal}
                    onClose={handleChatModalClose}
                    productId={product.id}
                    productTitle={product.title}
                    productImage={product.images?.[0]}
                    sellerId={product.seller_id}
                    sellerName={product.seller_name}
                    onConversationCreated={handleConversationCreated}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Share Menu */}
      <AnimatePresence>
        {showShareMenu && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareMenu(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Share Product</h3>
              <div className="space-y-3">
                <button
                  onClick={copyInternalLink}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Copy Internal Link (for Community Chat)
                </button>
                <button
                  onClick={copyFullLink}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share Full Link
                </button>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
