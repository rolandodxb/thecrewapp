import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { MessageReport, Message } from './communityChatService';

export interface ModerationAuditEntry {
  action: string;
  targetType: 'message' | 'user';
  targetId: string;
  conversationId?: string;
  moderatorId: string;
  timestamp: Timestamp;
  reason?: string;
  duration?: number;
}

export interface SearchFilters {
  text?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  conversationId?: string;
}

export const moderationService = {
  async getReportedMessages(status?: 'open' | 'reviewed' | 'closed'): Promise<MessageReport[]> {
    let q = query(collection(db, 'messageReports'), orderBy('createdAt', 'desc'), limit(100));

    if (status) {
      q = query(
        collection(db, 'messageReports'),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
  },

  subscribeToReportedMessages(
    callback: (reports: MessageReport[]) => void,
    status?: 'open' | 'reviewed' | 'closed'
  ) {
    let q = query(collection(db, 'messageReports'), orderBy('createdAt', 'desc'), limit(50));

    if (status) {
      q = query(
        collection(db, 'messageReports'),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as any));
      callback(reports);
    });
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    const moderateFunc = httpsCallable(functions, 'moderateMessage');
    await moderateFunc({ conversationId, messageId, action: 'delete' });
  },

  async restoreMessage(conversationId: string, messageId: string): Promise<void> {
    const moderateFunc = httpsCallable(functions, 'moderateMessage');
    await moderateFunc({ conversationId, messageId, action: 'restore' });
  },

  async muteUser(
    targetUserId: string,
    conversationId?: string,
    duration?: number
  ): Promise<void> {
    const muteFunc = httpsCallable(functions, 'muteUser');
    await muteFunc({ targetUserId, conversationId, duration });
  },

  async banUser(targetUserId: string, reason: string): Promise<void> {
    const banFunc = httpsCallable(functions, 'banUser');
    await banFunc({ targetUserId, reason });
  },

  async searchMessages(filters: SearchFilters): Promise<Message[]> {
    let baseQuery = query(collection(db, 'conversations'));

    if (filters.conversationId) {
      const messagesRef = collection(
        db,
        'conversations',
        filters.conversationId,
        'messages'
      );
      let q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100));

      if (filters.userId) {
        q = query(
          messagesRef,
          where('senderId', '==', filters.userId),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      let messages = snapshot.docs.map((doc) => doc.data() as Message);

      if (filters.text) {
        messages = messages.filter((msg) =>
          msg.content.toLowerCase().includes(filters.text!.toLowerCase())
        );
      }

      if (filters.startDate) {
        messages = messages.filter(
          (msg) => msg.createdAt.toDate() >= filters.startDate!
        );
      }

      if (filters.endDate) {
        messages = messages.filter(
          (msg) => msg.createdAt.toDate() <= filters.endDate!
        );
      }

      return messages;
    }

    return [];
  },

  async getAuditLog(
    limitCount: number = 100,
    lastDoc?: DocumentSnapshot
  ): Promise<{ entries: ModerationAuditEntry[]; lastDoc: DocumentSnapshot | null }> {
    let q = query(
      collection(db, 'moderationAudit'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'moderationAudit'),
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map((doc) => doc.data() as ModerationAuditEntry);

    return {
      entries,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  },

  subscribeToAuditLog(callback: (entries: ModerationAuditEntry[]) => void) {
    const q = query(
      collection(db, 'moderationAudit'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map((doc) => doc.data() as ModerationAuditEntry);
      callback(entries);
    });
  },

  async bulkDeleteMessages(
    conversationId: string,
    messageIds: string[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const messageId of messageIds) {
      try {
        await this.deleteMessage(conversationId, messageId);
        success++;
      } catch (error) {
        failed++;
        console.error(`Failed to delete message ${messageId}:`, error);
      }
    }

    return { success, failed };
  },

  async exportAuditLog(): Promise<string> {
    const { entries } = await this.getAuditLog(1000);

    const headers = ['Timestamp', 'Action', 'Target Type', 'Target ID', 'Moderator ID', 'Reason'];
    const rows = entries.map((entry) => [
      entry.timestamp.toDate().toISOString(),
      entry.action,
      entry.targetType,
      entry.targetId,
      entry.moderatorId,
      entry.reason || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  },

  async getMessagesByUser(userId: string, limitCount: number = 100): Promise<Message[]> {
    const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
    const allMessages: Message[] = [];

    for (const convDoc of conversationsSnapshot.docs) {
      const messagesQuery = query(
        collection(db, 'conversations', convDoc.id, 'messages'),
        where('senderId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map((doc) => doc.data() as Message);
      allMessages.push(...messages);
    }

    return allMessages.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  },
};
