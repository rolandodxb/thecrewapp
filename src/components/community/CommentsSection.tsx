import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';
import { CommunityComment, communityFeedService } from '../../services/communityFeedService';

interface CommentsSectionProps {
  postId: string;
  currentUser: any;
}

export default function CommentsSection({ postId, currentUser }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = communityFeedService.subscribeToComments(postId, setComments);
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      await communityFeedService.addComment(
        postId,
        currentUser.uid,
        currentUser.displayName || currentUser.email || 'Anonymous',
        currentUser.email || '',
        newComment.trim()
      );
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setLoading(false);
    }
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

  const canDeleteComment = (comment: CommunityComment) => {
    const userId = currentUser.uid || currentUser.id;
    return comment.userId === userId || currentUser.role === 'governor' || currentUser.role === 'admin';
  };

  return (
    <div className="border-t-2 border-gray-200/50 pt-4 mt-4">
      <h4 className="font-bold text-gray-900 mb-4">Comments ({comments.length})</h4>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none"
        />
        <motion.button
          type="submit"
          disabled={loading || !newComment.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>

      <div className="space-y-3">
        <AnimatePresence>
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-gray-100 rounded-xl p-3 relative"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D71920] to-[#B91518] flex items-center justify-center text-white font-bold text-sm">
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{comment.userName}</p>
                    <p className="text-xs text-gray-600">
                      {comment.createdAt.toDate().toLocaleDateString()} at {comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {canDeleteComment(comment) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <p className="text-gray-800 text-sm ml-10">{comment.content}</p>
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
