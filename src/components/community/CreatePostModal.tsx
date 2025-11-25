import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Send, Package, Users, Crown, Zap, Lock } from 'lucide-react';
import { communityFeedService } from '../../services/communityFeedService';

interface CreatePostModalProps {
  currentUser: any;
  defaultChannel: 'announcements' | 'general' | 'study-room';
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({ currentUser, defaultChannel, onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<'text' | 'product'>('text');
  const [productLink, setProductLink] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'free' | 'pro' | 'vip' | 'pro-vip'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only Governors, Admins, and Mentors can target specific audiences
  const canTargetAudience = currentUser?.role === 'governor' || currentUser?.role === 'mentor' || currentUser?.role === 'admin';

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const validFiles = files.slice(0, 10);
      const newImageFiles = [...imageFiles, ...validFiles].slice(0, 10);
      setImageFiles(newImageFiles);

      const newPreviews: string[] = [];
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          if (newPreviews.length === validFiles.length) {
            setImagePreviews([...imagePreviews, ...newPreviews].slice(0, 10));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current && imageFiles.length === 1) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    if (postType === 'product' && !productLink.trim()) {
      alert('Please enter a product link');
      return;
    }

    setLoading(true);
    try {
      await communityFeedService.createPost(
        currentUser.uid,
        currentUser.name || currentUser.email || 'Anonymous',
        currentUser.email || '',
        content.trim(),
        selectedChannel,
        imageFiles.length > 0 ? imageFiles : undefined,
        currentUser.photoURL,
        postType === 'product' ? productLink.trim() : undefined,
        canTargetAudience ? targetAudience : 'all'
      );
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSelectAnnouncements = currentUser?.role === 'governor' || currentUser?.role === 'admin';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          position: 'fixed',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 chat-header flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Post</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Post Type *</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setPostType('text')}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    postType === 'text'
                      ? 'border-[#D71920] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="w-5 h-5" />
                    <span className="font-bold text-sm text-gray-900">Regular Post</span>
                  </div>
                  <p className="text-xs text-gray-600">Share your thoughts</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('product')}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    postType === 'product'
                      ? 'border-[#D71920] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-5 h-5" />
                    <span className="font-bold text-sm text-gray-900">Product Post</span>
                  </div>
                  <p className="text-xs text-gray-600">Share a marketplace product</p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Channel *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {canSelectAnnouncements && (
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('announcements')}
                    className={`p-3 rounded-xl border-2 transition text-left ${
                      selectedChannel === 'announcements'
                        ? 'border-[#D71920] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📢</span>
                      <span className="font-bold text-sm text-gray-900">Announcements</span>
                    </div>
                    <p className="text-xs text-gray-600">Important updates</p>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedChannel('general')}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    selectedChannel === 'general'
                      ? 'border-[#D71920] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💬</span>
                    <span className="font-bold text-sm text-gray-900">General</span>
                  </div>
                  <p className="text-xs text-gray-600">General discussions</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChannel('study-room')}
                  className={`p-3 rounded-xl border-2 transition text-left ${
                    selectedChannel === 'study-room'
                      ? 'border-[#D71920] bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📚</span>
                    <span className="font-bold text-sm text-gray-900">Study Room</span>
                  </div>
                  <p className="text-xs text-gray-600">Study & learning</p>
                </button>
              </div>
            </div>

            {/* Target Audience - Only for Governors and Mentors */}
            {canTargetAudience && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#D71920]" />
                  <label className="block text-sm font-bold text-gray-700">
                    Target Audience *
                  </label>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white text-xs font-bold rounded-full">
                    Governor/Mentor Only
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetAudience('all')}
                    className={`p-3 rounded-xl border-2 transition text-left ${
                      targetAudience === 'all'
                        ? 'border-[#D71920] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="font-bold text-xs text-gray-900">All Users</span>
                    </div>
                    <p className="text-[10px] text-gray-600">Everyone can see</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('free')}
                    className={`p-3 rounded-xl border-2 transition text-left ${
                      targetAudience === 'free'
                        ? 'border-[#D71920] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="w-4 h-4 text-gray-500" />
                      <span className="font-bold text-xs text-gray-900">Free Only</span>
                    </div>
                    <p className="text-[10px] text-gray-600">Free users only</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('pro')}
                    className={`p-3 rounded-xl border-2 transition text-left ${
                      targetAudience === 'pro'
                        ? 'border-[#D71920] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-[#FF3B3F]" />
                      <span className="font-bold text-xs text-gray-900">Pro Only</span>
                    </div>
                    <p className="text-[10px] text-gray-600">Pro subscribers</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('vip')}
                    className={`p-3 rounded-xl border-2 transition text-left ${
                      targetAudience === 'vip'
                        ? 'border-[#D71920] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-[#3D4A52]" />
                      <span className="font-bold text-xs text-gray-900">VIP Only</span>
                    </div>
                    <p className="text-[10px] text-gray-600">VIP members</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetAudience('pro-vip')}
                    className={`p-3 rounded-xl border-2 transition text-left ${
                      targetAudience === 'pro-vip'
                        ? 'border-[#D71920] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className="w-4 h-4 text-purple-600" />
                      <span className="font-bold text-xs text-gray-900">Pro + VIP</span>
                    </div>
                    <p className="text-[10px] text-gray-600">Paid members</p>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                  <span className="text-blue-600">ℹ️</span>
                  <span>This post will only be visible to users with the selected plan(s)</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full chat-input-field resize-none"
                rows={6}
                required
              />
            </div>

            {postType === 'product' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Product Link *</label>
                <input
                  type="text"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="/marketplace/product/YOUR_PRODUCT_ID"
                  className="w-full chat-input-field"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Copy the product ID from the marketplace URL (e.g., if URL is /marketplace/product/abc123, enter abc123)
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Images (Optional) - {imageFiles.length}/10
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {imagePreviews.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border-2 border-gray-200 aspect-square">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {index + 1}/{imagePreviews.length}
                        </div>
                      </div>
                    ))}
                  </div>
                  {imageFiles.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71920] transition flex items-center justify-center gap-2 text-gray-600 hover:text-[#D71920] bg-gray-50 hover:bg-red-50"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="font-semibold text-sm">Add more images</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71920] transition flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-[#D71920] bg-gray-50 hover:bg-red-50"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="font-semibold text-sm">Click to upload images</span>
                  <span className="text-xs text-gray-500">JPG, PNG, GIF (Max 10 images, 5MB each)</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex-1 bg-gradient-to-r from-[#D71920] to-[#B91518] hover:shadow-lg text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm sm:text-base">Posting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="text-sm sm:text-base">Post</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 chat-input-field font-semibold text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>

  );
}
