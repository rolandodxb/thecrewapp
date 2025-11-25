import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationType =
  | 'bug_report_status'
  | 'bug_report_comment'
  | 'chat_private'
  | 'chat_group'
  | 'chat_community'
  | 'chat_mention'
  | 'community_post'
  | 'community_comment'
  | 'community_reaction'
  | 'system_feature'
  | 'system_shutdown'
  | 'system_announcement'
  | 'system_maintenance'
  | 'learning_course'
  | 'learning_module'
  | 'learning_update'
  | 'learning_exam'
  | 'learning_achievement'
  | 'security_login'
  | 'security_restriction'
  | 'security_password';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type UserRole = 'student' | 'crew' | 'mentor' | 'coach' | 'trainer' | 'communicator' | 'finance' | 'governor';

export interface Notification {
  id?: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;

  bug_report_status_changes: boolean;
  bug_report_new_comments: boolean;
  bug_report_assigned: boolean;

  chat_private_messages: boolean;
  chat_group_messages: boolean;
  chat_community_messages: boolean;
  chat_mentions: boolean;

  community_new_posts: boolean;
  community_post_comments: boolean;
  community_post_reactions: boolean;
  community_my_post_activity: boolean;

  system_new_features: boolean;
  system_feature_shutdowns: boolean;
  system_announcements: boolean;
  system_maintenance: boolean;

  learning_new_courses: boolean;
  learning_new_modules: boolean;
  learning_course_updates: boolean;
  learning_exam_reminders: boolean;
  learning_achievements: boolean;

  security_unknown_logins: boolean;
  security_account_restrictions: boolean;
  security_password_changes: boolean;

  email_notifications: boolean;
  push_notifications: boolean;
}

interface RoleNotificationRule {
  type: NotificationType;
  allowedRoles: UserRole[] | 'all';
  requiresPreference: boolean;
  preferenceKey?: keyof NotificationPreferences;
}

const NOTIFICATION_RULES: RoleNotificationRule[] = [
  { type: 'bug_report_status', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'bug_report_status_changes' },
  { type: 'bug_report_comment', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'bug_report_new_comments' },

  { type: 'chat_private', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'chat_private_messages' },
  { type: 'chat_group', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'chat_group_messages' },
  { type: 'chat_community', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'chat_community_messages' },
  { type: 'chat_mention', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'chat_mentions' },

  { type: 'community_post', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'community_new_posts' },
  { type: 'community_comment', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'community_post_comments' },
  { type: 'community_reaction', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'community_post_reactions' },

  { type: 'system_feature', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'system_new_features' },
  { type: 'system_shutdown', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'system_feature_shutdowns' },
  { type: 'system_announcement', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'system_announcements' },
  { type: 'system_maintenance', allowedRoles: 'all', requiresPreference: true, preferenceKey: 'system_maintenance' },

  { type: 'learning_course', allowedRoles: ['student', 'crew', 'mentor', 'coach', 'governor'], requiresPreference: true, preferenceKey: 'learning_new_courses' },
  { type: 'learning_module', allowedRoles: ['student', 'crew', 'mentor', 'coach', 'governor'], requiresPreference: true, preferenceKey: 'learning_new_modules' },
  { type: 'learning_update', allowedRoles: ['student', 'crew', 'mentor', 'coach', 'governor'], requiresPreference: true, preferenceKey: 'learning_course_updates' },
  { type: 'learning_exam', allowedRoles: ['student', 'crew'], requiresPreference: true, preferenceKey: 'learning_exam_reminders' },
  { type: 'learning_achievement', allowedRoles: ['student', 'crew'], requiresPreference: true, preferenceKey: 'learning_achievements' },

  { type: 'security_login', allowedRoles: 'all', requiresPreference: false },
  { type: 'security_restriction', allowedRoles: 'all', requiresPreference: false },
  { type: 'security_password', allowedRoles: 'all', requiresPreference: false },
];

export async function createNotification(
  notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'read'>,
  checkPreferences: boolean = true
): Promise<string | null> {
  try {
    if (checkPreferences) {
      const shouldSend = await shouldSendNotification(notification.user_id, notification.type);
      if (!shouldSend) {
        console.log(`Notification blocked by user preferences: ${notification.type} for user ${notification.user_id}`);
        return null;
      }
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
}

export async function createNotificationsForMultipleUsers(
  userIds: string[],
  notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'read' | 'user_id'>,
  checkPreferences: boolean = true
): Promise<number> {
  try {
    const notifications = await Promise.all(
      userIds.map(async (userId) => {
        if (checkPreferences) {
          const shouldSend = await shouldSendNotification(userId, notification.type);
          if (!shouldSend) return null;
        }
        return {
          ...notification,
          user_id: userId,
          read: false,
        };
      })
    );

    const validNotifications = notifications.filter((n) => n !== null);

    if (validNotifications.length === 0) {
      return 0;
    }

    const { error } = await supabase
      .from('notifications')
      .insert(validNotifications);

    if (error) {
      console.error('Error creating bulk notifications:', error);
      return 0;
    }

    return validNotifications.length;
  } catch (error) {
    console.error('Error in createNotificationsForMultipleUsers:', error);
    return 0;
  }
}

export async function createNotificationForRoles(
  notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'read' | 'user_id'>,
  roles: UserRole[],
  excludeUserId?: string
) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('uid, role')
      .in('role', roles);

    if (error || !users) {
      console.error('Error fetching users by role:', error);
      return;
    }

    const userIds = users
      .filter((user) => user.uid !== excludeUserId)
      .map((user) => user.uid);

    await createNotificationsForMultipleUsers(userIds, notification, true);
  } catch (error) {
    console.error('Error in createNotificationForRoles:', error);
  }
}

export async function shouldSendNotification(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    const rule = NOTIFICATION_RULES.find((r) => r.type === notificationType);

    if (!rule || !rule.requiresPreference) {
      return true;
    }

    if (!rule.preferenceKey) {
      return true;
    }

    const prefs = await getUserPreferences(userId);
    if (!prefs) {
      return true;
    }

    return prefs[rule.preferenceKey] === true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true;
  }
}

export async function getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return null;
  }
}

export async function initializeUserPreferences(userId: string): Promise<boolean> {
  try {
    const existing = await getUserPreferences(userId);
    if (existing) {
      return true;
    }

    const { error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        bug_report_status_changes: true,
        bug_report_new_comments: true,
        bug_report_assigned: true,
        chat_private_messages: true,
        chat_group_messages: true,
        chat_community_messages: false,
        chat_mentions: true,
        community_new_posts: true,
        community_post_comments: true,
        community_post_reactions: false,
        community_my_post_activity: true,
        system_new_features: true,
        system_feature_shutdowns: true,
        system_announcements: true,
        system_maintenance: true,
        learning_new_courses: true,
        learning_new_modules: true,
        learning_course_updates: true,
        learning_exam_reminders: true,
        learning_achievements: true,
        security_unknown_logins: true,
        security_account_restrictions: true,
        security_password_changes: true,
        email_notifications: false,
        push_notifications: true,
      });

    if (error) {
      console.error('Error initializing preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in initializeUserPreferences:', error);
    return false;
  }
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return false;
  }
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  const fetchAndSubscribe = async () => {
    const { data: initialData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (initialData) {
      callback(initialData);
    }

    channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
  };

  fetchAndSubscribe();

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return false;
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return 0;
  }
}

export async function notifyBugReportStatusChange(
  userId: string,
  bugReportId: string,
  bugTitle: string,
  newStatus: string,
  changedBy: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'bug_report_status',
    title: 'Bug Report Status Updated',
    message: `${changedBy} changed "${bugTitle}" to ${newStatus}`,
    priority: 'medium',
    action_url: `/support?bugId=${bugReportId}`,
    metadata: { bugReportId, status: newStatus },
  });
}

export async function notifyBugReportComment(
  userIds: string[],
  bugReportId: string,
  bugTitle: string,
  commenterName: string
): Promise<void> {
  await createNotificationsForMultipleUsers(userIds, {
    type: 'bug_report_comment',
    title: 'New Comment on Bug Report',
    message: `${commenterName} commented on "${bugTitle}"`,
    priority: 'medium',
    action_url: `/support?bugId=${bugReportId}`,
    metadata: { bugReportId },
  });
}

export async function notifyNewPrivateChat(
  userId: string,
  senderName: string,
  conversationId: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'chat_private',
    title: `New message from ${senderName}`,
    message: 'You have a new private message',
    priority: 'high',
    action_url: `/chat?conversation=${conversationId}`,
    metadata: { conversationId, senderName },
  });
}

export async function notifyGroupMessage(
  userIds: string[],
  groupName: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<void> {
  await createNotificationsForMultipleUsers(userIds, {
    type: 'chat_group',
    title: `${senderName} in ${groupName}`,
    message: messagePreview,
    priority: 'medium',
    action_url: `/chat?conversation=${conversationId}`,
    metadata: { conversationId, groupName, senderName },
  });
}

export async function notifyNewCommunityPost(
  postId: string,
  authorName: string,
  content: string,
  channel: string,
  excludeUserId?: string
): Promise<void> {
  await createNotificationForRoles(
    {
      type: 'community_post',
      title: `New post in ${channel}`,
      message: `${authorName}: ${content.substring(0, 100)}...`,
      priority: 'low',
      action_url: `/community?post=${postId}`,
      metadata: { postId, authorName, channel },
    },
    ['student', 'crew', 'mentor', 'coach', 'trainer', 'communicator', 'governor'],
    excludeUserId
  );
}

export async function notifyPostComment(
  userId: string,
  postId: string,
  commenterName: string,
  commentContent: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'community_comment',
    title: 'New comment on your post',
    message: `${commenterName}: ${commentContent.substring(0, 100)}`,
    priority: 'medium',
    action_url: `/community?post=${postId}`,
    metadata: { postId, commenterName },
  });
}

export async function notifyNewCourse(
  courseTitle: string,
  courseId: string,
  mentorName: string
): Promise<void> {
  await createNotificationForRoles(
    {
      type: 'learning_course',
      title: 'New Course Available!',
      message: `Check out "${courseTitle}" by ${mentorName}`,
      priority: 'medium',
      action_url: `/courses/${courseId}`,
      metadata: { courseId, courseTitle },
    },
    ['student', 'crew', 'mentor', 'coach', 'governor']
  );
}

export async function notifyNewModule(
  moduleTitle: string,
  moduleId: string,
  courseName: string
): Promise<void> {
  await createNotificationForRoles(
    {
      type: 'learning_module',
      title: 'New Module Available!',
      message: `New module "${moduleTitle}" in ${courseName}`,
      priority: 'medium',
      action_url: `/modules/${moduleId}`,
      metadata: { moduleId, moduleTitle, courseName },
    },
    ['student', 'crew', 'mentor', 'coach', 'governor']
  );
}

export async function notifyFeatureRelease(
  featureName: string,
  description: string
): Promise<void> {
  await createNotificationForRoles(
    {
      type: 'system_feature',
      title: `New Feature: ${featureName}`,
      message: description,
      priority: 'high',
      metadata: { featureName },
    },
    ['student', 'crew', 'mentor', 'coach', 'trainer', 'communicator', 'finance', 'governor']
  );
}

export async function notifyFeatureShutdown(
  featureName: string,
  reason: string
): Promise<void> {
  await createNotificationForRoles(
    {
      type: 'system_shutdown',
      title: 'Feature Temporarily Disabled',
      message: `${featureName} has been disabled. ${reason}`,
      priority: 'urgent',
      metadata: { featureName, reason },
    },
    ['student', 'crew', 'mentor', 'coach', 'trainer', 'communicator', 'finance', 'governor']
  );
}

export async function notifyUnknownLogin(
  userId: string,
  deviceInfo: any,
  location: any
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      type: 'security_login',
      title: 'Unknown Login Detected',
      message: `New login from ${deviceInfo.browser} on ${deviceInfo.os} in ${location.city || 'unknown location'}`,
      priority: 'urgent',
      action_url: '/settings?tab=security',
      metadata: { deviceInfo, location },
    },
    false
  );
}

export async function notifyAccountRestriction(
  userId: string,
  restrictionType: string,
  reason: string
): Promise<void> {
  await createNotification(
    {
      user_id: userId,
      type: 'security_restriction',
      title: 'Account Notice',
      message: `Your account has been ${restrictionType}. ${reason}`,
      priority: 'urgent',
      action_url: '/support',
      metadata: { restrictionType, reason },
    },
    false
  );
}
