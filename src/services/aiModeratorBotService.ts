import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Timestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from './communityChatService';
import { aiModerationService } from './aiModerationService';

const AI_MODERATOR_ID = 'ai-moderator-bot';
const AI_MODERATOR_NAME = 'AI Moderator';

interface ModerationAction {
  conversationId: string;
  messageId: string;
  userId: string;
  userName: string;
  content: string;
  action: 'warn' | 'block' | 'allow';
  reason: string;
  timestamp: Timestamp;
}

export const aiModeratorBotService = {
  async sendModeratorMessage(
    conversationId: string,
    content: string,
    replyTo?: string
  ): Promise<void> {
    const messageRef = doc(collection(db, 'groupChats', conversationId, 'messages'));

    const messageData: Message = {
      messageId: messageRef.id,
      senderId: AI_MODERATOR_ID,
      senderName: AI_MODERATOR_NAME,
      content,
      contentType: 'system',
      createdAt: Timestamp.now(),
      deleted: false,
      reactions: {},
      likesCount: 0,
      readBy: {},
      replyTo: replyTo || null,
    };

    await setDoc(messageRef, messageData);
  },

  async monitorMessage(
    conversationId: string,
    message: Message
  ): Promise<void> {
    if (message.senderId === AI_MODERATOR_ID) return;
    if (message.contentType !== 'text') return;
    if (!message.content?.trim()) return;

    try {
      const moderationResult = await aiModerationService.moderateContent(
        message.senderId,
        message.senderName || 'Unknown User',
        message.content,
        'chat'
      );

      if (moderationResult.action === 'block') {
        await this.sendModeratorMessage(
          conversationId,
          `⚠️ **Content Violation Detected**\n\nUser: @${message.senderName}\n\nReason: ${moderationResult.reason}\n\nAction: Message blocked. Please review our community guidelines.`,
          message.messageId
        );

        await this.logModerationAction({
          conversationId,
          messageId: message.messageId,
          userId: message.senderId,
          userName: message.senderName || 'Unknown',
          content: message.content,
          action: 'block',
          reason: moderationResult.reason,
          timestamp: Timestamp.now(),
        });
      } else if (moderationResult.action === 'warn') {
        await this.sendModeratorMessage(
          conversationId,
          `⚠️ **Content Warning**\n\n@${message.senderName}, ${moderationResult.reason}\n\nPlease be mindful of our community standards.`,
          message.messageId
        );

        await this.logModerationAction({
          conversationId,
          messageId: message.messageId,
          userId: message.senderId,
          userName: message.senderName || 'Unknown',
          content: message.content,
          action: 'warn',
          reason: moderationResult.reason,
          timestamp: Timestamp.now(),
        });
      }

      if (moderationResult.confidence < 0.7 && moderationResult.flags.length > 0) {
        console.log('AI Moderator: Low confidence detection', {
          flags: moderationResult.flags,
          confidence: moderationResult.confidence,
        });
      }
    } catch (error) {
      console.error('AI Moderator error:', error);
    }
  },

  async logModerationAction(action: ModerationAction): Promise<void> {
    try {
      const logRef = doc(collection(db, 'moderation_logs'));
      await setDoc(logRef, action);
    } catch (error) {
      console.error('Failed to log moderation action:', error);
    }
  },

  subscribeToConversationForModeration(
    conversationId: string,
    onNewMessage: (message: Message) => void
  ): () => void {
    const lastCheckRef = { current: Date.now() };

    const q = query(
      collection(db, 'groupChats', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const message = change.doc.data() as Message;
          const messageTime = message.createdAt?.toMillis() || 0;

          if (messageTime > lastCheckRef.current - 5000) {
            onNewMessage(message);
          }
        }
      });

      lastCheckRef.current = Date.now();
    });
  },

  async getModerationHistory(
    userId?: string,
    conversationId?: string,
    limitCount: number = 50
  ): Promise<ModerationAction[]> {
    const constraints: any[] = [
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ];

    if (userId) {
      constraints.push(where('userId', '==', userId));
    }

    if (conversationId) {
      constraints.push(where('conversationId', '==', conversationId));
    }

    const q = query(collection(db, 'moderation_logs'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as ModerationAction);
  },

  async sendWelcomeMessage(conversationId: string, userName: string): Promise<void> {
    await this.sendModeratorMessage(
      conversationId,
      `👋 Welcome @${userName}! I'm the AI Moderator. I'm here to ensure everyone has a safe and respectful experience. Feel free to ask me about community guidelines anytime!`
    );
  },

  async handleHelpRequest(conversationId: string, messageId: string): Promise<void> {
    await this.sendModeratorMessage(
      conversationId,
      `📋 **Community Guidelines**\n\n` +
      `✅ Be respectful and kind to others\n` +
      `✅ No harassment, hate speech, or bullying\n` +
      `✅ No spam or self-promotion\n` +
      `✅ Keep conversations appropriate for all ages\n` +
      `✅ Respect privacy - no sharing personal information\n\n` +
      `For more information, contact an administrator.`,
      messageId
    );
  },
};
