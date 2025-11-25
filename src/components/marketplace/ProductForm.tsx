import { useState, FormEvent } from 'react';
import { Save, Upload, DollarSign, Package, Download, Briefcase, Tag, Calendar, MapPin, Users } from 'lucide-react';
import { ProductFormData } from '../../services/marketplaceService';
import ImageUploadMultiple from './ImageUploadMultiple';

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
  isEdit?: boolean;
}

const CATEGORIES = [
  'Education & Courses',
  'Digital Products',
  'Software & Tools',
  'Graphics & Design',
  'Business Services',
  'Physical Products',
  'Activities & Events',
  'Other'
];

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price ? initialData.price / 100 : 0,
    currency: initialData?.currency || 'USD',
    category: initialData?.category || CATEGORIES[0],
    product_type: initialData?.product_type || 'digital',
    images: initialData?.images || [],
    digital_file_url: initialData?.digital_file_url || '',
    digital_file_name: initialData?.digital_file_name || '',
    stock_quantity: initialData?.stock_quantity,
    tags: initialData?.tags || [],
    is_activity: initialData?.is_activity || false,
    activity_date: initialData?.activity_date || '',
    activity_location: initialData?.activity_location || '',
    max_participants: initialData?.max_participants
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (formData.images.length === 0) {
      setError('At least one image is required');
      return;
    }

    if (formData.product_type === 'physical' && !formData.stock_quantity) {
      setError('Stock quantity is required for physical products');
      return;
    }

    if (formData.product_type === 'activity') {
      if (!formData.activity_date) {
        setError('Event date and time are required for activities');
        return;
      }
      if (!formData.activity_location?.trim()) {
        setError('Event location is required for activities');
        return;
      }
      if (!formData.max_participants || formData.max_participants <= 0) {
        setError('Maximum participants must be greater than 0');
        return;
      }
    }

    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error: any) {
      setError(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag)
    });
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'digital':
        return <Download className="w-4 h-4" />;
      case 'physical':
        return <Package className="w-4 h-4" />;
      case 'service':
        return <Briefcase className="w-4 h-4" />;
      case 'activity':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
          placeholder="Enter product title"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
          placeholder="Describe your product in detail..."
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000 characters</p>
      </div>

      {/* Product Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['digital', 'physical', 'service', 'activity'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, product_type: type as any, is_activity: type === 'activity' })}
              className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                formData.product_type === type
                  ? 'border-blue-500 bg-blue-500/20 backdrop-blur-sm text-blue-600'
                  : 'border-gray-200/50 bg-white/30 backdrop-blur-sm hover:border-gray-300 hover:bg-white/50 text-gray-600'
              }`}
            >
              {getProductTypeIcon(type)}
              <span className="text-sm font-medium capitalize">{type === 'activity' ? 'Event' : type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AED">AED (د.إ)</option>
          </select>
        </div>
      </div>

      {/* Stock Quantity (Physical products only) */}
      {formData.product_type === 'physical' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Quantity *
          </label>
          <input
            type="number"
            min="0"
            value={formData.stock_quantity || 0}
            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            placeholder="Enter available quantity"
          />
        </div>
      )}

      {/* Event/Activity Fields */}
      {formData.product_type === 'activity' && (
        <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50/80 to-blue-50/80 backdrop-blur-sm rounded-lg border border-purple-200/50 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Event Details
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.activity_date || ''}
              onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.activity_location || ''}
                onChange={(e) => setFormData({ ...formData, activity_location: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                placeholder="Enter event location or venue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Participants *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="1"
                value={formData.max_participants || ''}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                placeholder="Enter maximum capacity"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Set the maximum number of people who can attend this event
            </p>
          </div>
        </div>
      )}

      {/* Digital File URL (Digital products only) */}
      {formData.product_type === 'digital' && (
        <div className="space-y-4 p-4 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-200/50 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digital File URL (Optional)
            </label>
            <input
              type="url"
              value={formData.digital_file_url || ''}
              onChange={(e) => setFormData({ ...formData, digital_file_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              placeholder="https://example.com/file.pdf"
            />
            <p className="text-xs text-gray-600 mt-1">
              Add a direct download link for your digital product
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Name (Optional)
            </label>
            <input
              type="text"
              value={formData.digital_file_name || ''}
              onChange={(e) => setFormData({ ...formData, digital_file_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              placeholder="product-file.pdf"
            />
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            className="flex-1 px-4 py-2 border border-gray-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            placeholder="Add a tag and press Enter"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-white/50 backdrop-blur-sm hover:bg-white/70 text-gray-700 rounded-lg transition-colors border border-gray-200/50"
          >
            <Tag className="w-5 h-5" />
          </button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 backdrop-blur-sm text-blue-700 rounded-full text-sm border border-blue-200/50"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images *
        </label>
        <ImageUploadMultiple
          images={formData.images}
          onChange={(images) => setFormData({ ...formData, images })}
          maxImages={5}
          maxSizePerImageMB={5}
        />
        <p className="text-xs text-gray-500 mt-2">
          First image will be used as the primary product image
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300/50 text-gray-700 rounded-lg hover:bg-white/30 bg-white/20 backdrop-blur-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
