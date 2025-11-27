import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { communityFeedService, CommunityPost, POSTS_PER_PAGE } from '../services/communityFeedService';
import { Plus, Filter, Grid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '../components/community/PostCard';
import CreatePostModal from '../components/community/CreatePostModal';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

type Channel = 'all' | 'announcements' | 'general' | 'study-room';
type FilterType = 'all' | 'images' | 'my-posts';

const CHANNELS = [
  { value: 'all' as const, label: 'All Channels', color: 'from-gray-500 to-gray-600' },
  { value: 'announcements' as const, label: 'Announcements', color: 'from-blue-500 to-blue-600' },
  { value: 'general' as const, label: 'General', color: 'from-green-500 to-green-600' },
  { value: 'study-room' as const, label: 'Study Room', color: 'from-purple-500 to-purple-600' }
];

const FILTERS = [
  { value: 'all' as const, label: 'All Posts' },
  { value: 'images' as const, label: 'With Images' },
  { value: 'my-posts' as const, label: 'My Posts' }
];

export default function CommunityFeedPage() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<Channel>('all');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to view the community feed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community Feed</h1>
          <p className="text-sm text-gray-600 mt-1">Connect and share with the community</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#D71920] to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Create Post</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Channel Filter */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map(channel => (
              <motion.button
                key={channel.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedChannel(channel.value)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  selectedChannel === channel.value
                    ? `bg-gradient-to-r ${channel.color} text-white shadow-md`
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                {channel.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {FILTERS.map(filter => (
            <motion.button
              key={filter.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedFilter === filter.value
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Grid className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-6">Be the first to share something with the community</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-[#D71920] to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Create First Post
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard post={post} currentUser={currentUser!} onDeleted={() => loadPosts(true)} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      <div ref={observerTarget} className="h-10 flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading more posts...</span>
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            onClose={() => setShowCreateModal(false)}
            onPostCreated={() => {
              setShowCreateModal(false);
              loadPosts(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
