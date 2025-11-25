import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  Timestamp,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

export interface EnhancedMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  reactions: MessageReaction[];
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  edited: boolean;
  editedAt?: Timestamp;
  deleted: boolean;
  deletedAt?: Timestamp;
  replyTo?: string;
  createdAt: Timestamp;
  seenBy: string[];
}

export interface MessageReaction {
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Timestamp;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: Timestamp;
}

export interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Timestamp;
  currentConversation?: string;
}

const messagesCollection = 'enhancedMessages';
const typingCollection = 'typingIndicators';
const presenceCollection = 'userPresence';

export async function sendEnhancedMessage(message: Omit<EnhancedMessage, 'id' | 'createdAt' | 'reactions' | 'seenBy'>) {
  const docRef = await addDoc(collection(db, messagesCollection), {
    ...message,
    reactions: [],
    seenBy: [message.senderId],
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function sendFileMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  file: File,
  type: 'file' | 'image' | 'video'
) {
  const filePath = `chat/${conversationId}/${Date.now()}_${file.name}`;
  const fileRef = ref(storage, filePath);

  await uploadBytes(fileRef, file);
  const fileUrl = await getDownloadURL(fileRef);

  return await sendEnhancedMessage({
    conversationId,
    senderId,
    senderName,
    content: `Shared a ${type}`,
    type,
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
    status: 'sent',
    edited: false,
    deleted: false,
  });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: EnhancedMessage[]) => void
) {
  const q = query(
    collection(db, messagesCollection),
    where('conversationId', '==', conversationId),
    where('deleted', '==', false),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EnhancedMessage[];

    callback(messages.reverse());
  });
}

export async function editMessage(messageId: string, newContent: string) {
  const docRef = doc(db, messagesCollection, messageId);
  await updateDoc(docRef, {
    content: newContent,
    edited: true,
    editedAt: Timestamp.now(),
  });
}

export async function deleteMessage(messageId: string) {
  const docRef = doc(db, messagesCollection, messageId);
  await updateDoc(docRef, {
    deleted: true,
    deletedAt: Timestamp.now(),
    content: 'This message was deleted',
  });
}

export async function addReaction(messageId: string, userId: string, userName: string, emoji: string) {
  const docRef = doc(db, messagesCollection, messageId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const message = docSnap.data() as EnhancedMessage;
    const reactions = message.reactions || [];

    const existingReactionIndex = reactions.findIndex(
      (r) => r.userId === userId && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      reactions.splice(existingReactionIndex, 1);
    } else {
      reactions.push({
        userId,
        userName,
        emoji,
        createdAt: Timestamp.now(),
      });
    }

    await updateDoc(docRef, { reactions });
  }
}

export async function setTypingIndicator(
  conversationId: string,
  userId: string,
  userName: string,
  isTyping: boolean
) {
  const docRef = doc(db, typingCollection, `${conversationId}_${userId}`);

  if (isTyping) {
    await setDoc(docRef, {
      conversationId,
      userId,
      userName,
      timestamp: Timestamp.now(),
    });
  } else {
    await deleteDoc(docRef);
  }
}

export function subscribeToTypingIndicators(
  conversationId: string,
  currentUserId: string,
  callback: (typingUsers: TypingIndicator[]) => void
) {
  const q = query(
    collection(db, typingCollection),
    where('conversationId', '==', conversationId)
  );

  return onSnapshot(q, (snapshot) => {
    const now = Timestamp.now();
    const typingUsers = snapshot.docs
      .map((doc) => doc.data() as TypingIndicator)
      .filter((indicator) => {
        const timeDiff = now.seconds - indicator.timestamp.seconds;
        return indicator.userId !== currentUserId && timeDiff < 5;
      });

    callback(typingUsers);
  });
}

export async function setUserPresence(userId: string, status: 'online' | 'offline' | 'away', currentConversation?: string) {
  const docRef = doc(db, presenceCollection, userId);
  await setDoc(docRef, {
    userId,
    status,
    lastSeen: Timestamp.now(),
    currentConversation: currentConversation || null,
  });
}

export function subscribeToUserPresence(
  userIds: string[],
  callback: (presence: Record<string, UserPresence>) => void
) {
  if (userIds.length === 0) {
    callback({});
    return () => {};
  }

  const q = query(
    collection(db, presenceCollection),
    where('userId', 'in', userIds.slice(0, 10))
  );

  return onSnapshot(q, (snapshot) => {
    const presenceMap: Record<string, UserPresence> = {};
    snapshot.docs.forEach((doc) => {
      const presence = doc.data() as UserPresence;
      presenceMap[presence.userId] = presence;
    });

    callback(presenceMap);
  });
}

export async function markMessageAsSeen(messageId: string, userId: string) {
  const docRef = doc(db, messagesCollection, messageId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const message = docSnap.data() as EnhancedMessage;
    const seenBy = message.seenBy || [];

    if (!seenBy.includes(userId)) {
      seenBy.push(userId);
      await updateDoc(docRef, { seenBy, status: 'seen' });
    }
  }
}

export async function markConversationAsSeen(conversationId: string, userId: string) {
  const q = query(
    collection(db, messagesCollection),
    where('conversationId', '==', conversationId),
    where('senderId', '!=', userId)
  );

  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((document) => {
    const message = document.data() as EnhancedMessage;
    const seenBy = message.seenBy || [];

    if (!seenBy.includes(userId)) {
      seenBy.push(userId);
      batch.update(document.ref, { seenBy, status: 'seen' });
    }
  });

  await batch.commit();
}
