import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame, Heart, ThumbsUp, Laugh, AlertCircle, MessageCircle, Trash2, Flag, MoreVertical, ShoppingBag, Send, Smile, Image as ImageIcon, Lock, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommunityPost, communityFeedService } from '../../services/communityFeedService';
import EnhancedCommentsSection from './EnhancedCommentsSection';
import ImageViewerModal from './ImageViewerModal';
import ImageCarousel from './ImageCarousel';

interface PostCardProps {
  post: CommunityPost;
  currentUser: any;
  onDeleted: () => void;
}

export default function PostCard({ post, currentUser, onDeleted }: PostCardProps) {
  const navigate = useNavigate();
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  useEffect(() => {
    loadUserReaction();

    // Track view when post is displayed
    if (currentUser && post.id) {
      communityFeedService.trackPostView(post.id, currentUser.uid).catch(err => {
        console.error('Error tracking view:', err);
      });
    }

    // Subscribe to real-time post updates for comment count and reactions
    const unsubscribe = communityFeedService.subscribeToPost(post.id, (updatedPost) => {
      if (updatedPost) {
        setLocalPost(updatedPost);
      }
    });

    return () => unsubscribe();
  }, [post.id, currentUser.uid]);

  const loadUserReaction = async () => {
    try {
      const reaction = await communityFeedService.getUserReaction(post.id, currentUser.uid);
      setUserReaction(reaction);
    } catch (error) {
      console.error('Error loading reaction:', error);
    }
  };

  const handleReaction = async (type: 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow') => {
    // Block free users from reacting
    if (currentUser.plan === 'free') {
      alert('Upgrade to Pro or VIP to react to posts!');
      return;
    }

    try {
      await communityFeedService.toggleReaction(post.id, currentUser.uid, type);
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }

    // Always reload user reaction and post data, even if there was an error
    // This ensures UI stays in sync with the database
    try {
      await loadUserReaction();

      // Wait for Firestore to sync, then refresh the post
      setTimeout(async () => {
        try {
          const postRef = await communityFeedService.getPostById(post.id);
          if (postRef) {
            setLocalPost(postRef);
          }
        } catch (refreshError) {
          console.error('Error refreshing post:', refreshError);
        }
      }, 800);
    } catch (loadError) {
      console.error('Error loading reaction state:', loadError);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);
    try {
      await communityFeedService.deletePost(post.id);
      onDeleted();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
      setIsDeleting(false);
    }
  };

  const handleFlag = async () => {
    const reason = prompt('Why are you flagging this post?');
    if (!reason) return;

    try {
      await communityFeedService.flagPost(post.id, reason);
      alert('Post has been flagged for review');
      setShowMenu(false);
    } catch (error) {
      console.error('Error flagging post:', error);
      alert('Failed to flag post');
    }
  };

  const handleQuickComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;

    // Block free users from commenting
    if (currentUser.plan === 'free') {
      if (confirm('Upgrade to Pro or VIP to comment on posts. Go to upgrade page?')) {
        navigate('/upgrade');
      }
      return;
    }

    setIsSubmittingComment(true);
    try {
      const userId = currentUser.uid || currentUser.id;
      const userName = currentUser.displayName || currentUser.name || currentUser.userName || 'Anonymous';

      await communityFeedService.addComment(
        post.id,
        userId,
        userName,
        currentUser.email || '',
        commentText,
        {
          userPhotoURL: currentUser.photoURL || currentUser.profilePicture || '',
          imageUrl: ''
        }
      );

      setCommentText('');
      setShowComments(true);
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const canDelete = currentUser.uid === post.userId || currentUser.role === 'governor' || currentUser.role === 'admin';
  const canFlag = currentUser.uid !== post.userId;

  // Check if post should be locked for current user
  const userPlan = currentUser?.plan || 'free';
  const targetAudience = post.targetAudience || 'all';

  const isPostLocked = (() => {
    // If target is 'all', never lock
    if (targetAudience === 'all') return false;

    // If target is 'free', only lock for non-free users (actually free users can see it)
    if (targetAudience === 'free') return userPlan !== 'free';

    // If target is 'pro', lock for free users
    if (targetAudience === 'pro') return userPlan === 'free';

    // If target is 'vip', lock for free and pro users
    if (targetAudience === 'vip') return userPlan !== 'vip';

    // If target is 'pro-vip', lock for free users only
    if (targetAudience === 'pro-vip') return userPlan === 'free';

    return false;
  })();

  const reactions = [
    { type: 'fire' as const, icon: Flame, count: localPost.reactionsCount.fire, color: 'text-orange-500' },
    { type: 'heart' as const, icon: Heart, count: localPost.reactionsCount.heart, color: 'text-red-500' },
    { type: 'thumbsUp' as const, icon: ThumbsUp, count: localPost.reactionsCount.thumbsUp, color: 'text-blue-500' },
    { type: 'laugh' as const, icon: Laugh, count: localPost.reactionsCount.laugh, color: 'text-yellow-500' },
    { type: 'wow' as const, icon: AlertCircle, count: localPost.reactionsCount.wow, color: 'text-purple-500' }
  ];

  const channelBadges = {
    'announcements': { label: '📢', shortLabel: 'Announcement', color: 'bg-red-100 text-red-700' },
    'general': { label: '💬', shortLabel: 'General', color: 'bg-blue-100 text-blue-700' },
    'study-room': { label: '📚', shortLabel: 'Study', color: 'bg-green-100 text-green-700' }
  };

  const badge = channelBadges[post.channel];

  // Helper function to get upgrade plan name
  const getRequiredPlan = () => {
    if (targetAudience === 'pro') return 'Pro';
    if (targetAudience === 'vip') return 'VIP';
    if (targetAudience === 'pro-vip') return 'Pro or VIP';
    return 'Premium';
  };

  // Helper function to get upgrade icon
  const getUpgradeIcon = () => {
    if (targetAudience === 'vip') return Crown;
    if (targetAudience === 'pro' || targetAudience === 'pro-vip') return Zap;
    return Lock;
  };

  // If post is locked, show locked state
  if (isPostLocked) {
    const UpgradeIcon = getUpgradeIcon();
    const requiredPlan = getRequiredPlan();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="liquid-crystal-panel p-4 md:p-6 relative overflow-hidden"
      >
        {/* Header - Same structure as regular post */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {post.userPhotoURL ? (
              <img
                src={post.userPhotoURL}
                alt={post.userName}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                {post.userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">{post.userName}</h3>
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <p className="text-xs text-gray-600">
                  {post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${badge.color}`}>
                  <span className="mr-1">{badge.label}</span>
                  <span className="hidden sm:inline">{badge.shortLabel}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Locked Content Area - Takes same space as regular post */}
        <div className="relative min-h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 rounded-2xl p-8 border-2 border-amber-200">
          {/* Lock Icon with Glow Effect */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl">
              <UpgradeIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
          </motion.div>

          {/* Upgrade Message */}
          <div className="text-center space-y-3 md:space-y-4 max-w-md">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
              {requiredPlan} Exclusive Content
            </h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              This post is exclusive to <span className="font-bold text-amber-700">{requiredPlan}</span> members.
              Upgrade now to unlock this content and access all premium features!
            </p>

            {/* Benefits List */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-left space-y-2 mt-4">
              <p className="text-xs md:text-sm font-bold text-gray-900 mb-2">✨ What you'll get:</p>
              <ul className="text-xs md:text-sm text-gray-700 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Access to exclusive posts and content</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Full community engagement features</span>
                </li>
                {(targetAudience === 'vip' || targetAudience === 'pro-vip') && (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>AI Trainer & Open Day Simulator</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Direct recruiter access</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Upgrade Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/upgrade')}
              className="w-full px-6 py-3 md:py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-700 text-white rounded-xl font-bold text-sm md:text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Upgrade to {requiredPlan}
            </motion.button>

            <button
              onClick={() => navigate('/upgrade')}
              className="text-xs md:text-sm text-gray-600 hover:text-gray-900 underline transition"
            >
              Learn more about our plans
            </button>
          </div>
        </div>

        {/* Footer Stats - Maintain layout consistency */}
        <div className="flex items-center gap-2 mt-4 opacity-50">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle className="w-4 h-4" />
            <span>{localPost.commentsCount}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Heart className="w-4 h-4" />
            <span>
              {Object.values(localPost.reactionsCount).reduce((sum, count) => sum + count, 0)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Regular post rendering (not locked)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="liquid-crystal-panel p-4 md:p-6 relative"
    >
      {post.flagged && (
        <div className="mb-3 md:mb-4 px-3 md:px-4 py-2 bg-red-100 border-2 border-red-300 rounded-xl flex items-center gap-2">
          <Flag className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />
          <span className="text-xs md:text-sm font-bold text-red-700">Flagged: {post.flaggedReason}</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {post.userPhotoURL ? (
            <img
              src={post.userPhotoURL}
              alt={post.userName}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0 ${post.userPhotoURL ? 'hidden' : ''}`}>
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">{post.userName}</h3>
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <p className="text-xs text-gray-600">
                {post.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${badge.color}`}>
                <span className="mr-1">{badge.label}</span>
                <span className="hidden sm:inline">{badge.shortLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {(canDelete || canFlag) && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full hover:bg-white/50 flex items-center justify-center transition"
            >
              <MoreVertical className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 liquid-crystal-strong rounded-xl shadow-xl py-1 z-50 min-w-[140px] md:min-w-[150px]">
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-3 md:px-4 py-2 text-left hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  {canFlag && (
                    <button
                      onClick={handleFlag}
                      className="w-full px-3 md:px-4 py-2 text-left hover:bg-yellow-50 text-yellow-600 font-semibold flex items-center gap-2 text-sm"
                    >
                      <Flag className="w-4 h-4" />
                      Flag
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <p className="text-gray-800 mb-3 md:mb-4 whitespace-pre-wrap text-sm md:text-base leading-relaxed">{post.content}</p>

      {post.postType === 'product' && post.productLink && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/marketplace/product/${post.productLink}`)}
          className="w-full mb-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingBag className="w-5 h-5" />
          View on Marketplace
        </motion.button>
      )}

      {(post.imageUrls && post.imageUrls.length > 0) ? (
        <ImageCarousel
          images={post.imageUrls}
          onImageClick={(index) => {
            setSelectedImageIndex(index);
            setShowImageViewer(true);
          }}
          onDoubleTap={() => handleReaction('heart')}
        />
      ) : post.imageUrl ? (
        <div className="mb-3 md:mb-4 rounded-2xl overflow-hidden">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full max-h-[300px] md:max-h-[500px] object-cover cursor-pointer hover:opacity-95 transition"
            onClick={() => {
              setSelectedImageIndex(0);
              setShowImageViewer(true);
            }}
          />
        </div>
      ) : null}

      <ImageViewerModal
        imageUrls={post.imageUrls || (post.imageUrl ? [post.imageUrl] : [])}
        initialIndex={selectedImageIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        onDoubleClick={() => handleReaction('heart')}
      />

      <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 flex-wrap">
        {currentUser.plan === 'free' && (
          <div className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
            🔒 Reactions: Pro/VIP only
          </div>
        )}
        {reactions.map(reaction => {
          const Icon = reaction.icon;
          const isActive = userReaction === reaction.type;
          const isFreeUser = currentUser.plan === 'free';
          return (
            <motion.button
              key={reaction.type}
              whileHover={!isFreeUser ? { scale: 1.05 } : {}}
              whileTap={!isFreeUser ? { scale: 0.95 } : {}}
              onClick={() => handleReaction(reaction.type)}
              disabled={isFreeUser}
              className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl font-semibold text-xs md:text-sm transition ${
                isFreeUser
                  ? 'liquid-card-overlay text-gray-400 cursor-not-allowed opacity-60'
                  : isActive
                  ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white shadow-lg'
                  : 'liquid-card-overlay text-gray-700 hover:bg-white/80'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-white' : reaction.color}`} />
              <span>{reaction.count}</span>
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl liquid-card-overlay text-gray-700 hover:bg-white/80 font-semibold text-xs md:text-sm transition ml-auto"
        >
          <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{localPost.commentsCount}</span>
          <span className="hidden sm:inline">Comments</span>
        </motion.button>
      </div>

      {/* Always Visible Comment Input */}
      <div className="mt-4 pt-4 border-t-2 border-gray-200/50">
        <div className="flex gap-2 md:gap-3 items-start">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="You"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 relative">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickComment();
                }
              }}
              placeholder={currentUser.plan === 'free' ? '🔒 Upgrade to Pro/VIP to comment...' : 'Write a comment...'}
              disabled={currentUser.plan === 'free' || isSubmittingComment}
              rows={1}
              className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-xl border-2 text-sm md:text-base resize-none focus:outline-none transition-all ${
                currentUser.plan === 'free'
                  ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                  : 'liquid-glass border-gray-300 focus:border-[#D71920] text-gray-800'
              }`}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {currentUser.plan !== 'free' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className={`p-2 rounded-lg transition ${
                    commentText.trim() && !isSubmittingComment
                      ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmittingComment ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
        {currentUser.plan === 'free' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/upgrade')}
            className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition"
          >
            Upgrade to Comment & Engage
          </motion.button>
        )}
      </div>

      {showComments && (
        <EnhancedCommentsSection
          postId={post.id}
          currentUser={currentUser}
        />
      )}
    </motion.div>
  );
}
