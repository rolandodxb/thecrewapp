import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Award, Sparkles, ThumbsUp, X, Send, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  activitySocialProofService,
  ActivityPhoto,
  PhotoComment,
  PhotoReaction
} from '../services/activitySocialProofService';

interface ActivityPhotoGalleryProps {
  galleryId: string;
  activityId: string;
  canUpload?: boolean;
}

export default function ActivityPhotoGallery({ galleryId, activityId, canUpload }: ActivityPhotoGalleryProps) {
  const { currentUser } = useApp();
  const [photos, setPhotos] = useState<ActivityPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<ActivityPhoto | null>(null);
  const [comments, setComments] = useState<PhotoComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userReaction, setUserReaction] = useState<PhotoReaction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [galleryId]);

  useEffect(() => {
    if (selectedPhoto && currentUser) {
      loadComments(selectedPhoto.id);
      loadUserReaction(selectedPhoto.id);
    }
  }, [selectedPhoto, currentUser]);

  const loadPhotos = async () => {
    try {
      const galleryPhotos = await activitySocialProofService.getGalleryPhotos(galleryId);
      setPhotos(galleryPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const loadComments = async (photoId: string) => {
    try {
      const photoComments = await activitySocialProofService.getPhotoComments(photoId);
      setComments(photoComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadUserReaction = async (photoId: string) => {
    if (!currentUser) return;
    try {
      const reaction = await activitySocialProofService.getUserReaction(photoId, currentUser.uid);
      setUserReaction(reaction);
    } catch (error) {
      console.error('Error loading reaction:', error);
    }
  };

  const handleReaction = async (reactionType: PhotoReaction['reactionType']) => {
    if (!currentUser || !selectedPhoto) return;

    try {
      await activitySocialProofService.addReaction(
        selectedPhoto.id,
        currentUser.uid,
        currentUser.name,
        reactionType
      );

      await loadPhotos();
      const updatedPhoto = photos.find(p => p.id === selectedPhoto.id);
      if (updatedPhoto) {
        setSelectedPhoto(updatedPhoto);
      }
      await loadUserReaction(selectedPhoto.id);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser || !selectedPhoto || !newComment.trim()) return;

    setLoading(true);
    try {
      await activitySocialProofService.addComment(
        selectedPhoto.id,
        galleryId,
        currentUser.uid,
        currentUser.name,
        newComment,
        currentUser.photoURL
      );

      setNewComment('');
      await loadComments(selectedPhoto.id);
      await loadPhotos();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <ThumbsUp className="w-4 h-4" />;
      case 'love':
        return <Heart className="w-4 h-4" />;
      case 'celebrate':
        return <Award className="w-4 h-4" />;
      case 'inspiring':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <ThumbsUp className="w-4 h-4" />;
    }
  };

  const getTotalReactions = (photo: ActivityPhoto) => {
    return Object.values(photo.reactions).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="space-y-6">
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No photos yet</p>
          {canUpload && <p className="text-sm text-gray-400 mt-2">Upload photos to get started</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo.photoUrl}
                  alt={photo.caption || 'Activity photo'}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-3 text-white text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{getTotalReactions(photo)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{photo.commentCount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:w-2/3 bg-black flex items-center justify-center">
                <img
                  src={selectedPhoto.photoUrl}
                  alt={selectedPhoto.caption || 'Activity photo'}
                  className="max-w-full max-h-[60vh] md:max-h-[90vh] object-contain"
                />
              </div>

              <div className="md:w-1/3 flex flex-col max-h-[30vh] md:max-h-[90vh]">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedPhoto.uploaderName}</p>
                    <p className="text-xs text-gray-500">
                      {selectedPhoto.createdAt.toDate().toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {selectedPhoto.caption && (
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-sm text-gray-700">{selectedPhoto.caption}</p>
                  </div>
                )}

                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => handleReaction('like')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
                        userReaction?.reactionType === 'like'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs font-medium">{selectedPhoto.reactions.like}</span>
                    </button>
                    <button
                      onClick={() => handleReaction('love')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
                        userReaction?.reactionType === 'love'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      <span className="text-xs font-medium">{selectedPhoto.reactions.love}</span>
                    </button>
                    <button
                      onClick={() => handleReaction('celebrate')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
                        userReaction?.reactionType === 'celebrate'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-medium">{selectedPhoto.reactions.celebrate}</span>
                    </button>
                    <button
                      onClick={() => handleReaction('inspiring')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition ${
                        userReaction?.reactionType === 'inspiring'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium">{selectedPhoto.reactions.inspiring}</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#D71920] to-[#B91518] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{comment.userName}</p>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {comment.createdAt.toDate().toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D71920]"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={loading || !newComment.trim()}
                      className="px-4 py-2 bg-[#D71920] text-white rounded-lg hover:bg-[#B91518] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
