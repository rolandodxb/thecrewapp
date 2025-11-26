import { db, auth } from '../lib/firebase';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { optimizedAIModerationService } from './optimizedAIModerationService';
import { reputationService } from './reputationService';
import type { Message } from './communityChatService';

export async function sendMessageOptimized(
  conversationId: string,
  content: string,
  contentType: 'text' | 'image' | 'file' = 'text',
  attachmentFile?: File,
  replyTo?: string
): Promise<string> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('Not authenticated');

  let userName = 'Unknown User';
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    userName = userDoc.data()?.name || 'Unknown User';
  } catch (error) {
    console.error('Error fetching user document:', error);
    throw new Error('Failed to fetch user data');
  }

  const postingCheck = await reputationService.checkPostingAllowed(userId);
  if (!postingCheck.allowed) {
    throw new Error(postingCheck.reason || 'Messaging not allowed');
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
  }

  const moderationResult = await optimizedAIModerationService.quickPreCheck(content.trim());

  const messageData: Message = {
    messageId: messageRef.id,
    senderId: userId,
    senderName: userName,
    content,
    contentType,
    timestamp: Timestamp.now(),
    replyTo: replyTo || null,
    attachmentUrl,
    attachmentRef,
    attachmentMetadata,
    reactions: {},
    editHistory: [],
    moderationStatus: moderationResult.safe ? 'pending_review' : 'rejected',
    moderationReason: moderationResult.safe ? undefined : moderationResult.reason,
  };

  await addDoc(collection(db, 'groupChats', conversationId, 'messages'), messageData);

  if (!moderationResult.safe) {
    window.dispatchEvent(new CustomEvent('showModerationWarning', {
      detail: { message: moderationResult.reason || 'Message contains inappropriate content' }
    }));
    return messageRef.id;
  }

  await optimizedAIModerationService.moderateContentAsync(
    userId,
    userName,
    content,
    'chat',
    messageRef.id
  );

  return messageRef.id;
}

export async function sendMessageWithFallback(
  conversationId: string,
  content: string,
  contentType: 'text' | 'image' | 'file' = 'text',
  attachmentFile?: File,
  replyTo?: string
): Promise<string> {
  try {
    return await sendMessageOptimized(conversationId, content, contentType, attachmentFile, replyTo);
  } catch (error) {
    console.error('Optimized send failed, message rejected:', error);
    throw error;
  }
}
