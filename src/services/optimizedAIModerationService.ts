import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { openaiClient } from '../utils/openaiClient';
import type {
  ModerationCategory,
  ModerationSeverity,
  ModerationAction,
  ModerationResult,
} from './aiModerationService';

export interface ModerationQueueItem {
  id?: string;
  userId: string;
  userName: string;
  contentType: 'post' | 'comment' | 'chat' | 'marketplace' | 'profile';
  contentId: string;
  content: string;
  timestamp: Timestamp;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  result?: ModerationResult;
  processedAt?: Timestamp;
  retryCount: number;
}

class OptimizedAIModerationService {
  private batchSize = 10;
  private processingInterval: NodeJS.Timeout | null = null;
  private badWords = [
    'spam', 'scam', 'fake', 'fraud', 'phishing',
    'fuck', 'fucking', 'shit', 'bitch', 'asshole',
    'damn', 'cunt', 'dick', 'bastard'
  ];

  async quickPreCheck(content: string): Promise<{ safe: boolean; reason?: string }> {
    const lowerContent = content.toLowerCase();

    for (const word of this.badWords) {
      if (lowerContent.includes(word)) {
        return {
          safe: false,
          reason: `Contains inappropriate language`
        };
      }
    }

    if (content.length > 5000) {
      return { safe: false, reason: 'Content too long' };
    }

    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 5) {
      return { safe: false, reason: 'Too many URLs' };
    }

    return { safe: true };
  }

  async queueForModeration(
    userId: string,
    userName: string,
    content: string,
    contentType: 'post' | 'comment' | 'chat' | 'marketplace' | 'profile',
    contentId: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    try {
      const queueItem: Omit<ModerationQueueItem, 'id'> = {
        userId,
        userName,
        contentType,
        contentId,
        content,
        timestamp: Timestamp.now(),
        status: 'pending',
        priority,
        retryCount: 0,
      };

      const docRef = await addDoc(collection(db, 'moderationQueue'), queueItem);
      return docRef.id;
    } catch (error) {
      console.error('Error queuing moderation:', error);
      throw error;
    }
  }

  async moderateContentAsync(
    userId: string,
    userName: string,
    content: string,
    contentType: 'post' | 'comment' | 'chat' | 'marketplace' | 'profile',
    contentId: string
  ): Promise<{ queueId: string; preCheckPassed: boolean }> {
    const preCheck = await this.quickPreCheck(content);

    if (!preCheck.safe) {
      const queueId = await this.queueForModeration(
        userId,
        userName,
        content,
        contentType,
        contentId,
        'high'
      );

      await updateDoc(doc(db, 'moderationQueue', queueId), {
        status: 'rejected',
        result: {
          allowed: false,
          severity: 'HIGH',
          categories: ['spam'],
          action: 'block',
          reason: preCheck.reason,
          confidence: 1.0,
        } as ModerationResult,
        processedAt: Timestamp.now(),
      });

      return { queueId, preCheckPassed: false };
    }

    const queueId = await this.queueForModeration(
      userId,
      userName,
      content,
      contentType,
      contentId,
      'low'
    );

    return { queueId, preCheckPassed: true };
  }

  async processBatch(): Promise<void> {
    try {
      const q = query(
        collection(db, 'moderationQueue'),
        where('status', '==', 'pending'),
        orderBy('priority', 'desc'),
        orderBy('timestamp', 'asc'),
        firestoreLimit(this.batchSize)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      const items: ModerationQueueItem[] = [];

      snapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as ModerationQueueItem;
        items.push(item);
        batch.update(doc.ref, { status: 'processing' });
      });

      await batch.commit();

      const contentTexts = items.map(item => item.content);
      const results = await this.batchAnalyzeWithAI(contentTexts);

      const updateBatch = writeBatch(db);
      items.forEach((item, index) => {
        const result = results[index];
        if (item.id) {
          updateBatch.update(doc(db, 'moderationQueue', item.id), {
            status: result.allowed ? 'approved' : 'rejected',
            result,
            processedAt: Timestamp.now(),
          });

          if (!result.allowed || result.action !== 'allow') {
            updateBatch.update(doc(db, item.contentType === 'chat' ? 'groupChats' : 'communityPosts', item.contentId), {
              moderationStatus: result.allowed ? 'approved' : 'hidden',
              moderationReason: result.reason,
            });
          }
        }
      });

      await updateBatch.commit();
    } catch (error) {
      console.error('Error processing moderation batch:', error);
    }
  }

  private async batchAnalyzeWithAI(contents: string[]): Promise<ModerationResult[]> {
    try {
      const batchPrompt = `Analyze the following ${contents.length} pieces of content for moderation. Respond with ONLY a valid JSON array, no markdown.

Contents:
${contents.map((c, i) => `[${i}]: "${c}"`).join('\n')}

For each content, evaluate for: spam, harassment, scams, fraud, off-topic, explicit content, hate speech, violence, self-harm.

Respond with ONLY a JSON array (no code blocks):
[
  {
    "allowed": true,
    "categories": [],
    "severity": "LOW",
    "confidence": 0.9,
    "action": "allow",
    "reason": "Content is appropriate"
  }
]

severity: LOW, MEDIUM, HIGH, or CRITICAL
action: allow, warn, block, ban
confidence: 0.0 to 1.0`;

      const response = await openaiClient.sendMessage(
        [{ role: 'user', content: batchPrompt }],
        'system-moderation'
      );

      let cleanedReply = response.reply || '[]';
      cleanedReply = cleanedReply
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const results = JSON.parse(cleanedReply);

      return Array.isArray(results)
        ? results.map(r => this.normalizeResult(r))
        : contents.map(() => this.getDefaultSafeResult());

    } catch (error) {
      console.error('Batch AI analysis failed:', error);
      return contents.map(() => this.getDefaultSafeResult());
    }
  }

  private normalizeResult(raw: any): ModerationResult {
    const validSeverities: ModerationSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const validActions: ModerationAction[] = ['allow', 'warn', 'block', 'ban', 'escalate'];

    return {
      allowed: raw.allowed !== false,
      severity: validSeverities.includes(raw.severity) ? raw.severity : 'LOW',
      categories: Array.isArray(raw.categories) ? raw.categories : [],
      action: validActions.includes(raw.action) ? raw.action : 'allow',
      reason: raw.reason || 'No issues detected',
      confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
    };
  }

  private getDefaultSafeResult(): ModerationResult {
    return {
      allowed: true,
      severity: 'LOW',
      categories: [],
      action: 'allow',
      reason: 'Content approved (AI unavailable)',
      confidence: 0.5,
    };
  }

  startBatchProcessor(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processBatch();
    }, intervalMs);

    this.processBatch();
  }

  stopBatchProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

export const optimizedAIModerationService = new OptimizedAIModerationService();
