/**
 * Comprehensive Push Notification System
 * Handles ALL user interactions and system events across the platform
 * Sends push notifications for:
 * - Community chat messages
 * - Private group messages
 * - Private chat messages
 * - Community feed comments and reactions
 * - Marketplace updates
 * - New course releases
 * - New module additions
 * - Emergency system shutdowns
 * - User reactions to posts and comments
 * - Any other user interactions
 */

import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  imageUrl?: string;
  data?: any;
}

/**
 * Send a notification to a specific user
 */
export async function sendNotification(payload: NotificationPayload) {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...payload,
      read: false,
      createdAt: Timestamp.now(),
    });

    // Also add to FCM notifications for push
    await addDoc(collection(db, 'fcmNotifications'), {
      ...payload,
      read: false,
      createdAt: Timestamp.now(),
    });

    console.log('✅ Notification sent:', payload.title);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendBulkNotifications(userIds: string[], payload: Omit<NotificationPayload, 'userId'>) {
  const promises = userIds.map(userId =>
    sendNotification({ ...payload, userId })
  );
  await Promise.all(promises);
}

/**
 * Get all users in a conversation/group
 */
async function getConversationParticipants(conversationId: string, exceptUserId?: string): Promise<string[]> {
  const conversationRef = collection(db, 'conversations');
  const q = query(conversationRef, where('__name__', '==', conversationId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return [];

  const conversation = snapshot.docs[0].data();
  const participants = conversation.participants || [];

  return exceptUserId
    ? participants.filter((id: string) => id !== exceptUserId)
    : participants;
}

// ==================== CHAT NOTIFICATIONS ====================

/**
 * Notify about new community chat message
 */
export async function notifyCommunityMessage(senderId: string, senderName: string, message: string, conversationId: string) {
  const participants = await getConversationParticipants(conversationId, senderId);

  await sendBulkNotifications(participants, {
    title: `New message in Community Chat`,
    body: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    type: 'community_message',
    priority: 'medium',
    actionUrl: '/chat',
  });
}

/**
 * Notify about new private chat message
 */
export async function notifyPrivateMessage(senderId: string, senderName: string, recipientId: string, message: string) {
  await sendNotification({
    userId: recipientId,
    title: `New message from ${senderName}`,
    body: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    type: 'private_message',
    priority: 'high',
    actionUrl: '/chat',
  });
}

/**
 * Notify about new group message
 */
export async function notifyGroupMessage(senderId: string, senderName: string, groupName: string, message: string, conversationId: string) {
  const participants = await getConversationParticipants(conversationId, senderId);

  await sendBulkNotifications(participants, {
    title: `New message in ${groupName}`,
    body: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    type: 'group_message',
    priority: 'medium',
    actionUrl: '/chat',
  });
}

// ==================== COMMUNITY FEED NOTIFICATIONS ====================

/**
 * Notify post author about new comment
 */
export async function notifyPostComment(postAuthorId: string, commenterName: string, postTitle: string, comment: string, postId: string) {
  await sendNotification({
    userId: postAuthorId,
    title: `${commenterName} commented on your post`,
    body: comment.substring(0, 100) + (comment.length > 100 ? '...' : ''),
    type: 'post_comment',
    priority: 'medium',
    actionUrl: `/community-feed`,
    data: { postId },
  });
}

/**
 * Notify post author about reaction
 */
export async function notifyPostReaction(postAuthorId: string, reactorName: string, reactionType: string, postTitle: string, postId: string) {
  const reactionEmojis: Record<string, string> = {
    fire: '🔥',
    heart: '❤️',
    thumbsUp: '👍',
    laugh: '😂',
    wow: '😮',
  };

  await sendNotification({
    userId: postAuthorId,
    title: `${reactorName} reacted to your post`,
    body: `${reactionEmojis[reactionType] || '👍'} ${reactionType}`,
    type: 'post_reaction',
    priority: 'low',
    actionUrl: `/community-feed`,
    data: { postId },
  });
}

/**
 * Notify comment author about reply
 */
export async function notifyCommentReply(commentAuthorId: string, replierName: string, reply: string, postId: string) {
  await sendNotification({
    userId: commentAuthorId,
    title: `${replierName} replied to your comment`,
    body: reply.substring(0, 100) + (reply.length > 100 ? '...' : ''),
    type: 'comment_reply',
    priority: 'medium',
    actionUrl: `/community-feed`,
    data: { postId },
  });
}

/**
 * Notify comment author about reaction
 */
export async function notifyCommentReaction(commentAuthorId: string, reactorName: string, reactionType: string, postId: string) {
  const reactionEmojis: Record<string, string> = {
    heart: '❤️',
    thumbsUp: '👍',
    laugh: '😂',
  };

  await sendNotification({
    userId: commentAuthorId,
    title: `${reactorName} reacted to your comment`,
    body: `${reactionEmojis[reactionType] || '👍'} ${reactionType}`,
    type: 'comment_reaction',
    priority: 'low',
    actionUrl: `/community-feed`,
    data: { postId },
  });
}

// ==================== MARKETPLACE NOTIFICATIONS ====================

/**
 * Notify seller about new order
 */
export async function notifyNewOrder(sellerId: string, productName: string, buyerName: string, amount: number) {
  await sendNotification({
    userId: sellerId,
    title: '🎉 New Order Received!',
    body: `${buyerName} purchased ${productName} for $${amount}`,
    type: 'marketplace_order',
    priority: 'high',
    actionUrl: '/seller/dashboard',
  });
}

/**
 * Notify buyer about order status update
 */
export async function notifyOrderStatus(buyerId: string, productName: string, status: string, orderId: string) {
  const statusMessages: Record<string, string> = {
    processing: 'is being processed',
    shipped: 'has been shipped',
    delivered: 'has been delivered',
    cancelled: 'has been cancelled',
  };

  await sendNotification({
    userId: buyerId,
    title: 'Order Status Update',
    body: `Your order "${productName}" ${statusMessages[status] || 'has been updated'}`,
    type: 'order_status',
    priority: 'medium',
    actionUrl: '/my-orders',
    data: { orderId },
  });
}

/**
 * Notify about new marketplace message
 */
export async function notifyMarketplaceMessage(recipientId: string, senderName: string, productName: string, message: string) {
  await sendNotification({
    userId: recipientId,
    title: `Message about ${productName}`,
    body: `${senderName}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
    type: 'marketplace_message',
    priority: 'medium',
    actionUrl: '/marketplace',
  });
}

// ==================== COURSE NOTIFICATIONS ====================

/**
 * Notify all students about new course
 */
export async function notifyNewCourse(courseName: string, description: string) {
  // Get all active students
  const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
  const studentsSnapshot = await getDocs(studentsQuery);
  const studentIds = studentsSnapshot.docs.map(doc => doc.id);

  await sendBulkNotifications(studentIds, {
    title: '📚 New Course Available!',
    body: `${courseName}: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`,
    type: 'new_course',
    priority: 'medium',
    actionUrl: '/courses',
  });
}

/**
 * Notify enrolled students about course update
 */
export async function notifyCourseUpdate(courseId: string, courseName: string, updateDescription: string, enrolledStudents: string[]) {
  await sendBulkNotifications(enrolledStudents, {
    title: `Course Update: ${courseName}`,
    body: updateDescription,
    type: 'course_update',
    priority: 'medium',
    actionUrl: `/course/${courseId}`,
    data: { courseId },
  });
}

/**
 * Notify all students about new module
 */
export async function notifyNewModule(moduleName: string, courseId: string, courseName: string) {
  const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
  const studentsSnapshot = await getDocs(studentsQuery);
  const studentIds = studentsSnapshot.docs.map(doc => doc.id);

  await sendBulkNotifications(studentIds, {
    title: '✨ New Module Added!',
    body: `${moduleName} is now available in ${courseName}`,
    type: 'new_module',
    priority: 'medium',
    actionUrl: `/course/${courseId}`,
    data: { courseId },
  });
}

/**
 * Notify student about course completion
 */
export async function notifyCourseCompletion(studentId: string, courseName: string, courseId: string) {
  await sendNotification({
    userId: studentId,
    title: '🎓 Course Completed!',
    body: `Congratulations! You've completed ${courseName}`,
    type: 'course_completion',
    priority: 'high',
    actionUrl: `/course/${courseId}`,
    data: { courseId },
  });
}

/**
 * Notify student about exam reminder
 */
export async function notifyExamReminder(studentId: string, examName: string, timeRemaining: string, courseId: string) {
  await sendNotification({
    userId: studentId,
    title: '⏰ Exam Reminder',
    body: `${examName} starts in ${timeRemaining}`,
    type: 'exam_reminder',
    priority: 'high',
    actionUrl: `/course/${courseId}`,
    data: { courseId },
  });
}

// ==================== SYSTEM NOTIFICATIONS ====================

/**
 * Notify all users about emergency shutdown
 */
export async function notifyEmergencyShutdown(featureName: string, reason: string, estimatedTime?: string) {
  const allUsersQuery = collection(db, 'users');
  const allUsersSnapshot = await getDocs(allUsersQuery);
  const userIds = allUsersSnapshot.docs.map(doc => doc.id);

  await sendBulkNotifications(userIds, {
    title: '🚨 Emergency: Feature Temporarily Disabled',
    body: `${featureName} is temporarily unavailable. ${reason}${estimatedTime ? ` Estimated restore: ${estimatedTime}` : ''}`,
    type: 'emergency_shutdown',
    priority: 'urgent',
    actionUrl: '/notifications',
  });
}

/**
 * Notify all users about system update
 */
export async function notifySystemUpdate(updateTitle: string, updateDescription: string) {
  const allUsersQuery = collection(db, 'users');
  const allUsersSnapshot = await getDocs(allUsersQuery);
  const userIds = allUsersSnapshot.docs.map(doc => doc.id);

  await sendBulkNotifications(userIds, {
    title: '📢 System Update',
    body: `${updateTitle}: ${updateDescription}`,
    type: 'system_update',
    priority: 'medium',
    actionUrl: '/whats-new',
  });
}

/**
 * Notify user about achievement
 */
export async function notifyAchievement(userId: string, achievementName: string, description: string) {
  await sendNotification({
    userId,
    title: '🏆 Achievement Unlocked!',
    body: `${achievementName}: ${description}`,
    type: 'achievement',
    priority: 'medium',
    actionUrl: '/profile',
  });
}

/**
 * Notify user about points awarded
 */
export async function notifyPointsAwarded(userId: string, points: number, reason: string) {
  await sendNotification({
    userId,
    title: '⭐ Points Earned!',
    body: `You earned ${points} points for ${reason}`,
    type: 'points_awarded',
    priority: 'low',
    actionUrl: '/my-progress',
  });
}

/**
 * Notify user about support message response
 */
export async function notifySupportResponse(userId: string, supportAgentName: string, message: string) {
  await sendNotification({
    userId,
    title: `Support Reply from ${supportAgentName}`,
    body: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
    type: 'support_response',
    priority: 'high',
    actionUrl: '/support-chat',
  });
}

/**
 * Notify user about mention in comment/post
 */
export async function notifyMention(userId: string, mentionerName: string, context: string, actionUrl: string) {
  await sendNotification({
    userId,
    title: `${mentionerName} mentioned you`,
    body: context.substring(0, 100) + (context.length > 100 ? '...' : ''),
    type: 'mention',
    priority: 'medium',
    actionUrl,
  });
}

/**
 * Notify about new follower (if following system exists)
 */
export async function notifyNewFollower(userId: string, followerName: string, followerId: string) {
  await sendNotification({
    userId,
    title: 'New Follower',
    body: `${followerName} started following you`,
    type: 'new_follower',
    priority: 'low',
    actionUrl: `/profile/${followerId}`,
  });
}

// Export all notification functions
export const comprehensiveNotifications = {
  // Chat
  notifyCommunityMessage,
  notifyPrivateMessage,
  notifyGroupMessage,

  // Community Feed
  notifyPostComment,
  notifyPostReaction,
  notifyCommentReply,
  notifyCommentReaction,

  // Marketplace
  notifyNewOrder,
  notifyOrderStatus,
  notifyMarketplaceMessage,

  // Courses
  notifyNewCourse,
  notifyCourseUpdate,
  notifyNewModule,
  notifyCourseCompletion,
  notifyExamReminder,

  // System
  notifyEmergencyShutdown,
  notifySystemUpdate,
  notifyAchievement,
  notifyPointsAwarded,
  notifySupportResponse,
  notifyMention,
  notifyNewFollower,
};
