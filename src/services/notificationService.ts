import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  writeBatch,
  Timestamp,
  getDocs,
  limit,
  getDoc,
} from 'firebase/firestore';

export type NotificationType =
  | 'system_update'
  | 'new_feature'
  | 'new_course'
  | 'course_update'
  | 'bug_report_new'
  | 'bug_report_comment'
  | 'bug_report_status'
  | 'community_message'
  | 'private_message'
  | 'group_message'
  | 'support_message'
  | 'points_awarded'
  | 'daily_login'
  | 'course_completion'
  | 'exam_reminder'
  | 'learning_reminder'
  | 'achievement'
  | 'system_announcement'
  | 'feature_shutdown'
  | 'feature_restore';

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: {
    bugReportId?: string;
    courseId?: string;
    conversationId?: string;
    ticketId?: string;
    points?: number;
    featureName?: string;
    announcementId?: string;
    [key: string]: any;
  };
  createdAt: Timestamp;
}

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function createNotificationForAllUsers(
  notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>
) {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const batch = writeBatch(db);
    const notificationsRef = collection(db, 'notifications');

    usersSnapshot.docs.forEach((userDoc) => {
      const notificationDocRef = doc(notificationsRef);
      batch.set(notificationDocRef, {
        ...notification,
        userId: userDoc.id,
        createdAt: Timestamp.now(),
      });
    });

    await batch.commit();
    console.log(`Created notification for ${usersSnapshot.docs.length} users`);
  } catch (error) {
    console.error('Error creating notifications for all users:', error);
  }
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Notification));
    callback(notifications);
  });
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      if (!docSnap.data().read) {
        batch.update(docSnap.ref, { read: true });
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

export async function notifySystemUpdate(title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
  await createNotificationForAllUsers({
    type: 'system_update',
    title,
    message,
    read: false,
    priority,
  });
}

export async function notifyNewFeature(title: string, message: string) {
  await createNotificationForAllUsers({
    type: 'new_feature',
    title,
    message,
    read: false,
    priority: 'high',
  });
}

export async function notifySystemAnnouncement(announcementTitle: string, announcementMessage: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'high') {
  await createNotificationForAllUsers({
    type: 'system_announcement',
    title: announcementTitle,
    message: announcementMessage,
    read: false,
    priority,
  });
}

export async function notifyFeatureShutdown(featureName: string, reason: string) {
  await createNotificationForAllUsers({
    type: 'feature_shutdown',
    title: `Feature Temporarily Disabled`,
    message: `${featureName} has been temporarily disabled. ${reason}`,
    read: false,
    priority: 'urgent',
    metadata: { featureName },
  });
}

export async function notifyFeatureRestore(featureName: string) {
  await createNotificationForAllUsers({
    type: 'feature_restore',
    title: `Feature Restored`,
    message: `${featureName} is now available again!`,
    read: false,
    priority: 'medium',
    metadata: { featureName },
  });
}

export async function notifyBugReportComment(
  userId: string,
  bugReportId: string,
  bugTitle: string,
  commenterName: string
) {
  await createNotification({
    userId,
    type: 'bug_report_comment',
    title: 'New Comment on Bug Report',
    message: `${commenterName} commented on "${bugTitle}"`,
    read: false,
    priority: 'medium',
    actionUrl: `/support?bugId=${bugReportId}`,
    metadata: { bugReportId },
  });
}

export async function notifyBugReportStatus(
  userId: string,
  bugReportId: string,
  bugTitle: string,
  newStatus: string
) {
  await createNotification({
    userId,
    type: 'bug_report_status',
    title: 'Bug Report Status Updated',
    message: `"${bugTitle}" status changed to ${newStatus}`,
    read: false,
    priority: 'medium',
    actionUrl: `/support?bugId=${bugReportId}`,
    metadata: { bugReportId, status: newStatus },
  });
}

export async function notifyCommunityMessage(
  userId: string,
  senderName: string,
  messagePreview: string
) {
  await createNotification({
    userId,
    type: 'community_message',
    title: `${senderName} in Community Chat`,
    message: messagePreview,
    read: false,
    actionUrl: '/chat?conversation=publicRoom',
  });
}

export async function notifyPrivateMessage(
  userId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
) {
  await createNotification({
    userId,
    type: 'private_message',
    title: `Message from ${senderName}`,
    message: messagePreview,
    read: false,
    priority: 'high',
    actionUrl: `/chat?conversation=${conversationId}`,
    metadata: { conversationId },
  });
}

export async function notifyGroupMessage(
  userId: string,
  groupName: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
) {
  await createNotification({
    userId,
    type: 'group_message',
    title: `${senderName} in ${groupName}`,
    message: messagePreview,
    read: false,
    actionUrl: `/chat?conversation=${conversationId}`,
    metadata: { conversationId },
  });
}

export async function notifySupportMessage(userId: string, message: string) {
  await createNotification({
    userId,
    type: 'support_message',
    title: 'Support Team Response',
    message,
    read: false,
    priority: 'high',
    actionUrl: '/support-chat',
  });
}

export async function notifyPointsAwarded(
  userId: string,
  points: number,
  reason: string
) {
  await createNotification({
    userId,
    type: 'points_awarded',
    title: 'Points Earned!',
    message: `You earned ${points} points for ${reason}`,
    read: false,
    metadata: { points },
  });
}

export async function notifyDailyLogin(userId: string, streak: number) {
  await createNotification({
    userId,
    type: 'daily_login',
    title: 'Daily Login Bonus',
    message: `${streak} day streak! Keep it up!`,
    read: false,
    actionUrl: '/my-progress',
  });
}

export async function notifyCourseCompletion(
  userId: string,
  courseTitle: string,
  points: number
) {
  await createNotification({
    userId,
    type: 'course_completion',
    title: 'Course Completed!',
    message: `Congratulations on completing "${courseTitle}"! You earned ${points} points.`,
    read: false,
    priority: 'high',
    actionUrl: '/my-progress',
    metadata: { points },
  });
}

export async function notifyNewCourse(courseTitle: string, courseId: string) {
  await createNotificationForAllUsers({
    type: 'new_course',
    title: 'New Course Available!',
    message: `Check out "${courseTitle}"`,
    read: false,
    priority: 'medium',
    actionUrl: `/courses/${courseId}`,
    metadata: { courseId },
  });
}

export async function notifyCourseUpdate(
  courseTitle: string,
  courseId: string,
  updateMessage: string
) {
  await createNotificationForAllUsers({
    type: 'course_update',
    title: `Course Updated: ${courseTitle}`,
    message: updateMessage,
    read: false,
    actionUrl: `/courses/${courseId}`,
    metadata: { courseId },
  });
}

export async function notifyExamReminder(
  userId: string,
  examTitle: string,
  courseId: string
) {
  await createNotification({
    userId,
    type: 'exam_reminder',
    title: 'Exam Available',
    message: `Don't forget to take the "${examTitle}" exam`,
    read: false,
    actionUrl: `/courses/${courseId}`,
    metadata: { courseId },
  });
}

export async function notifyLearningReminder(
  userId: string,
  courseTitle: string,
  courseId: string
) {
  await createNotification({
    userId,
    type: 'learning_reminder',
    title: 'Continue Your Learning',
    message: `You have progress in "${courseTitle}"`,
    read: false,
    actionUrl: `/courses/${courseId}`,
    metadata: { courseId },
  });
}

export async function notifyAchievement(
  userId: string,
  achievementTitle: string,
  achievementMessage: string
) {
  await createNotification({
    userId,
    type: 'achievement',
    title: `Achievement Unlocked: ${achievementTitle}`,
    message: achievementMessage,
    read: false,
    priority: 'high',
    actionUrl: '/profile',
  });
}

export async function getAllActiveBugReports() {
  try {
    const bugReportsRef = collection(db, 'bugReports');
    const q = query(
      bugReportsRef,
      where('status', 'in', ['open', 'in-progress', 'escalated']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching active bug reports:', error);
    return [];
  }
}

export async function getCurrentSystemAnnouncements() {
  try {
    const systemControlRef = doc(db, 'systemControl', 'settings');
    const snapshot = await getDocs(query(collection(db, 'systemControl')));

    const announcements: any[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.announcement && data.announcement.enabled) {
        announcements.push({
          id: doc.id,
          ...data.announcement,
        });
      }
    });

    return announcements;
  } catch (error) {
    console.error('Error fetching system announcements:', error);
    return [];
  }
}

export async function getActiveFeatureShutdowns() {
  try {
    const shutdownDocRef = doc(db, 'systemSettings', 'featuresShutdown');
    const snapshot = await getDoc(shutdownDocRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const shutdownData = snapshot.data();
    const activeShutdowns = [];
    
    // Filter active shutdowns from the document data
    for (const [featureName, shutdownInfo] of Object.entries(shutdownData)) {
      if (shutdownInfo && typeof shutdownInfo === 'object' && (shutdownInfo.isActive || shutdownInfo.isShutdown)) {
        activeShutdowns.push({
          id: featureName,
          featureName,
          ...shutdownInfo,
        });
      }
    }
    
    return activeShutdowns;
  } catch (error) {
    console.error('Error fetching feature shutdowns:', error);
    return [];
  }
}
