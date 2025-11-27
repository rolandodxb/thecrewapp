import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  arrayUnion,
  addDoc
} from 'firebase/firestore';

export interface MarketplaceMessage {
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  message: string;
  timestamp: any;
  messageType: 'text' | 'image' | 'file';
  read: boolean;
}

export interface MarketplaceConversation {
  id: string;
  conversationId: string;
  createdBy: string;
  createdByName: string;
  createdAt: any;
  productId: string;
  productTitle: string;
  productImage?: string;
  participants: string[];
  participantNames: {
    [userId: string]: string;
  };
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: {
    [userId: string]: number;
  };
  messages: MarketplaceMessage[];
}

export const createConversation = async (
  buyerId: string,
  buyerName: string,
  sellerId: string,
  sellerName: string,
  productId: string,
  productTitle: string,
  productImage?: string
): Promise<string> => {
  try {
    // Check if conversation already exists
    const existingConv = await getExistingConversation(buyerId, sellerId, productId);
    if (existingConv) {
      return existingConv.id;
    }

    const conversationRef = doc(collection(db, 'marketplace_messages'));
    const conversationId = `${productId}_${buyerId}_${sellerId}`;

    const conversation: Omit<MarketplaceConversation, 'id'> = {
      conversationId,
      createdBy: buyerId,
      createdByName: buyerName,
      createdAt: Timestamp.now(),
      productId,
      productTitle,
      productImage,
      participants: [buyerId, sellerId],
      participantNames: {
        [buyerId]: buyerName,
        [sellerId]: sellerName,
      },
      lastMessage: '',
      lastMessageTimestamp: Timestamp.now(),
      unreadCount: {
        [buyerId]: 0,
        [sellerId]: 0,
      },
      messages: [],
    };

    await setDoc(conversationRef, conversation);

    // Also save to conversations collection for retrieval from community chat
    const communityConvRef = doc(collection(db, 'conversations'));
    await setDoc(communityConvRef, {
      conversationType: 'marketplace',
      productId,
      productTitle,
      productImage,
      members: [buyerId, sellerId],
      memberNames: {
        [buyerId]: buyerName,
        [sellerId]: sellerName,
      },
      lastMessage: '',
      lastMessageAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      marketplaceConversationId: conversationRef.id,
    });

    console.log('Conversation created:', conversationRef.id);
    return conversationRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

const getExistingConversation = async (
  buyerId: string,
  sellerId: string,
  productId: string
): Promise<MarketplaceConversation | null> => {
  try {
    const conversationsRef = collection(db, 'marketplace_messages');
    const q = query(
      conversationsRef,
      where('productId', '==', productId),
      where('participants', 'array-contains', buyerId)
    );

    const snapshot = await getDocs(q);
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.participants.includes(sellerId)) {
        return { id: doc.id, ...data } as MarketplaceConversation;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting existing conversation:', error);
    return null;
  }
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  message: string,
  messageType: 'text' | 'image' | 'file' = 'text'
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'marketplace_messages', conversationId);

    const newMessage: MarketplaceMessage = {
      senderId,
      senderName,
      receiverId,
      receiverName,
      message,
      timestamp: Timestamp.now(),
      messageType,
      read: false,
    };

    await updateDoc(conversationRef, {
      messages: arrayUnion(newMessage),
      lastMessage: message,
      lastMessageTimestamp: Timestamp.now(),
      [`unreadCount.${receiverId}`]: (await getUnreadCount(conversationId, receiverId)) + 1,
    });

    console.log('Message sent in conversation:', conversationId);
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

const getUnreadCount = async (conversationId: string, userId: string): Promise<number> => {
  try {
    const conversationRef = doc(db, 'marketplace_messages', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      const data = conversationSnap.data();
      return data.unreadCount?.[userId] || 0;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'marketplace_messages', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

export const getConversation = async (
  conversationId: string
): Promise<MarketplaceConversation | null> => {
  try {
    const conversationRef = doc(db, 'marketplace_messages', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      return { id: conversationSnap.id, ...conversationSnap.data() } as MarketplaceConversation;
    }
    return null;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
  }
};

export const getUserConversations = async (userId: string): Promise<MarketplaceConversation[]> => {
  try {
    const conversationsRef = collection(db, 'marketplace_messages');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MarketplaceConversation[];
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return [];
  }
};

export const subscribeToConversation = (
  conversationId: string,
  callback: (conversation: MarketplaceConversation | null) => void
): (() => void) => {
  const conversationRef = doc(db, 'marketplace_messages', conversationId);

  return onSnapshot(conversationRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as MarketplaceConversation);
    } else {
      callback(null);
    }
  });
};

export const subscribeToUserConversations = (
  userId: string,
  callback: (conversations: MarketplaceConversation[]) => void
): (() => void) => {
  const conversationsRef = collection(db, 'marketplace_messages');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MarketplaceConversation[];
    callback(conversations);
  });
};

export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  try {
    const conversations = await getUserConversations(userId);
    return conversations.reduce((total, conv) => {
      return total + (conv.unreadCount?.[userId] || 0);
    }, 0);
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};
