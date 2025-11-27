import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  writeBatch,
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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
  createdAt: Timestamp;
  readAt?: Timestamp;
}

export interface FCMToken {
  userId: string;
  token: string;
  device: string;
  browser: string;
  createdAt: Timestamp;
  lastUsed: Timestamp;
}

const notificationsCollection = 'fcmNotifications';
const tokensCollection = 'fcmTokens';

export async function requestNotificationPermission(userId: string): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token) {
      await saveFCMToken(userId, token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export async function saveFCMToken(userId: string, token: string) {
  const deviceInfo = {
    device: getDeviceType(),
    browser: getBrowserInfo(),
  };

  const existingTokenQuery = query(
    collection(db, tokensCollection),
    where('userId', '==', userId),
    where('token', '==', token)
  );

  const snapshot = await getDocs(existingTokenQuery);

  if (snapshot.empty) {
    await addDoc(collection(db, tokensCollection), {
      userId,
      token,
      ...deviceInfo,
      createdAt: Timestamp.now(),
      lastUsed: Timestamp.now(),
    });
  } else {
    const docRef = doc(db, tokensCollection, snapshot.docs[0].id);
    await updateDoc(docRef, {
      lastUsed: Timestamp.now(),
    });
  }
}

export function listenToForegroundMessages(callback: (payload: any) => void) {
  try {
    const messaging = getMessaging();
    return onMessage(messaging, callback);
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return () => {};
  }
}

export async function createNotification(notification: Omit<FCMNotification, 'id' | 'createdAt' | 'read'>) {
  const docRef = await addDoc(collection(db, notificationsCollection), {
    ...notification,
    read: false,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: FCMNotification[]) => void
) {
  const q = query(
    collection(db, notificationsCollection),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FCMNotification[];

    callback(notifications);
  });
}

export async function markNotificationAsRead(notificationId: string) {
  const docRef = doc(db, notificationsCollection, notificationId);
  await updateDoc(docRef, {
    read: true,
    readAt: Timestamp.now(),
  });
}

export async function markAllNotificationsAsRead(userId: string) {
  const q = query(
    collection(db, notificationsCollection),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((document) => {
    batch.update(document.ref, {
      read: true,
      readAt: Timestamp.now(),
    });
  });

  await batch.commit();
}

export async function deleteNotification(notificationId: string) {
  const docRef = doc(db, notificationsCollection, notificationId);
  await updateDoc(docRef, {
    deleted: true,
    deletedAt: Timestamp.now(),
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const q = query(
    collection(db, notificationsCollection),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
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
