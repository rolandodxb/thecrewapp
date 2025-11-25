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

export interface AffiliateAccount {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  affiliateCode: string;
  commissionRate: number;
  totalClicks: number;
  totalConversions: number;
  totalCommissions: number;
  pendingPayout: number;
  paidOut: number;
  status: 'active' | 'suspended' | 'pending_approval';
  createdAt: Timestamp;
  stripeAccountId?: string;
}

export interface AffiliateLink {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  productId: string;
  productName: string;
  productPrice: number;
  affiliateUrl: string;
  clicks: number;
  conversions: number;
  commissionsEarned: number;
  createdAt: Timestamp;
}

export interface AffiliateClick {
  id: string;
  affiliateCode: string;
  affiliateId: string;
  productId: string;
  ipAddress: string;
  deviceFingerprint: string;
  userAgent: string;
  timestamp: Timestamp;
  converted: boolean;
  orderId?: string;
}

export interface Commission {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateCode: string;
  orderId: string;
  productId: string;
  productName: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  buyerId: string;
  buyerEmail: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: Timestamp;
  paidAt?: Timestamp;
  payoutId?: string;
}

export interface Payout {
  id: string;
  affiliateId: string;
  amount: number;
  commissionIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'stripe' | 'manual';
  stripeTransferId?: string;
  createdAt: Timestamp;
  processedAt?: Timestamp;
  failureReason?: string;
}

const DEFAULT_COMMISSION_RATE = 0.10;
const MENTOR_COMMISSION_RATE = 0.15;
const GOVERNOR_COMMISSION_RATE = 0.20;
const MIN_PAYOUT_AMOUNT = 50;

export const affiliateService = {
  generateAffiliateCode(userId: string, role: string): string {
    const prefix = role === 'governor' ? 'GOV' : role === 'mentor' ? 'MNT' : 'AFF';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${code}`;
  },

  getCommissionRate(role: string): number {
    if (role === 'governor') return GOVERNOR_COMMISSION_RATE;
    if (role === 'mentor') return MENTOR_COMMISSION_RATE;
    return DEFAULT_COMMISSION_RATE;
  },

  async createAffiliateAccount(
    userId: string,
    userName: string,
    userEmail: string,
    role: string
  ): Promise<string> {
    const accountRef = doc(db, 'affiliate_accounts', userId);
    const existingAccount = await getDoc(accountRef);

    if (existingAccount.exists()) {
      return existingAccount.data().affiliateCode;
    }

    const affiliateCode = this.generateAffiliateCode(userId, role);
    const commissionRate = this.getCommissionRate(role);

    const accountData: AffiliateAccount = {
      id: userId,
      userId,
      userName,
      userEmail,
      affiliateCode,
      commissionRate,
      totalClicks: 0,
      totalConversions: 0,
      totalCommissions: 0,
      pendingPayout: 0,
      paidOut: 0,
      status: 'active',
      createdAt: Timestamp.now()
    };

    await setDoc(accountRef, accountData);
    return affiliateCode;
  },

  async getAffiliateAccount(userId: string): Promise<AffiliateAccount | null> {
    const accountRef = doc(db, 'affiliate_accounts', userId);
    const snapshot = await getDoc(accountRef);

    if (snapshot.exists()) {
      return snapshot.data() as AffiliateAccount;
    }

    return null;
  },

  async getAffiliateByCode(code: string): Promise<AffiliateAccount | null> {
    const q = query(
      collection(db, 'affiliate_accounts'),
      where('affiliateCode', '==', code),
      firestoreLimit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data() as AffiliateAccount;
    }

    return null;
  },

  async generateAffiliateLink(
    affiliateId: string,
    productId: string,
    productName: string,
    productPrice: number
  ): Promise<string> {
    const affiliate = await this.getAffiliateAccount(affiliateId);
    if (!affiliate) {
      throw new Error('Affiliate account not found');
    }

    const linkRef = doc(collection(db, 'affiliate_links'));
    const affiliateUrl = `https://thecrewacademy.co/marketplace/${productId}?ref=${affiliate.affiliateCode}`;

    const linkData: AffiliateLink = {
      id: linkRef.id,
      affiliateId,
      affiliateCode: affiliate.affiliateCode,
      productId,
      productName,
      productPrice,
      affiliateUrl,
      clicks: 0,
      conversions: 0,
      commissionsEarned: 0,
      createdAt: Timestamp.now()
    };

    await setDoc(linkRef, linkData);
    return affiliateUrl;
  },

  async trackAffiliateClick(
    affiliateCode: string,
    productId: string,
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<void> {
    const affiliate = await this.getAffiliateByCode(affiliateCode);
    if (!affiliate) return;

    const clickRef = doc(collection(db, 'affiliate_clicks'));
    const clickData: AffiliateClick = {
      id: clickRef.id,
      affiliateCode,
      affiliateId: affiliate.userId,
      productId,
      ipAddress,
      deviceFingerprint,
      userAgent: navigator.userAgent,
      timestamp: Timestamp.now(),
      converted: false
    };

    await setDoc(clickRef, clickData);

    const accountRef = doc(db, 'affiliate_accounts', affiliate.userId);
    await updateDoc(accountRef, {
      totalClicks: increment(1)
    });

    const linkQuery = query(
      collection(db, 'affiliate_links'),
      where('affiliateId', '==', affiliate.userId),
      where('productId', '==', productId)
    );
    const linkSnapshot = await getDocs(linkQuery);

    if (!linkSnapshot.empty) {
      const linkRef = doc(db, 'affiliate_links', linkSnapshot.docs[0].id);
      await updateDoc(linkRef, {
        clicks: increment(1)
      });
    }
  },

  async recordCommission(
    affiliateCode: string,
    orderId: string,
    productId: string,
    productName: string,
    orderAmount: number,
    buyerId: string,
    buyerEmail: string
  ): Promise<void> {
    const affiliate = await this.getAffiliateByCode(affiliateCode);
    if (!affiliate) {
      throw new Error('Invalid affiliate code');
    }

    if (affiliate.status !== 'active') {
      throw new Error('Affiliate account not active');
    }

    const commissionAmount = orderAmount * affiliate.commissionRate;

    const commissionRef = doc(collection(db, 'commissions'));
    const commissionData: Commission = {
      id: commissionRef.id,
      affiliateId: affiliate.userId,
      affiliateName: affiliate.userName,
      affiliateCode,
      orderId,
      productId,
      productName,
      orderAmount,
      commissionRate: affiliate.commissionRate,
      commissionAmount,
      buyerId,
      buyerEmail,
      status: 'approved',
      createdAt: Timestamp.now()
    };

    await setDoc(commissionRef, commissionData);

    const accountRef = doc(db, 'affiliate_accounts', affiliate.userId);
    await updateDoc(accountRef, {
      totalConversions: increment(1),
      totalCommissions: increment(commissionAmount),
      pendingPayout: increment(commissionAmount)
    });

    const linkQuery = query(
      collection(db, 'affiliate_links'),
      where('affiliateId', '==', affiliate.userId),
      where('productId', '==', productId)
    );
    const linkSnapshot = await getDocs(linkQuery);

    if (!linkSnapshot.empty) {
      const linkRef = doc(db, 'affiliate_links', linkSnapshot.docs[0].id);
      await updateDoc(linkRef, {
        conversions: increment(1),
        commissionsEarned: increment(commissionAmount)
      });
    }

    const clickQuery = query(
      collection(db, 'affiliate_clicks'),
      where('affiliateCode', '==', affiliateCode),
      where('productId', '==', productId),
      where('converted', '==', false)
    );
    const clicks = await getDocs(clickQuery);

    clicks.forEach(async (clickDoc) => {
      await updateDoc(doc(db, 'affiliate_clicks', clickDoc.id), {
        converted: true,
        orderId
      });
    });
  },

  async getAffiliateDashboard(userId: string): Promise<{
    account: AffiliateAccount | null;
    stats: {
      totalClicks: number;
      totalConversions: number;
      conversionRate: number;
      totalCommissions: number;
      pendingPayout: number;
      paidOut: number;
    };
    recentCommissions: Commission[];
    topProducts: Array<{ productId: string; productName: string; commissionsEarned: number }>;
  }> {
    const account = await this.getAffiliateAccount(userId);

    if (!account) {
      return {
        account: null,
        stats: {
          totalClicks: 0,
          totalConversions: 0,
          conversionRate: 0,
          totalCommissions: 0,
          pendingPayout: 0,
          paidOut: 0
        },
        recentCommissions: [],
        topProducts: []
      };
    }

    const conversionRate = account.totalClicks > 0
      ? (account.totalConversions / account.totalClicks) * 100
      : 0;

    const commissionsQuery = query(
      collection(db, 'commissions'),
      where('affiliateId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(10)
    );
    const commissionsSnapshot = await getDocs(commissionsQuery);
    const recentCommissions = commissionsSnapshot.docs.map(doc => doc.data() as Commission);

    const linksQuery = query(
      collection(db, 'affiliate_links'),
      where('affiliateId', '==', userId),
      orderBy('commissionsEarned', 'desc'),
      firestoreLimit(5)
    );
    const linksSnapshot = await getDocs(linksQuery);
    const topProducts = linksSnapshot.docs.map(doc => {
      const data = doc.data() as AffiliateLink;
      return {
        productId: data.productId,
        productName: data.productName,
        commissionsEarned: data.commissionsEarned
      };
    });

    return {
      account,
      stats: {
        totalClicks: account.totalClicks,
        totalConversions: account.totalConversions,
        conversionRate,
        totalCommissions: account.totalCommissions,
        pendingPayout: account.pendingPayout,
        paidOut: account.paidOut
      },
      recentCommissions,
      topProducts
    };
  },

  async requestPayout(userId: string): Promise<{ success: boolean; message: string; payoutId?: string }> {
    const account = await this.getAffiliateAccount(userId);

    if (!account) {
      return { success: false, message: 'Affiliate account not found' };
    }

    if (account.pendingPayout < MIN_PAYOUT_AMOUNT) {
      return {
        success: false,
        message: `Minimum payout amount is $${MIN_PAYOUT_AMOUNT}. Current balance: $${account.pendingPayout.toFixed(2)}`
      };
    }

    const approvedCommissionsQuery = query(
      collection(db, 'commissions'),
      where('affiliateId', '==', userId),
      where('status', '==', 'approved')
    );
    const commissionsSnapshot = await getDocs(approvedCommissionsQuery);
    const commissionIds = commissionsSnapshot.docs.map(doc => doc.id);

    const payoutRef = doc(collection(db, 'payouts'));
    const payoutData: Payout = {
      id: payoutRef.id,
      affiliateId: userId,
      amount: account.pendingPayout,
      commissionIds,
      status: 'pending',
      method: 'stripe',
      createdAt: Timestamp.now()
    };

    await setDoc(payoutRef, payoutData);

    commissionsSnapshot.forEach(async (commissionDoc) => {
      await updateDoc(doc(db, 'commissions', commissionDoc.id), {
        status: 'pending',
        payoutId: payoutRef.id
      });
    });

    return {
      success: true,
      message: 'Payout request submitted successfully',
      payoutId: payoutRef.id
    };
  },

  async getAllAffiliateLinks(userId: string): Promise<AffiliateLink[]> {
    const q = query(
      collection(db, 'affiliate_links'),
      where('affiliateId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AffiliateLink);
  }
};
