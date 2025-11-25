import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Package, Download, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { MarketplaceProduct } from '../../services/marketplaceService';
import { formatPrice } from '../../services/stripeService';

interface ProductCardProps {
  product: MarketplaceProduct;
  onFavoriteToggle?: (productId: string) => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

export default function ProductCard({
  product,
  onFavoriteToggle,
  isFavorite = false,
  showActions = true
}: ProductCardProps) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    navigate(`/marketplace/product/${product.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFavoriteToggle) {
      onFavoriteToggle(product.id);
    }
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/marketplace/checkout/${product.id}`);
  };

  const getProductIcon = () => {
    switch (product.product_type) {
      case 'digital':
        return <Download className="w-4 h-4" />;
      case 'physical':
        return <Package className="w-4 h-4" />;
      case 'service':
        return <Tag className="w-4 h-4" />;
    }
  };

  const getDefaultImage = () => {
    return `https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=300&fit=crop`;
  };

  const productImage = !imageError && product.images && product.images.length > 0
    ? product.images[0]
    : getDefaultImage();

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="bg-white/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-200/30 cursor-pointer group transition-all"
      onClick={handleCardClick}
    >
      {/* Product Image */}
      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <img
          src={productImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={() => setImageError(true)}
        />

        {/* Product Type Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] font-medium">
          {getProductIcon()}
          <span className="capitalize">{product.product_type}</span>
        </div>

        {/* Favorite Button */}
        {showActions && (
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-red-500 hover:text-white'
            }`}
          >
            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Out of Stock Badge */}
        {product.product_type === 'physical' && product.stock_quantity !== undefined && product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">OUT OF STOCK</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
          {product.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-1 mb-2">
          {product.description}
        </p>

        {/* Category & Stats */}
        <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500">
          <div className="flex items-center gap-0.5">
            <Eye className="w-2.5 h-2.5" />
            <span>{product.views_count || 0}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Heart className="w-2.5 h-2.5" />
            <span>{product.likes_count || 0}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <ShoppingCart className="w-2.5 h-2.5" />
            <span>{product.sales_count || 0} sold</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(product.price, product.currency)}
            </div>
            {product.product_type === 'physical' && product.stock_quantity !== undefined && (
              <div className="text-xs text-gray-500">
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </div>
            )}
          </div>

          {showActions && product.stock_quantity !== 0 && (
            <button
              onClick={handleBuyClick}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs transition-colors flex items-center gap-1"
            >
              <ShoppingCart className="w-3 h-3" />
              Buy
            </button>
          )}
        </div>

        {/* Seller Info */}
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
          {product.seller_photo_url ? (
            <img
              src={product.seller_photo_url}
              alt="Seller"
              className="w-4 h-4 rounded-full"
            />
          ) : (
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold text-white">
              {product.seller_name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-[10px] text-gray-600 truncate font-medium">By {product.seller_name}</span>
        </div>
      </div>
    </motion.div>
  );
}
