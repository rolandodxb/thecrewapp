import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { aiModerationService } from './aiModerationService';

export interface UserReputation {
  userId: string;
  userName: string;
  score: number;
  tier: 'novice' | 'trusted' | 'veteran' | 'elite' | 'legendary';
  lastCalculated: Timestamp;
  metrics: {
    helpfulPosts: number;
    totalPosts: number;
    violations: number;
    warnings: number;
    consistency: number;
    engagement: number;
    marketplaceRating: number;
  };
  perks: {
    fastPosting: boolean;
    highlightBadge: boolean;
    visibilityBoost: boolean;
    prioritySupport: boolean;
  };
  restrictions: {
    cooldownUntil: Timestamp | null;
    postingLimited: boolean;
    maxPostsPerHour: number;
  };
  history: Array<{
    date: Timestamp;
    score: number;
    reason: string;
  }>;
  visibilityPublic: boolean;
  manualOverride: {
    active: boolean;
    by: string | null;
    reason: string | null;
    date: Timestamp | null;
  };
}

export const reputationService = {
  async initializeReputation(userId: string, userName: string): Promise<void> {
    const reputationRef = doc(db, 'user_reputation', userId);
    const existingDoc = await getDoc(reputationRef);

    if (!existingDoc.exists()) {
      const initialReputation: UserReputation = {
        userId,
        userName,
        score: 50,
        tier: 'novice',
        lastCalculated: Timestamp.now(),
        metrics: {
          helpfulPosts: 0,
          totalPosts: 0,
          violations: 0,
          warnings: 0,
          consistency: 0,
          engagement: 0,
          marketplaceRating: 0
        },
        perks: {
          fastPosting: false,
          highlightBadge: false,
          visibilityBoost: false,
          prioritySupport: false
        },
        restrictions: {
          cooldownUntil: null,
          postingLimited: false,
          maxPostsPerHour: 10
        },
        history: [],
        visibilityPublic: true,
        manualOverride: {
          active: false,
          by: null,
          reason: null,
          date: null
        }
      };

      await setDoc(reputationRef, initialReputation);
    }
  },

  async getReputation(userId: string): Promise<UserReputation | null> {
    const reputationRef = doc(db, 'user_reputation', userId);
    const snapshot = await getDoc(reputationRef);

    if (snapshot.exists()) {
      return snapshot.data() as UserReputation;
    }

    return null;
  },

  async calculateUserScore(userId: string): Promise<number> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return 50;

    const userName = userDoc.data().name || 'Unknown';
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoTimestamp = Timestamp.fromDate(weekAgo);

    const postsQuery = query(
      collection(db, 'community_posts'),
      where('userId', '==', userId),
      where('createdAt', '>=', weekAgoTimestamp)
    );
    const postsSnapshot = await getDocs(postsQuery);
    const totalPosts = postsSnapshot.size;

    let helpfulPosts = 0;
    postsSnapshot.forEach((doc) => {
      const post = doc.data();
      if ((post.likes || 0) >= 5 || (post.commentsCount || 0) >= 3) {
        helpfulPosts++;
      }
    });

    const moderationLogsQuery = query(
      collection(db, 'moderation_logs'),
      where('userId', '==', userId),
      where('timestamp', '>=', weekAgoTimestamp)
    );
    const moderationSnapshot = await getDocs(moderationLogsQuery);

    let violations = 0;
    let warnings = 0;

    moderationSnapshot.forEach((doc) => {
      const log = doc.data();
      if (log.action === 'block' || log.action === 'ban') {
        violations++;
      } else if (log.action === 'warn') {
        warnings++;
      }
    });

    const messagesQuery = query(
      collection(db, 'groupChats', 'publicRoom', 'messages'),
      where('senderId', '==', userId),
      where('createdAt', '>=', weekAgoTimestamp)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    const messageCount = messagesSnapshot.size;

    const marketplaceProductsQuery = query(
      collection(db, 'marketplace_products'),
      where('sellerId', '==', userId)
    );
    const productsSnapshot = await getDocs(marketplaceProductsQuery);

    let totalRatings = 0;
    let ratingSum = 0;
    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      if (product.rating && product.ratingCount) {
        ratingSum += product.rating * product.ratingCount;
        totalRatings += product.ratingCount;
      }
    });

    const marketplaceRating = totalRatings > 0 ? ratingSum / totalRatings : 0;

    const consistency = totalPosts >= 3 ? Math.min(totalPosts / 7 * 10, 15) : 0;
    const engagement = Math.min((messageCount + totalPosts) / 20 * 15, 20);

    let score = 50;

    score += helpfulPosts * 3;
    score += consistency;
    score += engagement;
    score += marketplaceRating * 5;
    score -= violations * 15;
    score -= warnings * 5;

    score = Math.max(0, Math.min(100, score));

    const reputationRef = doc(db, 'user_reputation', userId);
    const currentRep = await getDoc(reputationRef);

    if (!currentRep.exists()) {
      await this.initializeReputation(userId, userName);
    }

    const tier = this.calculateTier(score);
    const perks = this.calculatePerks(score);
    const restrictions = this.calculateRestrictions(score);

    await updateDoc(reputationRef, {
      score,
      tier,
      perks,
      restrictions,
      'metrics.helpfulPosts': helpfulPosts,
      'metrics.totalPosts': totalPosts,
      'metrics.violations': violations,
      'metrics.warnings': warnings,
      'metrics.consistency': consistency,
      'metrics.engagement': engagement,
      'metrics.marketplaceRating': marketplaceRating,
      lastCalculated: Timestamp.now()
    });

    return score;
  },

  calculateTier(score: number): UserReputation['tier'] {
    if (score >= 90) return 'legendary';
    if (score >= 75) return 'elite';
    if (score >= 60) return 'veteran';
    if (score >= 40) return 'trusted';
    return 'novice';
  },

  calculatePerks(score: number): UserReputation['perks'] {
    return {
      fastPosting: score >= 60,
      highlightBadge: score >= 75,
      visibilityBoost: score >= 75,
      prioritySupport: score >= 90
    };
  },

  calculateRestrictions(score: number): UserReputation['restrictions'] {
    if (score < 20) {
      return {
        cooldownUntil: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        postingLimited: true,
        maxPostsPerHour: 2
      };
    } else if (score < 40) {
      return {
        cooldownUntil: null,
        postingLimited: true,
        maxPostsPerHour: 5
      };
    } else {
      return {
        cooldownUntil: null,
        postingLimited: false,
        maxPostsPerHour: score >= 75 ? 50 : 20
      };
    }
  },

  async checkPostingAllowed(userId: string): Promise<{ allowed: boolean; reason?: string; waitTime?: number }> {
    const reputation = await this.getReputation(userId);
    if (!reputation) {
      return { allowed: true };
    }

    if (reputation.restrictions.cooldownUntil) {
      const now = Date.now();
      const cooldownEnd = reputation.restrictions.cooldownUntil.toMillis();

      if (now < cooldownEnd) {
        return {
          allowed: false,
          reason: 'Your account is in cooldown mode due to low reputation score.',
          waitTime: Math.ceil((cooldownEnd - now) / 1000 / 60)
        };
      }
    }

    if (reputation.restrictions.postingLimited) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentPostsQuery = query(
        collection(db, 'community_posts'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(oneHourAgo))
      );
      const recentPosts = await getDocs(recentPostsQuery);

      if (recentPosts.size >= reputation.restrictions.maxPostsPerHour) {
        return {
          allowed: false,
          reason: `You've reached your posting limit of ${reputation.restrictions.maxPostsPerHour} posts per hour. Improve your reputation to post more frequently.`,
          waitTime: 60
        };
      }
    }

    return { allowed: true };
  },

  async manualOverride(
    userId: string,
    newScore: number,
    overrideBy: string,
    reason: string
  ): Promise<void> {
    const reputationRef = doc(db, 'user_reputation', userId);
    const reputation = await getDoc(reputationRef);

    if (!reputation.exists()) {
      throw new Error('User reputation not found');
    }

    const currentData = reputation.data() as UserReputation;
    const tier = this.calculateTier(newScore);
    const perks = this.calculatePerks(newScore);
    const restrictions = this.calculateRestrictions(newScore);

    const historyEntry = {
      date: Timestamp.now(),
      score: newScore,
      reason: `Manual override by admin: ${reason}`
    };

    await updateDoc(reputationRef, {
      score: newScore,
      tier,
      perks,
      restrictions,
      'manualOverride.active': true,
      'manualOverride.by': overrideBy,
      'manualOverride.reason': reason,
      'manualOverride.date': Timestamp.now(),
      history: [...(currentData.history || []), historyEntry].slice(-10)
    });
  },

  async toggleVisibility(userId: string, isPublic: boolean): Promise<void> {
    const reputationRef = doc(db, 'user_reputation', userId);
    await updateDoc(reputationRef, {
      visibilityPublic: isPublic
    });
  },

  async getAllReputations(): Promise<UserReputation[]> {
    const reputationsQuery = query(
      collection(db, 'user_reputation'),
      orderBy('score', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(reputationsQuery);
    return snapshot.docs.map(doc => doc.data() as UserReputation);
  },

  async recalculateAllScores(): Promise<void> {
    const usersQuery = query(collection(db, 'users'));
    const usersSnapshot = await getDocs(usersQuery);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.data().uid;
      try {
        await this.calculateUserScore(userId);
        console.log(`Updated reputation for user ${userId}`);
      } catch (error) {
        console.error(`Failed to update reputation for user ${userId}:`, error);
      }
    }
  }
};
