import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  onSnapshot,
  increment,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { notifyPostComment, notifyPostReaction, notifyCommentReply } from './comprehensiveNotificationService';
import { aiModerationService } from './aiModerationService';
import { reputationService } from './reputationService';

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  channel: 'announcements' | 'general' | 'study-room';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  commentsCount: number;
  viewsCount: number;
  viewedBy: string[];
  reactionsCount: {
    fire: number;
    heart: number;
    thumbsUp: number;
    laugh: number;
    wow: number;
  };
  flagged: boolean;
  flaggedReason?: string;
  productLink?: string;
  postType?: 'text' | 'product';
  targetAudience?: 'all' | 'free' | 'pro' | 'vip' | 'pro-vip';
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoURL?: string;
  content: string;
  imageUrl?: string;
  replyTo?: string;
  replyToName?: string;
  reactions?: {
    heart: number;
    thumbsUp: number;
    laugh: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommunityReaction {
  id: string;
  postId: string;
  userId: string;
  reactionType: 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow';
  createdAt: Timestamp;
}

export const POSTS_PER_PAGE = 10;

export const communityFeedService = {
  async convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async createPost(
    userId: string,
    userName: string,
    userEmail: string,
    content: string,
    channel: 'announcements' | 'general' | 'study-room',
    imageFile?: File | File[],
    userPhotoURL?: string,
    productLink?: string,
    targetAudience?: 'all' | 'free' | 'pro' | 'vip' | 'pro-vip'
  ): Promise<string> {
    const postingCheck = await reputationService.checkPostingAllowed(userId);
    if (!postingCheck.allowed) {
      throw new Error(postingCheck.reason || 'Posting not allowed');
    }

    const moderationResult = await aiModerationService.moderateContent(
      userId,
      userName,
      content,
      'post'
    );

    if (!moderationResult.allowed) {
      throw new Error(moderationResult.reason);
    }

    if (moderationResult.action === 'warn') {
      console.warn('⚠️ Content warning:', moderationResult.reason);
      window.dispatchEvent(new CustomEvent('showModerationWarning', {
        detail: { message: moderationResult.reason }
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    let imageUrl = '';
    let imageUrls: string[] = [];

    if (imageFile) {
      if (Array.isArray(imageFile)) {
        imageUrls = await Promise.all(
          imageFile.map(file => this.convertImageToBase64(file))
        );
        if (imageUrls.length > 0) {
          imageUrl = imageUrls[0];
        }
      } else {
        imageUrl = await this.convertImageToBase64(imageFile);
        imageUrls = [imageUrl];
      }
    }

    const postData = {
      userId,
      userName,
      userEmail,
      userPhotoURL: userPhotoURL || '',
      content,
      imageUrl,
      imageUrls,
      channel,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      commentsCount: 0,
      viewsCount: 0,
      viewedBy: [],
      reactionsCount: {
        fire: 0,
        heart: 0,
        thumbsUp: 0,
        laugh: 0,
        wow: 0
      },
      flagged: false,
      productLink: productLink || '',
      postType: productLink ? 'product' : 'text',
      targetAudience: targetAudience || 'all'
    };

    const docRef = await addDoc(collection(db, 'community_posts'), postData);

    // Create notification for new post
    await this.createNotification(
      'post',
      userId,
      userName,
      docRef.id,
      '',
      ''
    );

    return docRef.id;
  },

  async updatePost(postId: string, content: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      content,
      updatedAt: Timestamp.now()
    });
  },

  async deletePost(postId: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);

    const commentsQuery = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const deletePromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    const reactionsQuery = query(
      collection(db, 'community_reactions'),
      where('postId', '==', postId)
    );
    const reactionsSnapshot = await getDocs(reactionsQuery);
    const reactionDeletePromises = reactionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(reactionDeletePromises);

    await deleteDoc(postRef);
  },

  async getPosts(
    channel?: string,
    lastDoc?: QueryDocumentSnapshot<DocumentData>,
    filters?: {
      imagesOnly?: boolean;
      userId?: string;
      hasMyReaction?: string;
    }
  ): Promise<{ posts: CommunityPost[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    let q = query(
      collection(db, 'community_posts'),
      orderBy('createdAt', 'desc'),
      limit(POSTS_PER_PAGE)
    );

    if (channel) {
      q = query(
        collection(db, 'community_posts'),
        where('channel', '==', channel),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );
    }

    if (filters?.userId) {
      q = query(
        collection(db, 'community_posts'),
        where('userId', '==', filters.userId),
        orderBy('createdAt', 'desc'),
        limit(POSTS_PER_PAGE)
      );
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));

    if (filters?.imagesOnly) {
      posts = posts.filter(post => post.imageUrl);
    }

    return {
      posts,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
    };
  },

  async getPostById(postId: string): Promise<CommunityPost | null> {
    const postRef = doc(db, 'community_posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      return { id: postSnap.id, ...postSnap.data() } as CommunityPost;
    }
    return null;
  },

  subscribeToPost(postId: string, callback: (post: CommunityPost | null) => void) {
    const postRef = doc(db, 'community_posts', postId);
    return onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as CommunityPost);
      } else {
        callback(null);
      }
    });
  },

  async addComment(
    postId: string,
    userId: string,
    userName: string,
    userEmail: string,
    content: string,
    options?: {
      imageUrl?: string;
      replyTo?: string;
      replyToName?: string;
      userPhotoURL?: string;
    }
  ): Promise<string> {
    // Validate required fields
    if (!userId || !userName || !content.trim()) {
      throw new Error('Missing required fields for comment creation');
    }

    const moderationResult = await aiModerationService.moderateContent(
      userId,
      userName,
      content,
      'comment'
    );

    if (!moderationResult.allowed) {
      throw new Error(moderationResult.reason);
    }

    if (moderationResult.action === 'warn') {
      console.warn('⚠️ Content warning:', moderationResult.reason);
      window.dispatchEvent(new CustomEvent('showModerationWarning', {
        detail: { message: moderationResult.reason }
      }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const commentData = {
      postId,
      userId,
      userName,
      userEmail,
      userPhotoURL: options?.userPhotoURL || '',
      content,
      imageUrl: options?.imageUrl || '',
      replyTo: options?.replyTo || '',
      replyToName: options?.replyToName || '',
      reactions: {
        heart: 0,
        thumbsUp: 0,
        laugh: 0
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'community_comments'), commentData);

    // Sync comment count from actual collection
    await this.syncCommentsCount(postId);

    // Get post owner info for notification
    const postDoc = await getDoc(doc(db, 'community_posts', postId));
    if (postDoc.exists()) {
      const postData = postDoc.data();

      // Don't notify if commenting on own post
      if (postData.userId !== userId) {
        // Send comprehensive notification to post author
        await notifyPostComment(
          postData.userId,
          userName,
          postData.content?.substring(0, 50) || 'your post',
          content,
          postId
        );
      }

      // If this is a reply, notify the original commenter
      if (options?.replyTo && options.replyToName) {
        const originalCommentDoc = await getDoc(doc(db, 'community_comments', options.replyTo));
        if (originalCommentDoc.exists()) {
          const originalCommentData = originalCommentDoc.data();
          if (originalCommentData.userId !== userId) {
            await notifyCommentReply(
              originalCommentData.userId,
              userName,
              content,
              postId
            );
          }
        }
      }

      // Old notification system (keep for backward compatibility)
      await this.createNotification(
        'comment',
        userId,
        userName,
        postId,
        postData.userId,
        postData.userName
      );
    }

    return docRef.id;
  },

  async deleteComment(commentId: string, postId: string): Promise<void> {
    await deleteDoc(doc(db, 'community_comments', commentId));

    // Sync comment count from actual collection
    await this.syncCommentsCount(postId);
  },

  async getComments(postId: string): Promise<CommunityComment[]> {
    const q = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityComment));
  },

  subscribeToComments(postId: string, callback: (comments: CommunityComment[]) => void) {
    const q = query(
      collection(db, 'community_comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CommunityComment));
        callback(comments);
      },
      (error) => {
        console.error('❌ COMMENTS SUBSCRIPTION ERROR:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('PostId:', postId);
      }
    );
  },

  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow'
  ): Promise<void> {
    const reactionsQuery = query(
      collection(db, 'community_reactions'),
      where('postId', '==', postId),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(reactionsQuery);
    const postRef = doc(db, 'community_posts', postId);

    // Get post owner info
    const postDoc = await getDoc(postRef);
    const postData = postDoc.data();

    // Get current user info
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userName = userDoc.exists() ? (userDoc.data().name || userDoc.data().displayName || 'Someone') : 'Someone';

    let shouldCreateNotification = false;

    if (!snapshot.empty) {
      const existingReaction = snapshot.docs[0];
      const existingType = existingReaction.data().reactionType as 'fire' | 'heart' | 'thumbsUp' | 'laugh' | 'wow';

      // If clicking the same reaction, remove it
      if (existingType === reactionType) {
        await deleteDoc(existingReaction.ref);
      } else {
        // Switching to a different reaction
        await deleteDoc(existingReaction.ref);

        // Add new reaction
        const newReactionData = {
          postId,
          userId,
          reactionType,
          createdAt: Timestamp.now()
        };
        await addDoc(collection(db, 'community_reactions'), newReactionData);
        shouldCreateNotification = true;
      }
    } else {
      // Adding a new reaction
      const reactionData = {
        postId,
        userId,
        reactionType,
        createdAt: Timestamp.now()
      };
      await addDoc(collection(db, 'community_reactions'), reactionData);
      shouldCreateNotification = true;
    }

    // Sync all reaction counts from actual collection
    await this.syncReactionCounts(postId);

    // Create notification for new reaction (not for removal or switching from same user)
    if (shouldCreateNotification && postData) {
      // Don't notify if reacting to own post
      if (postData.userId !== userId) {
        // Send comprehensive notification
        await notifyPostReaction(
          postData.userId,
          userName,
          reactionType,
          postData.content?.substring(0, 50) || 'your post',
          postId
        );
      }

      // Old notification system (keep for backward compatibility)
      await this.createNotification(
        'reaction',
        userId,
        userName,
        postId,
        postData.userId,
        postData.userName,
        reactionType
      );
    }
  },

  async getUserReaction(postId: string, userId: string): Promise<string | null> {
    const reactionsQuery = query(
      collection(db, 'community_reactions'),
      where('postId', '==', postId),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(reactionsQuery);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().reactionType;
    }
    return null;
  },

  async flagPost(postId: string, reason: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      flagged: true,
      flaggedReason: reason,
      updatedAt: Timestamp.now()
    });

    await addDoc(collection(db, 'community_flags'), {
      postId,
      reason,
      createdAt: Timestamp.now(),
      resolved: false
    });
  },

  async unflagPost(postId: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);
    await updateDoc(postRef, {
      flagged: false,
      flaggedReason: null,
      updatedAt: Timestamp.now()
    });

    const flagsQuery = query(
      collection(db, 'community_flags'),
      where('postId', '==', postId),
      where('resolved', '==', false)
    );
    const snapshot = await getDocs(flagsQuery);
    const deletePromises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, { resolved: true })
    );
    await Promise.all(deletePromises);
  },

  async getFlaggedPosts(): Promise<CommunityPost[]> {
    const q = query(
      collection(db, 'community_posts'),
      where('flagged', '==', true),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CommunityPost));
  },

  // Sync reaction counts from community_reactions collection
  async syncReactionCounts(postId: string): Promise<void> {
    try {
      const reactionsQuery = query(
        collection(db, 'community_reactions'),
        where('postId', '==', postId)
      );

      const snapshot = await getDocs(reactionsQuery);

      const counts = {
        fire: 0,
        heart: 0,
        thumbsUp: 0,
        laugh: 0,
        wow: 0
      };

      snapshot.docs.forEach(doc => {
        const reactionType = doc.data().reactionType;
        if (counts.hasOwnProperty(reactionType)) {
          counts[reactionType as keyof typeof counts]++;
        }
      });

      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        reactionsCount: counts
      });
    } catch (error) {
      // Silently handle permission errors - counts are still synced via background
      console.debug('Sync reaction counts (expected for non-owners):', error);
    }
  },

  // Sync comment count from community_comments collection
  async syncCommentsCount(postId: string): Promise<void> {
    try {
      const commentsQuery = query(
        collection(db, 'community_comments'),
        where('postId', '==', postId)
      );

      const snapshot = await getDocs(commentsQuery);
      const count = snapshot.size;

      const postRef = doc(db, 'community_posts', postId);
      await updateDoc(postRef, {
        commentsCount: count
      });
    } catch (error) {
      // Silently handle permission errors - counts are still synced via background
      console.debug('Sync comments count (expected for non-owners):', error);
    }
  },

  // Track post view
  async trackPostView(postId: string, userId: string): Promise<void> {
    const postRef = doc(db, 'community_posts', postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      const postData = postDoc.data();
      const viewedBy = postData.viewedBy || [];

      // Only add if user hasn't viewed before
      if (!viewedBy.includes(userId)) {
        await updateDoc(postRef, {
          viewedBy: [...viewedBy, userId],
          viewsCount: viewedBy.length + 1
        });
      }
    }
  },

  // Create notification - uses Supabase unified notification service
  async createNotification(
    type: 'post' | 'comment' | 'reaction',
    actorId: string,
    actorName: string,
    postId: string,
    targetUserId: string,
    targetUserName: string,
    reactionType?: string
  ): Promise<void> {
    // Don't notify yourself
    if (actorId === targetUserId) return;

    try {
      // Import dynamically to avoid circular dependencies
      const { createNotification } = await import('./unifiedNotificationService');

      let title = '';
      let message = '';
      let notifType: any = 'community_post';

      switch (type) {
        case 'post':
          title = 'New Post';
          message = `${actorName} created a new post`;
          notifType = 'community_post';
          break;
        case 'comment':
          title = 'New Comment';
          message = `${actorName} commented on your post`;
          notifType = 'community_comment';
          break;
        case 'reaction':
          const reactionEmojis = {
            fire: '🔥',
            heart: '❤️',
            thumbsUp: '👍',
            laugh: '😂',
            wow: '😮'
          };
          const emoji = reactionType ? reactionEmojis[reactionType as keyof typeof reactionEmojis] : '';
          title = 'New Reaction';
          message = `${actorName} ${emoji} reacted to your post`;
          notifType = 'community_reaction';
          break;
      }

      await createNotification({
        user_id: targetUserId,
        type: notifType,
        title,
        message,
        priority: 'low',
        action_url: `/community?postId=${postId}`,
        metadata: {
          actorId,
          actorName,
          postId,
          reactionType: reactionType || ''
        }
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

  async toggleCommentReaction(
    commentId: string,
    userId: string,
    reactionType: 'heart' | 'thumbsUp' | 'laugh'
  ): Promise<void> {
    const commentRef = doc(db, 'community_comments', commentId);
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error('Comment not found');
    }

    const commentData = commentDoc.data();
    const reactions = commentData.reactions || { heart: 0, thumbsUp: 0, laugh: 0 };
    const userReactions = commentData.userReactions || {};

    const hasReacted = userReactions[userId] === reactionType;

    if (hasReacted) {
      reactions[reactionType] = Math.max(0, reactions[reactionType] - 1);
      delete userReactions[userId];
    } else {
      if (userReactions[userId]) {
        const oldReaction = userReactions[userId] as 'heart' | 'thumbsUp' | 'laugh';
        reactions[oldReaction] = Math.max(0, reactions[oldReaction] - 1);
      }
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
      userReactions[userId] = reactionType;
    }

    await updateDoc(commentRef, {
      reactions,
      userReactions,
      updatedAt: Timestamp.now()
    });
  }
};
