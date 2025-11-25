import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  where,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { aiModerationService } from './aiModerationService';

export interface GroupMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'mentor' | 'governor';
  text: string;
  createdAt: Timestamp;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderRole: 'student' | 'mentor' | 'governor';
  text: string;
  createdAt: Timestamp;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  startedAt: Timestamp;
  lastUpdated: Timestamp;
  lastMessage?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'governor';
  country?: string;
  isOnline?: boolean;
  photoURL?: string;
  profilePicture?: string;
  photo_base64?: string;
}

export const sendGroupMessage = async (
  senderId: string,
  senderName: string,
  senderRole: 'student' | 'mentor' | 'governor',
  text: string
): Promise<void> => {
  const moderationResult = await aiModerationService.moderateContent(
    senderId,
    senderName,
    text,
    'chat'
  );

  if (!moderationResult.allowed) {
    throw new Error(moderationResult.reason);
  }

  const messagesRef = collection(db, 'groupChats', 'publicRoom', 'messages');
  await addDoc(messagesRef, {
    senderId,
    senderName,
    senderRole,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
};

export const subscribeToGroupMessages = (
  callback: (messages: GroupMessage[]) => void
): (() => void) => {
  const messagesRef = collection(db, 'groupChats', 'publicRoom', 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: GroupMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as GroupMessage);
    });
    callback(messages);
  });

  return unsubscribe;
};

export const getOrCreateConversation = async (
  currentUserId: string,
  currentUserName: string,
  currentUserRole: string,
  targetUserId: string,
  targetUserName: string,
  targetUserRole: string
): Promise<string> => {
  const conversationsRef = collection(db, 'conversations');

  const q1 = query(
    conversationsRef,
    where('participants', 'array-contains', currentUserId)
  );

  const snapshot = await getDocs(q1);
  let existingConversation: string | null = null;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.participants.includes(targetUserId)) {
      existingConversation = doc.id;
    }
  });

  if (existingConversation) {
    return existingConversation;
  }

  const conversationId = [currentUserId, targetUserId].sort().join('_');
  const conversationRef = doc(db, 'conversations', conversationId);

  await setDoc(conversationRef, {
    participants: [currentUserId, targetUserId],
    participantNames: {
      [currentUserId]: currentUserName,
      [targetUserId]: targetUserName,
    },
    participantRoles: {
      [currentUserId]: currentUserRole,
      [targetUserId]: targetUserRole,
    },
    startedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
    lastMessage: '',
  });

  return conversationId;
};

export const sendPrivateMessage = async (
  conversationId: string,
  senderId: string,
  senderRole: 'student' | 'mentor' | 'governor',
  text: string,
  senderName?: string
): Promise<void> => {
  if (senderName) {
    const moderationResult = await aiModerationService.moderateContent(
      senderId,
      senderName,
      text,
      'chat'
    );

    if (!moderationResult.allowed) {
      throw new Error(moderationResult.reason);
    }
  }

  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );

  await addDoc(messagesRef, {
    senderId,
    senderRole,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });

  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    lastUpdated: serverTimestamp(),
    lastMessage: text.trim().substring(0, 50),
  });
};

export const subscribeToPrivateMessages = (
  conversationId: string,
  callback: (messages: PrivateMessage[]) => void
): (() => void) => {
  const messagesRef = collection(
    db,
    'conversations',
    conversationId,
    'messages'
  );
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: PrivateMessage[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as PrivateMessage);
    });
    callback(messages);
  });

  return unsubscribe;
};

export const subscribeToUserConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastUpdated', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() } as Conversation);
    });
    callback(conversations);
  });

  return unsubscribe;
};

export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  const users: User[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    users.push({
      uid: doc.id,
      name: data.name || data.displayName || 'Unknown User',
      email: data.email,
      role: data.role || 'student',
      country: data.country,
      isOnline: data.isOnline || false,
      photoURL: data.photoURL || '',
      profilePicture: data.profilePicture || '',
      photo_base64: data.photo_base64 || '',
    });
  });

  return users;
};
