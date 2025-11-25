import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MessageMention {
  id: string;
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  messageContent: string;
  senderId: string;
  senderName: string;
  mentionedUserId: string;
  mentionedUserName: string;
  createdAt: Timestamp;
  read: boolean;
}

export const messageMentionsService = {
  async extractMentions(text: string): Promise<string[]> {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    return [...new Set(mentions)];
  },

  async createMentionNotifications(
    conversationId: string,
    conversationTitle: string,
    messageId: string,
    messageContent: string,
    senderId: string,
    senderName: string,
    mentionedUserNames: string[]
  ): Promise<void> {
    if (mentionedUserNames.length === 0) return;

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('name', 'in', mentionedUserNames.slice(0, 10))
      );

      const usersSnapshot = await getDocs(usersQuery);

      const batch: Promise<void>[] = [];

      usersSnapshot.docs.forEach((userDoc) => {
        const userId = userDoc.id;
        const userName = userDoc.data().name;

        if (userId === senderId) return;

        const mentionRef = doc(collection(db, 'message_mentions'));

        const mentionData: Omit<MessageMention, 'id'> = {
          conversationId,
          conversationTitle,
          messageId,
          messageContent: messageContent.substring(0, 200),
          senderId,
          senderName,
          mentionedUserId: userId,
          mentionedUserName: userName,
          createdAt: Timestamp.now(),
          read: false,
        };

        batch.push(setDoc(mentionRef, { id: mentionRef.id, ...mentionData }));
      });

      await Promise.all(batch);
    } catch (error) {
      console.error('Error creating mention notifications:', error);
    }
  },

  async getUserMentions(
    userId: string,
    unreadOnly: boolean = false,
    limitCount: number = 50
  ): Promise<MessageMention[]> {
    try {
      const constraints: any[] = [
        where('mentionedUserId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount),
      ];

      if (unreadOnly) {
        constraints.push(where('read', '==', false));
      }

      const q = query(collection(db, 'message_mentions'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => doc.data() as MessageMention);
    } catch (error) {
      console.error('Error getting user mentions:', error);
      return [];
    }
  },

  subscribeToUserMentions(
    userId: string,
    callback: (mentions: MessageMention[]) => void,
    unreadOnly: boolean = false
  ): () => void {
    const constraints: any[] = [
      where('mentionedUserId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50),
    ];

    if (unreadOnly) {
      constraints.push(where('read', '==', false));
    }

    const q = query(collection(db, 'message_mentions'), ...constraints);

    return onSnapshot(q, (snapshot) => {
      const mentions = snapshot.docs.map((doc) => doc.data() as MessageMention);
      callback(mentions);
    });
  },

  async markMentionAsRead(mentionId: string): Promise<void> {
    try {
      const mentionRef = doc(db, 'message_mentions', mentionId);
      await setDoc(mentionRef, { read: true }, { merge: true });
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }
  },

  async markAllMentionsAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'message_mentions'),
        where('mentionedUserId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch: Promise<void>[] = [];

      snapshot.docs.forEach((doc) => {
        batch.push(setDoc(doc.ref, { read: true }, { merge: true }));
      });

      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking all mentions as read:', error);
    }
  },

  async getUnreadMentionsCount(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'message_mentions'),
        where('mentionedUserId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread mentions count:', error);
      return 0;
    }
  },
};
