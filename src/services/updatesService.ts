import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  where,
  QueryConstraint
} from 'firebase/firestore';
import { createNotification } from './unifiedNotificationService';

export type UpdateType = 'feature' | 'fix' | 'improvement' | 'announcement';

export interface Update {
  id?: string;
  type: UpdateType;
  title: string;
  description: string;
  version?: string;
  createdBy: string;
  createdAt: Timestamp;
  notifyUsers?: boolean;
}

export const updatesService = {
  async createUpdate(updateData: Omit<Update, 'id' | 'createdAt'>): Promise<Update | null> {
    try {
      const newUpdate = {
        ...updateData,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'updates'), newUpdate);

      if (updateData.notifyUsers) {
        const usersSnapshot = await getDocs(collection(db, 'users'));

        const notificationPromises = usersSnapshot.docs.map(userDoc => {
          let notifType: any = 'system_feature';
          let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

          switch (updateData.type) {
            case 'feature':
              notifType = 'system_feature';
              priority = 'medium';
              break;
            case 'fix':
              notifType = 'system_feature';
              priority = 'low';
              break;
            case 'improvement':
              notifType = 'system_feature';
              priority = 'low';
              break;
            case 'announcement':
              notifType = 'system_announcement';
              priority = 'high';
              break;
          }

          return createNotification({
            user_id: userDoc.id,
            type: notifType,
            title: updateData.title,
            message: updateData.description,
            priority,
            action_url: '/notifications?tab=updates',
            metadata: {
              updateId: docRef.id,
              updateType: updateData.type,
              version: updateData.version || ''
            }
          });
        });

        await Promise.all(notificationPromises);
      }

      return {
        id: docRef.id,
        ...newUpdate,
      };
    } catch (error) {
      console.error('Error creating update:', error);
      return null;
    }
  },

  async getAllUpdates(limitCount: number = 50): Promise<Update[]> {
    try {
      const q = query(
        collection(db, 'updates'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Update));
    } catch (error) {
      console.error('Error getting updates:', error);
      return [];
    }
  },

  async getUpdatesByType(type: UpdateType, limitCount: number = 20): Promise<Update[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('type', '==', type),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      ];

      const q = query(collection(db, 'updates'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Update));
    } catch (error) {
      console.error('Error getting updates by type:', error);
      return [];
    }
  },

  async getRecentUpdates(days: number = 30): Promise<Update[]> {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const constraints: QueryConstraint[] = [
        where('createdAt', '>=', Timestamp.fromDate(dateThreshold)),
        orderBy('createdAt', 'desc')
      ];

      const q = query(collection(db, 'updates'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Update));
    } catch (error) {
      console.error('Error getting recent updates:', error);
      return [];
    }
  },

  getUpdateIcon(type: UpdateType): string {
    switch (type) {
      case 'feature':
        return '✨';
      case 'fix':
        return '🔧';
      case 'improvement':
        return '⚡';
      case 'announcement':
        return '📢';
      default:
        return '📝';
    }
  },

  getUpdateColor(type: UpdateType): string {
    switch (type) {
      case 'feature':
        return 'from-blue-500 to-blue-600';
      case 'fix':
        return 'from-green-500 to-green-600';
      case 'improvement':
        return 'from-purple-500 to-purple-600';
      case 'announcement':
        return 'from-[#D71920] to-[#B91518]';
      default:
        return 'from-gray-500 to-gray-600';
    }
  }
};
