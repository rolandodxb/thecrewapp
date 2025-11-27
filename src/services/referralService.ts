import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  increment,
  Timestamp,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { walletService } from './walletService';

export interface Referral {
  id: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referralCode: string;
  createdAt: Timestamp;
  totalReferrals: number;
  totalEarnings: number;
  pointsEarned: number;
  status: 'active' | 'suspended';
}

export interface ReferralClick {
  id: string;
  referralCode: string;
  referrerId: string;
  ipAddress: string;
  deviceFingerprint: string;
  userAgent: string;
  timestamp: Timestamp;
  converted: boolean;
  convertedUserId?: string;
}

export interface ReferralConversion {
  id: string;
  referralCode: string;
  referrerId: string;
  referrerName: string;
  newUserId: string;
  newUserName: string;
  newUserEmail: string;
  ipAddress: string;
  deviceFingerprint: string;
  pointsAwarded: number;
  bonusAwarded: number;
  timestamp: Timestamp;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const REFERRAL_POINTS = 50;
const REFERRAL_BONUS = 10;

export const referralService = {
  generateReferralCode(userId: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${code}-${userId.substring(0, 4).toUpperCase()}`;
  },

  async createReferral(userId: string, userName: string, userEmail: string): Promise<string> {
    const referralRef = doc(db, 'referrals', userId);
    const existingReferral = await getDoc(referralRef);

    if (existingReferral.exists()) {
      return existingReferral.data().referralCode;
    }

    const referralCode = this.generateReferralCode(userId);

    const referralData: Referral = {
      id: userId,
      referrerId: userId,
      referrerName: userName,
      referrerEmail: userEmail,
      referralCode,
      createdAt: Timestamp.now(),
      totalReferrals: 0,
      totalEarnings: 0,
      pointsEarned: 0,
      status: 'active'
    };

    await setDoc(referralRef, referralData);
    return referralCode;
  },

  async getReferral(userId: string): Promise<Referral | null> {
    const referralRef = doc(db, 'referrals', userId);
    const snapshot = await getDoc(referralRef);

    if (snapshot.exists()) {
      return snapshot.data() as Referral;
    }

    return null;
  },

  async getReferralByCode(code: string): Promise<Referral | null> {
    const q = query(
      collection(db, 'referrals'),
      where('referralCode', '==', code),
      firestoreLimit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Referral;
    }

    return null;
  },

  async getDeviceFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
    }
    const canvasData = canvas.toDataURL();

    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    const fingerprintString = `${canvasData}-${screenInfo}-${timezone}-${language}-${platform}-${userAgent}`;

    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return hash.toString(16);
  },

  async trackClick(referralCode: string, ipAddress: string): Promise<void> {
    const referral = await this.getReferralByCode(referralCode);
    if (!referral) return;

    const deviceFingerprint = await this.getDeviceFingerprint();

    const existingClickQuery = query(
      collection(db, 'referral_clicks'),
      where('referralCode', '==', referralCode),
      where('deviceFingerprint', '==', deviceFingerprint),
      where('timestamp', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
    );
    const existingClicks = await getDocs(existingClickQuery);

    if (existingClicks.size >= 3) {
      console.warn('Suspicious activity: Multiple clicks from same device');
      return;
    }

    const clickRef = doc(collection(db, 'referral_clicks'));
    const clickData: ReferralClick = {
      id: clickRef.id,
      referralCode,
      referrerId: referral.referrerId,
      ipAddress,
      deviceFingerprint,
      userAgent: navigator.userAgent,
      timestamp: Timestamp.now(),
      converted: false
    };

    await setDoc(clickRef, clickData);
  },

  async checkFraudPrevention(
    referralCode: string,
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    const ipQuery = query(
      collection(db, 'referral_conversions'),
      where('referralCode', '==', referralCode),
      where('ipAddress', '==', ipAddress),
      where('timestamp', '>=', oneDayAgo)
    );
    const ipConversions = await getDocs(ipQuery);

    if (ipConversions.size > 0) {
      return {
        allowed: false,
        reason: 'Duplicate conversion from same IP within 24 hours'
      };
    }

    const deviceQuery = query(
      collection(db, 'referral_conversions'),
      where('referralCode', '==', referralCode),
      where('deviceFingerprint', '==', deviceFingerprint),
      where('timestamp', '>=', oneDayAgo)
    );
    const deviceConversions = await getDocs(deviceQuery);

    if (deviceConversions.size > 0) {
      return {
        allowed: false,
        reason: 'Duplicate conversion from same device within 24 hours'
      };
    }

    const referral = await this.getReferralByCode(referralCode);
    if (!referral) {
      return { allowed: false, reason: 'Invalid referral code' };
    }

    if (referral.status === 'suspended') {
      return { allowed: false, reason: 'Referral account suspended' };
    }

    return { allowed: true };
  },

  async recordConversion(
    referralCode: string,
    newUserId: string,
    newUserName: string,
    newUserEmail: string,
    ipAddress: string
  ): Promise<void> {
    const referral = await this.getReferralByCode(referralCode);
    if (!referral) {
      throw new Error('Invalid referral code');
    }

    const deviceFingerprint = await this.getDeviceFingerprint();

    const fraudCheck = await this.checkFraudPrevention(referralCode, ipAddress, deviceFingerprint);
    if (!fraudCheck.allowed) {
      console.warn('Conversion blocked:', fraudCheck.reason);
      throw new Error(fraudCheck.reason);
    }

    const conversionRef = doc(collection(db, 'referral_conversions'));
    const conversionData: ReferralConversion = {
      id: conversionRef.id,
      referralCode,
      referrerId: referral.referrerId,
      referrerName: referral.referrerName,
      newUserId,
      newUserName,
      newUserEmail,
      ipAddress,
      deviceFingerprint,
      pointsAwarded: REFERRAL_POINTS,
      bonusAwarded: REFERRAL_BONUS,
      timestamp: Timestamp.now(),
      status: 'approved'
    };

    await setDoc(conversionRef, conversionData);

    const referralRef = doc(db, 'referrals', referral.referrerId);
    await updateDoc(referralRef, {
      totalReferrals: increment(1),
      pointsEarned: increment(REFERRAL_POINTS),
      totalEarnings: increment(REFERRAL_BONUS)
    });

    await walletService.addCredit(
      referral.referrerId,
      referral.referrerName,
      REFERRAL_BONUS,
      'referral',
      `Referral bonus for ${newUserName}`,
      {
        referralId: conversionRef.id,
        newUserId,
        newUserName,
        newUserEmail
      },
      ipAddress
    );

    const clickQuery = query(
      collection(db, 'referral_clicks'),
      where('referralCode', '==', referralCode),
      where('deviceFingerprint', '==', deviceFingerprint),
      where('converted', '==', false)
    );
    const clicks = await getDocs(clickQuery);

    clicks.forEach(async (clickDoc) => {
      await updateDoc(doc(db, 'referral_clicks', clickDoc.id), {
        converted: true,
        convertedUserId: newUserId
      });
    });
  },

  async getReferralStats(userId: string): Promise<{
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    totalEarnings: number;
    pointsEarned: number;
  }> {
    const referral = await this.getReferral(userId);
    if (!referral) {
      return {
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        totalEarnings: 0,
        pointsEarned: 0
      };
    }

    const clicksQuery = query(
      collection(db, 'referral_clicks'),
      where('referrerId', '==', userId)
    );
    const clicksSnapshot = await getDocs(clicksQuery);

    const conversionsQuery = query(
      collection(db, 'referral_conversions'),
      where('referrerId', '==', userId),
      where('status', '==', 'approved')
    );
    const conversionsSnapshot = await getDocs(conversionsQuery);

    const totalClicks = clicksSnapshot.size;
    const totalConversions = conversionsSnapshot.size;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalClicks,
      totalConversions,
      conversionRate,
      totalEarnings: referral.totalEarnings,
      pointsEarned: referral.pointsEarned
    };
  },

  async getRecentConversions(userId: string, limitCount: number = 10): Promise<ReferralConversion[]> {
    const q = query(
      collection(db, 'referral_conversions'),
      where('referrerId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ReferralConversion);
  }
};
