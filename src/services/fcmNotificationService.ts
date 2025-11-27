import { supabase } from '../lib/auth';

export interface FCMNotification {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  actionUrl?: string;
  data?: any;
  imageUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface FCMToken {
  userId: string;
  token: string;
  device: string;
  browser: string;
  createdAt: string;
  lastUsed: string;
}

export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    console.log('FCM has been removed - using Supabase notifications instead');
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

export async function saveFCMToken(userId: string, token: string) {
  const deviceInfo = {
    device: getDeviceType(),
    browser: getBrowserInfo(),
  };

  const { data: existingToken, error: queryError } = await supabase
    .from('fcm_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('token', token)
    .maybeSingle();

  if (queryError) throw queryError;

  if (!existingToken) {
    const { error } = await supabase
      .from('fcm_tokens')
      .insert({
        user_id: userId,
        token,
        ...deviceInfo,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      });

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('fcm_tokens')
      .update({
        last_used: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('token', token);

    if (error) throw error;
  }
}

export function listenToForegroundMessages(callback: (payload: any) => void) {
  console.log('FCM foreground messages disabled - using Supabase real-time instead');
  return () => {};
}

export async function createNotification(notification: Omit<FCMNotification, 'id' | 'createdAt' | 'read'>) {
  const { data, error } = await supabase
    .from('fcm_notifications')
    .insert({
      ...notification,
      user_id: notification.userId,
      read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: FCMNotification[]) => void
) {
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fcm_notifications',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        supabase
          .from('fcm_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => {
            if (data) callback(data as FCMNotification[]);
          });
      }
    )
    .subscribe();

  supabase
    .from('fcm_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
    .then(({ data }) => {
      if (data) callback(data as FCMNotification[]);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('fcm_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('fcm_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('fcm_notifications')
    .update({
      deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('fcm_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}
