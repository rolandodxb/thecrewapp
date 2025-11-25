import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  requestNotificationPermission,
  listenToForegroundMessages,
  createNotification,
} from '../services/fcmNotificationService';

export function useFCMNotifications() {
  const { currentUser } = useApp();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    setPermission(Notification.permission);

    const unsubscribe = listenToForegroundMessages((payload) => {
      console.log('Foreground message received:', payload);

      if (payload.notification) {
        createNotification({
          userId: currentUser.uid,
          title: payload.notification.title || 'New Notification',
          body: payload.notification.body || '',
          type: payload.data?.type || 'info',
          priority: payload.data?.priority || 'medium',
          actionUrl: payload.data?.actionUrl,
          data: payload.data,
          imageUrl: payload.notification.image,
        });

        new Notification(payload.notification.title || 'New Notification', {
          body: payload.notification.body || '',
          icon: payload.notification.image || '/logo.png',
          badge: '/logo.png',
          tag: payload.messageId,
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]);

  const requestPermission = async () => {
    if (!currentUser) return;

    const token = await requestNotificationPermission(currentUser.uid);
    if (token) {
      setFcmToken(token);
      setPermission('granted');
    }
  };

  return {
    permission,
    fcmToken,
    requestPermission,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
  };
}
