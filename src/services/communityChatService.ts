import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  onSnapshot,
  updateDoc,
  arrayUnion,
  DocumentSnapshot,
  QueryConstraint,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth, functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { aiModerationService } from './aiModerationService';
import { reputationService } from './reputationService';

export interface Conversation {
  id: string;
  type: 'group' | 'private';
  title: string;
  members: string[];
  createdBy: string;
  createdAt: Timestamp;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Timestamp;
  };
  pinned?: boolean;
  mutedBy?: Record<string, boolean>;
  isArchivedBy?: Record<string, boolean>;
  category?: 'general' | 'marketplace';
}

export interface Message {
  messageId: string;
  senderId: string;
  senderName?: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'system';
  attachmentRef?: string;
  attachmentUrl?: string;
  attachmentMetadata?: {
    name: string;
    size: number;
    type: string;
  };
  createdAt: Timestamp;
  editedAt?: Timestamp;
  deleted: boolean;
  reactions?: Record<string, string[]>;
  likesCount: number;
  readBy?: Record<string, Timestamp>;
  replyTo?: string;
}

export interface MessageReport {
  reporterId: string;
  messageRef: string;
  conversationId: string;
  messageId: string;
  reason: string;
  status: 'open' | 'reviewed' | 'closed';
  createdAt: Timestamp;
  handledBy?: string;
  handledAt?: Timestamp;
}

const PAGE_SIZE = 50;

export const communityChatService = {
  async ensureCommunityChat(): Promise<void> {
    const communityRef = doc(db, 'groupChats', 'publicRoom');
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) {
      const conversationData: Conversation = {
        id: 'publicRoom',
        type: 'group',
        title: 'Community Chat',
        members: [],
        createdBy: 'system',
        createdAt: Timestamp.now(),
        pinned: false,
        mutedBy: {},
        isArchivedBy: {},
      };

      await setDoc(communityRef, conversationData);
    }
  },

  async joinCommunityChat(userId: string): Promise<void> {
    const communityRef = doc(db, 'groupChats', 'publicRoom');
    const communityDoc = await getDoc(communityRef);

    if (communityDoc.exists()) {
      const currentMembers = communityDoc.data().members || [];
      if (!currentMembers.includes(userId)) {
        await updateDoc(communityRef, {
          members: arrayUnion(userId),
        });
      }
    }
  },

  async createConversation(
    type: 'group' | 'private',
    title: string,
    memberIds: string[],
    category?: 'general' | 'marketplace'
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    if (!memberIds.includes(userId)) {
      memberIds.push(userId);
    }

    if (memberIds.length < 2) {
      throw new Error('Conversation must have at least 2 members');
    }

    if (type === 'private' && memberIds.length > 2) {
      throw new Error('Private conversations can only have 2 members');
    }

    if (type === 'private') {
      const existingConv = await this.findPrivateConversation(memberIds);
      if (existingConv) {
        return existingConv.id;
      }
    }

    const conversationRef = doc(collection(db, 'groupChats'));
    const conversationData: Conversation = {
      id: conversationRef.id,
      type,
      title,
      members: memberIds,
      createdBy: userId,
      createdAt: Timestamp.now(),
      pinned: false,
      mutedBy: {},
      isArchivedBy: {},
      category: category || 'general',
    };

    await setDoc(conversationRef, conversationData);
    return conversationRef.id;
  },

  async findPrivateConversation(memberIds: string[]): Promise<Conversation | null> {
    if (memberIds.length !== 2) return null;

    const q = query(
      collection(db, 'groupChats'),
      where('type', '==', 'private'),
      where('members', 'array-contains', memberIds[0])
    );

    const snapshot = await getDocs(q);
    const conv = snapshot.docs.find(
      (doc) =>
        doc.data().members.length === 2 &&
        doc.data().members.includes(memberIds[1])
    );

    if (conv) {
      return { id: conv.id, ...conv.data() } as Conversation;
    }

    return null;
  },

  async getConversations(): Promise<Conversation[]> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const communityRef = doc(db, 'groupChats', 'publicRoom');
    const communityDoc = await getDoc(communityRef);
    const conversations: Conversation[] = [];

    if (communityDoc.exists()) {
      conversations.push({ id: communityDoc.id, ...communityDoc.data() } as Conversation);
    }

    const q = query(
      collection(db, 'groupChats'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const userConversations = snapshot.docs
      .filter(doc => doc.id !== 'publicRoom')
      .map((doc) => ({ id: doc.id, ...doc.data() } as Conversation));

    conversations.push(...userConversations);

    return conversations.sort((a, b) => {
      if (a.id === 'publicRoom') return -1;
      if (b.id === 'publicRoom') return 1;
      const aTime = a.lastMessage?.createdAt?.toMillis() || a.createdAt?.toMillis() || 0;
      const bTime = b.lastMessage?.createdAt?.toMillis() || b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });
  },

  subscribeToConversations(callback: (conversations: Conversation[]) => void) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const communityRef = doc(db, 'groupChats', 'publicRoom');
    const unsubscribeCommunity = onSnapshot(communityRef, async () => {
      const q = query(
        collection(db, 'groupChats'),
        where('members', 'array-contains', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const userConversations = snapshot.docs
        .filter(doc => doc.id !== 'publicRoom')
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Conversation));

      const communityDoc = await getDoc(communityRef);
      const conversations: Conversation[] = [];

      if (communityDoc.exists()) {
        conversations.push({ id: communityDoc.id, ...communityDoc.data() } as Conversation);
      }

      conversations.push(...userConversations);

      const sorted = conversations.sort((a, b) => {
        if (a.id === 'publicRoom') return -1;
        if (b.id === 'publicRoom') return 1;
        const aTime = a.lastMessage?.createdAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const bTime = b.lastMessage?.createdAt?.toMillis() || b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      callback(sorted);
    });

    const q = query(
      collection(db, 'groupChats'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeUser = onSnapshot(q, async (snapshot) => {
      const userConversations = snapshot.docs
        .filter(doc => doc.id !== 'publicRoom')
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Conversation));

      const communityDoc = await getDoc(communityRef);
      const conversations: Conversation[] = [];

      if (communityDoc.exists()) {
        conversations.push({ id: communityDoc.id, ...communityDoc.data() } as Conversation);
      }

      conversations.push(...userConversations);

      const sorted = conversations.sort((a, b) => {
        if (a.id === 'publicRoom') return -1;
        if (b.id === 'publicRoom') return 1;
        const aTime = a.lastMessage?.createdAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const bTime = b.lastMessage?.createdAt?.toMillis() || b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

      callback(sorted);
    });

    return () => {
      unsubscribeCommunity();
      unsubscribeUser();
    };
  },

  async sendMessage(
    conversationId: string,
    content: string,
    contentType: 'text' | 'image' | 'file' = 'text',
    attachmentFile?: File,
    replyTo?: string
  ): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const userDoc = await getDoc(doc(db, 'users', userId));
    const userName = userDoc.data()?.name || 'Unknown User';

    const postingCheck = await reputationService.checkPostingAllowed(userId);
    if (!postingCheck.allowed) {
      throw new Error(postingCheck.reason || 'Messaging not allowed');
    }

    if (content.trim()) {
      const moderationResult = await aiModerationService.moderateContent(
        userId,
        userName,
        content,
        'chat'
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
    }

    const messageRef = doc(collection(db, 'groupChats', conversationId, 'messages'));
    let attachmentUrl: string | null = null;
    let attachmentRef: string | null = null;
    let attachmentMetadata: any = null;

    if (attachmentFile && attachmentFile.type.startsWith('image/')) {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          attachmentUrl = reader.result as string;
          attachmentRef = `base64:${messageRef.id}`;
          attachmentMetadata = {
            name: attachmentFile.name,
            size: attachmentFile.size,
            type: attachmentFile.type,
          };
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(attachmentFile);
      });

      try {
        const awardAttachment = httpsCallable(functions, 'awardAttachmentUpload');
        await awardAttachment({ conversationId });
      } catch (error) {
        console.warn('Failed to award attachment points:', error);
      }
    }

    const messageData: Message = {
      messageId: messageRef.id,
      senderId: userId,
      senderName: userName,
      content,
      contentType,
      attachmentRef,
      attachmentUrl,
      attachmentMetadata,
      createdAt: Timestamp.now(),
      deleted: false,
      reactions: {},
      likesCount: 0,
      readBy: { [userId]: Timestamp.now() },
      replyTo: replyTo || null,
    };

    await setDoc(messageRef, messageData);

    const conversationRef = doc(db, 'groupChats', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        text: content,
        senderId: userId,
        createdAt: Timestamp.now(),
      },
    });

    // try {
    //   const awardMessage = httpsCallable(functions, 'awardMessageSent');
    //   await awardMessage({ conversationId });
    // } catch (error) {
    //   console.warn('Failed to award message points:', error);
    // }

    return messageRef.id;
  },

  async getMessages(
    conversationId: string,
    pageSize: number = PAGE_SIZE,
    lastDoc?: DocumentSnapshot
  ): Promise<{ messages: Message[]; lastDoc: DocumentSnapshot | null }> {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)];

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(
      collection(db, 'groupChats', conversationId, 'messages'),
      ...constraints
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map((doc) => doc.data() as Message);

    return {
      messages: messages.reverse(),
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    };
  },

  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void,
    onError?: (error: Error) => void,
    limitCount: number = 50
  ) {
    const q = query(
      collection(db, 'groupChats', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => doc.data() as Message);
        callback(messages.reverse());
      },
      (error) => {
        console.error('Snapshot error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
  },

  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const messageRef = doc(db, 'groupChats', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      [`readBy.${userId}`]: Timestamp.now(),
    });
  },

  async addReaction(
    conversationId: string,
    messageId: string,
    emoji: string,
    recipientId: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const messageRef = doc(db, 'groupChats', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    const messageData = messageDoc.data();

    if (!messageData) throw new Error('Message not found');

    const reactions = messageData.reactions || {};
    const emojiReactions = reactions[emoji] || [];

    if (!emojiReactions.includes(userId)) {
      emojiReactions.push(userId);
      reactions[emoji] = emojiReactions;

      await updateDoc(messageRef, { reactions });

      if (recipientId !== userId) {
        try {
          const awardReaction = httpsCallable(functions, 'awardEmojiReaction');
          await awardReaction({ messageId, conversationId, recipientId, emoji });
        } catch (error) {
          console.warn('Failed to award reaction points:', error);
        }
      }
    }
  },

  async removeReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const messageRef = doc(db, 'groupChats', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    const messageData = messageDoc.data();

    if (!messageData) throw new Error('Message not found');

    const reactions = messageData.reactions || {};
    const emojiReactions = reactions[emoji] || [];

    const updatedReactions = emojiReactions.filter((id: string) => id !== userId);

    if (updatedReactions.length > 0) {
      reactions[emoji] = updatedReactions;
    } else {
      delete reactions[emoji];
    }

    await updateDoc(messageRef, { reactions });
  },

  async likeMessage(
    conversationId: string,
    messageId: string,
    recipientId: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const messageRef = doc(db, 'groupChats', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      likesCount: increment(1),
    });

    if (recipientId !== userId) {
      try {
        const awardLike = httpsCallable(functions, 'awardMessageLike');
        await awardLike({ messageId, conversationId, recipientId });
      } catch (error) {
        console.warn('Failed to award like points:', error);
      }
    }
  },

  async editMessage(
    conversationId: string,
    messageId: string,
    newContent: string
  ): Promise<void> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const messageRef = doc(db, 'groupChats', conversationId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) {
      throw new Error('Message not found');
    }

    const messageData = messageDoc.data();
    if (messageData.senderId !== userId) {
      throw new Error('Not authorized to edit this message');
    }

    await updateDoc(messageRef, {
      content: newContent,
      editedAt: Timestamp.now(),
    });
  },

  async reportMessage(
    conversationId: string,
    messageId: string,
    reason: string
  ): Promise<void> {
    const reportFunc = httpsCallable(functions, 'reportMessage');
    await reportFunc({ conversationId, messageId, reason });
  },

  async deleteAttachment(attachmentPath: string): Promise<void> {
    const storageRef = ref(storage, attachmentPath);
    await deleteObject(storageRef);
  },
};
