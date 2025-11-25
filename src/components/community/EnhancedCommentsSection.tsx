import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, Heart, ThumbsUp, Smile, Image as ImageIcon, Reply, MoreVertical, Flag, Loader2 } from 'lucide-react';
import { CommunityComment, communityFeedService } from '../../services/communityFeedService';
import EmojiPicker from 'emoji-picker-react';
import { useNavigate } from 'react-router-dom';

interface EnhancedComment extends CommunityComment {
  userPhotoURL?: string;
  imageUrl?: string;
  repliesCount?: number;
  reactions?: {
    heart: number;
    thumbsUp: number;
    laugh: number;
  };
  userReactions?: Record<string, string>;
  replyTo?: string;
  replyToName?: string;
}

interface EnhancedCommentsSectionProps {
  postId: string;
  currentUser: any;
}

export default function EnhancedCommentsSection({ postId, currentUser }: EnhancedCommentsSectionProps) {
  const navigate = useNavigate();
  const [comments, setComments] = useState<EnhancedComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showOptionsFor, setShowOptionsFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = communityFeedService.subscribeToComments(postId, (fetchedComments) => {
      setComments(fetchedComments as EnhancedComment[]);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && !selectedImage) || loading) return;

    // AI Moderation Check (placeholder - will be implemented with AI API)
    const isSafe = await checkContentSafety(newComment);
    if (!isSafe) {
      alert('Your comment contains inappropriate content. Please revise it.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await communityFeedService.convertImageToBase64(selectedImage);
      }

      // Ensure we have the correct user data structure
      const userId = currentUser.uid || currentUser.id;
      const userName = currentUser.displayName || currentUser.name || currentUser.userName || 'Anonymous';
      const userEmail = currentUser.email || '';
      const userPhotoURL = currentUser.photoURL || currentUser.profilePicture || '';

      // Validate required fields
      if (!userId) {
        alert('Please log in to comment');
        return;
      }
      if (!userName) {
        alert('User information is incomplete');
        return;
      }

      await communityFeedService.addComment(
        postId,
        userId,
        userName,
        userEmail,
        newComment.trim(),
        {
          imageUrl,
          replyTo: replyTo?.id,
          replyToName: replyTo?.name,
          userPhotoURL: userPhotoURL
        }
      );

      // Success - clear form
      setNewComment('');
      setReplyTo(null);
      removeImage();
    } catch (error: any) {
      console.error('Error adding comment:', error);

      // Only show error if the comment wasn't actually added
      if (error?.code === 'permission-denied') {
        // Check if comment was actually added despite the error
        const comments = await communityFeedService.getComments(postId);
        const justAdded = comments.find(c =>
          c.userId === (currentUser.uid || currentUser.id) &&
          c.content === newComment.trim() &&
          Date.now() - c.createdAt.toDate().getTime() < 5000
        );

        if (justAdded) {
          // Comment was added successfully, just clear the form
          setNewComment('');
          setReplyTo(null);
          removeImage();
        } else {
          alert('Failed to add comment. Please try again.');
        }
      } else {
        alert('Failed to add comment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkContentSafety = async (content: string): Promise<boolean> => {
    // Placeholder for AI moderation
    // TODO: Integrate with OpenAI Moderation API or similar
    const badWords = ['badword1', 'badword2']; // Basic filter
    const lowerContent = content.toLowerCase();
    return !badWords.some(word => lowerContent.includes(word));
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await communityFeedService.deleteComment(commentId, postId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleReaction = async (commentId: string, reactionType: 'heart' | 'thumbsUp' | 'laugh') => {
    try {
      const userId = currentUser.uid || currentUser.id;
      if (!userId) {
        alert('Please log in to react');
        return;
      }
      await communityFeedService.toggleCommentReaction(commentId, userId, reactionType);
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Failed to add reaction');
    }
  };

  const handleReport = async (commentId: string) => {
    const reason = prompt('Why are you reporting this comment?');
    if (!reason) return;

    try {
      // TODO: Implement reporting in service
      alert('Comment reported. Our moderators will review it.');
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const canDeleteComment = (comment: EnhancedComment) => {
    const userId = currentUser.uid || currentUser.id;
    return comment.userId === userId || currentUser.role === 'governor' || currentUser.role === 'admin';
  };

  const getProfilePicture = (comment: EnhancedComment) => {
    if (comment.userPhotoURL) {
      return (
        <img
          src={comment.userPhotoURL}
          alt={comment.userName}
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-sm">
        {comment.userName.charAt(0).toUpperCase()}
      </div>
    );
  };

  const onEmojiClick = (emojiData: any) => {
    setNewComment(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="border-t-2 border-gray-200/50 pt-4 mt-4">
      <h4 className="font-bold text-gray-900 mb-4">Comments ({comments.length})</h4>

      {currentUser.plan === 'free' ? (
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-center">
          <p className="text-sm font-semibold text-purple-900 mb-2">💬 Join the Conversation</p>
          <p className="text-xs text-purple-700 mb-3">
            Upgrade to Pro or VIP to comment on posts and engage with the community!
          </p>
          <button
            onClick={() => {
              setUpgradeLoading(true);
              navigate('/upgrade');
            }}
            disabled={upgradeLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
          >
            {upgradeLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Upgrade Now'
            )}
          </button>
        </div>
      ) : !replyTo ? (
        <form onSubmit={handleSubmit} className="mb-4">
        {imagePreview && (
          <div className="mb-2 relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {currentUser.photoURL || currentUser.profilePicture ? (
            <img
              src={currentUser.photoURL || currentUser.profilePicture}
              alt={currentUser.displayName || currentUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold">
              {(currentUser.displayName || currentUser.name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Write a comment...'}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none resize-none"
              rows={2}
            />

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <Smile className="w-5 h-5 text-gray-600" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="flex-1" />

              <motion.button
                type="submit"
                disabled={loading || (!newComment.trim() && !selectedImage)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {replyTo ? 'Reply' : 'Comment'}
              </motion.button>
            </div>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="absolute z-50 mt-2">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
      </form>
      ) : null}

      <div className="space-y-3">
        <AnimatePresence>
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`bg-gray-100 rounded-xl p-3 relative ${
                comment.replyTo ? 'ml-10 border-l-4 border-blue-300' : ''
              }`}
            >
              {comment.replyTo && comment.replyToName && (
                <div className="text-xs text-blue-600 mb-2">
                  Replying to <strong>{comment.replyToName}</strong>
                </div>
              )}

              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getProfilePicture(comment)}
                  <div>
                    <p className="font-bold text-sm text-gray-900">{comment.userName}</p>
                    <p className="text-xs text-gray-600">
                      {comment.createdAt.toDate().toLocaleDateString()} at {comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowOptionsFor(showOptionsFor === comment.id ? null : comment.id)}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>

                  {showOptionsFor === comment.id && (
                    <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-10">
                      <button
                        onClick={() => {
                          setReplyTo({ id: comment.id, name: comment.userName });
                          setShowOptionsFor(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>

                      {canDeleteComment(comment) && (
                        <button
                          onClick={() => {
                            handleDelete(comment.id);
                            setShowOptionsFor(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}

                      {comment.userId !== (currentUser.uid || currentUser.id) && (
                        <button
                          onClick={() => {
                            handleReport(comment.id);
                            setShowOptionsFor(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm text-orange-600"
                        >
                          <Flag className="w-4 h-4" />
                          Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-800 text-sm ml-10 mb-2">{comment.content}</p>

              {comment.imageUrl && (
                <div className="ml-10 mb-2">
                  <img
                    src={comment.imageUrl}
                    alt="Comment attachment"
                    className="max-h-64 rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center gap-4 ml-10 mt-2">
                <button
                  onClick={() => handleReaction(comment.id, 'heart')}
                  className={`flex items-center gap-1 text-sm transition ${
                    comment.userReactions?.[currentUser.uid || currentUser.id] === 'heart'
                      ? 'text-red-500 font-bold'
                      : 'text-gray-600 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${
                    comment.userReactions?.[currentUser.uid || currentUser.id] === 'heart'
                      ? 'fill-red-500'
                      : ''
                  }`} />
                  <span>{comment.reactions?.heart || 0}</span>
                </button>

                <button
                  onClick={() => handleReaction(comment.id, 'thumbsUp')}
                  className={`flex items-center gap-1 text-sm transition ${
                    comment.userReactions?.[currentUser.uid || currentUser.id] === 'thumbsUp'
                      ? 'text-blue-500 font-bold'
                      : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${
                    comment.userReactions?.[currentUser.uid || currentUser.id] === 'thumbsUp'
                      ? 'fill-blue-500'
                      : ''
                  }`} />
                  <span>{comment.reactions?.thumbsUp || 0}</span>
                </button>

                <button
                  onClick={() => handleReaction(comment.id, 'laugh')}
                  className={`text-sm transition flex items-center gap-1 ${
                    comment.userReactions?.[currentUser.uid || currentUser.id] === 'laugh'
                      ? 'text-yellow-500 font-bold'
                      : 'text-gray-600 hover:text-yellow-500'
                  }`}
                >
                  😂 <span>{comment.reactions?.laugh || 0}</span>
                </button>

                <button
                  onClick={() => setReplyTo({ id: comment.id, name: comment.userName })}
                  className="text-sm text-gray-600 hover:text-[#D71920] transition flex items-center gap-1"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
              </div>

              {replyTo?.id === comment.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-10 mt-3 border-t-2 border-gray-200 pt-3"
                >
                  <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-blue-600">
                      Replying to <strong>{replyTo.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ✕
                    </button>
                  </div>

                  {imagePreview && (
                    <div className="mb-2 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {currentUser.photoURL || currentUser.profilePicture ? (
                      <img
                        src={currentUser.photoURL || currentUser.profilePicture}
                        alt={currentUser.displayName || currentUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-xs">
                        {(currentUser.displayName || currentUser.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Reply to ${replyTo.name}...`}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-[#D71920] outline-none resize-none text-sm"
                        rows={2}
                        autoFocus
                      />

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Smile className="w-4 h-4 text-gray-600" />
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                        >
                          <ImageIcon className="w-4 h-4 text-gray-600" />
                        </button>

                        <div className="flex-1" />

                        <button
                          onClick={handleSubmit}
                          disabled={loading || (!newComment.trim() && !selectedImage)}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                        >
                          <Send className="w-3 h-3" />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {comments.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
