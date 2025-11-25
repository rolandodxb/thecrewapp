import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { communityFeedService, CommunityPost, POSTS_PER_PAGE } from '../../services/communityFeedService';
import { MessageCircle, Image as ImageIcon, Plus, Filter, X, Send, Bot, Shield, Package, Users, Lock, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

type Channel = 'all' | 'announcements' | 'general' | 'study-room';
type FilterType = 'all' | 'images' | 'my-posts';

export default function CommunityFeed() {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('all');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const [formContent, setFormContent] = useState('');
  const [formChannel, setFormChannel] = useState<'announcements' | 'general' | 'study-room'>('general');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [postType, setPostType] = useState<'text' | 'product'>('text');
  const [productLink, setProductLink] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'free' | 'pro' | 'vip' | 'pro-vip'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canTargetAudience = currentUser?.role === 'governor' || currentUser?.role === 'mentor' || currentUser?.role === 'admin';

  const loadPosts = useCallback(async (reset: boolean = false) => {
    if (!currentUser) return;

    try {
      if (reset) {
        setLoading(true);
        setLastDoc(null);
      } else {
        setLoadingMore(true);
      }

      const channel = selectedChannel === 'all' ? undefined : selectedChannel;
      const filters: any = {};

      if (selectedFilter === 'images') {
        filters.imagesOnly = true;
      } else if (selectedFilter === 'my-posts') {
        filters.userId = currentUser.uid;
      }

      const { posts: newPosts, lastDoc: newLastDoc } = await communityFeedService.getPosts(
        channel,
        reset ? undefined : lastDoc || undefined,
        filters
      );

      // Don't filter posts - show all posts (locked state handled in PostCard)
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setLastDoc(newLastDoc);
      setHasMore(newPosts.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentUser, selectedChannel, selectedFilter, lastDoc]);

  useEffect(() => {
    loadPosts(true);
  }, [selectedChannel, selectedFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadPosts(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadPosts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim() || submitting) return;

    if (postType === 'product' && !productLink.trim()) {
      alert('Please enter a product ID');
      return;
    }

    setSubmitting(true);
    try {
      await communityFeedService.createPost(
        currentUser!.uid,
        currentUser!.name || currentUser!.email || 'Anonymous',
        currentUser!.email || '',
        formContent.trim(),
        formChannel,
        imageFile || undefined,
        currentUser!.photoURL || '',
        postType === 'product' ? productLink.trim() : undefined,
        canTargetAudience ? targetAudience : 'all'
      );

      setFormContent('');
      setFormChannel('general');
      setImageFile(null);
      setImagePreview(null);
      setPostType('text');
      setProductLink('');
      setTargetAudience('all');
      setShowCreateForm(false);
      loadPosts(true);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostDeleted = () => {
    loadPosts(true);
  };

  const canPost = () => {
    // Block free users from posting
    if (currentUser?.plan === 'free') return false;

    if (selectedChannel === 'announcements') {
      return currentUser?.role === 'governor' || currentUser?.role === 'admin';
    }
    return true;
  };

  const canSelectAnnouncements = currentUser?.role === 'governor' || currentUser?.role === 'admin';

  const channels = [
    { id: 'all' as Channel, label: 'All Posts', icon: '📱' },
    { id: 'announcements' as Channel, label: 'Announcements', icon: '📢' },
    { id: 'general' as Channel, label: 'General', icon: '💬' },
    { id: 'study-room' as Channel, label: 'Study Room', icon: '📚' }
  ];

  const filters = [
    { id: 'all' as FilterType, label: 'All', icon: Filter },
    { id: 'images' as FilterType, label: 'Images', icon: ImageIcon },
    { id: 'my-posts' as FilterType, label: 'My Posts', icon: MessageCircle }
  ];

  const postChannels = [
    ...(canSelectAnnouncements ? [{ id: 'announcements' as const, label: 'Announcements', icon: '📢', description: 'Important updates' }] : []),
    { id: 'general' as const, label: 'General', icon: '💬', description: 'General discussions' },
    { id: 'study-room' as const, label: 'Study Room', icon: '📚', description: 'Study & learning' }
  ];

  if (!currentUser) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view the community feed.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="liquid-crystal-panel p-4 md:p-6 mb-4">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-[#D71920] to-[#B91518] bg-clip-text text-transparent">
                Community
              </h1>
              {canPost() && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold shadow-lg text-sm md:text-base"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Create Post</span>
                </motion.button>
              )}
            </div>

            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
              {channels.map(channel => (
                <motion.button
                  key={channel.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`px-3 md:px-4 py-2 rounded-xl font-bold transition whitespace-nowrap text-sm md:text-base ${
                    selectedChannel === channel.id
                      ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white shadow-lg'
                      : 'liquid-card-overlay text-gray-700 hover:bg-white/80'
                  }`}
                >
                  <span className="mr-1.5">{channel.icon}</span>
                  <span className="hidden md:inline">{channel.label}</span>
                  <span className="md:hidden">{channel.label.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map(filter => {
                const Icon = filter.icon;
                return (
                  <motion.button
                    key={filter.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-lg font-semibold text-xs md:text-sm transition whitespace-nowrap ${
                      selectedFilter === filter.id
                        ? 'bg-[#D71920] text-white'
                        : 'liquid-card-overlay text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    {filter.label}
                  </motion.button>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 md:p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-purple-900 text-sm md:text-base">📹 Video Posts Coming Soon!</h3>
                    <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">NEW</span>
                  </div>
                  <p className="text-xs md:text-sm text-purple-800 leading-relaxed">
                    We're adding video support to the community feed! Soon you'll be able to share video content with your crew. Stay tuned for this exciting feature!
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-blue-900 text-sm md:text-base">AI Moderator Active</h3>
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                  <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                    Our AI assistant is monitoring this community to ensure a safe and respectful environment. All posts and comments are automatically reviewed for inappropriate content. Let's keep our community positive and supportive!
                  </p>
                </div>
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 hidden md:block" />
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <form onSubmit={handleSubmitPost} className="liquid-crystal-panel p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">Create New Post</h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Post Type *</label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setPostType('text')}
                          className={`p-3 rounded-xl border-2 transition text-left ${
                            postType === 'text'
                              ? 'border-[#D71920] bg-red-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                              : 'border-gray-200 hover:border-gray-300 bg-white/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-5 h-5" />
                            <span className="font-bold text-sm text-gray-900">Product Post</span>
                          </div>
                          <p className="text-xs text-gray-600">Share a product</p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Channel *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {currentUser?.role === 'governor' && (
                          <button
                            type="button"
                            onClick={() => setFormChannel('announcements')}
                            className={`p-3 rounded-xl border-2 transition text-left ${
                              formChannel === 'announcements'
                                ? 'border-[#D71920] bg-red-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                          onClick={() => setFormChannel('general')}
                          className={`p-3 rounded-xl border-2 transition text-left ${
                            formChannel === 'general'
                              ? 'border-[#D71920] bg-red-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                          onClick={() => setFormChannel('study-room')}
                          className={`p-3 rounded-xl border-2 transition text-left ${
                            formChannel === 'study-room'
                              ? 'border-[#D71920] bg-red-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                                : 'border-gray-200 hover:border-gray-300 bg-white/50'
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
                        value={formContent}
                        onChange={(e) => setFormContent(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full chat-input-field resize-none"
                        rows={6}
                        required
                      />
                    </div>

                    {postType === 'product' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Product ID *</label>
                        <input
                          type="text"
                          value={productLink}
                          onChange={(e) => setProductLink(e.target.value)}
                          placeholder="Enter product ID (e.g., abc123def456)"
                          className="w-full chat-input-field"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          The product ID from the marketplace URL
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Image (Optional)</label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                          <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover" />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71920] transition flex flex-col items-center justify-center gap-2 text-gray-600 hover:text-[#D71920] bg-white/50 hover:bg-red-50"
                        >
                          <ImageIcon className="w-8 h-8" />
                          <span className="font-semibold text-sm">Click to upload an image</span>
                          <span className="text-xs text-gray-500">JPG, PNG, GIF (Max 5MB)</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={submitting || !formContent.trim()}
                        className="flex-1 bg-gradient-to-r from-[#D71920] to-[#B91518] hover:shadow-lg text-white py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submitting ? (
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
                        onClick={() => setShowCreateForm(false)}
                        className="px-6 py-3 bg-white/70 hover:bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 transition text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-[#D71920] border-t-transparent"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="liquid-crystal-panel p-8 md:p-12 text-center">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">No posts yet</h3>
              <p className="text-sm md:text-base text-gray-600">Be the first to share something with the community!</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              <AnimatePresence>
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onDeleted={handlePostDeleted}
                  />
                ))}
              </AnimatePresence>

              {hasMore && (
                <div ref={observerTarget} className="py-6 md:py-8 flex justify-center">
                  {loadingMore && (
                    <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-4 border-[#D71920] border-t-transparent"></div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
