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
  limit as firestoreLimit,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Wallet {
  id: string;
  userId: string;
  userName: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  currency: string;
  status: 'active' | 'suspended' | 'frozen';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastTransactionAt?: Timestamp;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  userName: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  category: 'referral' | 'achievement' | 'cashback' | 'purchase' | 'booking' | 'admin_credit' | 'refund' | 'bonus';
  description: string;
  metadata?: {
    referralId?: string;
    achievementId?: string;
    orderId?: string;
    bookingId?: string;
    productId?: string;
    adminId?: string;
    refundReason?: string;
  };
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  ipAddress?: string;
  deviceFingerprint?: string;
  fraudScore?: number;
  flaggedForReview?: boolean;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  transactionId: string;
  alertType: 'high_velocity' | 'unusual_pattern' | 'large_amount' | 'suspicious_device' | 'ai_flagged';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fraudScore: number;
  metadata: any;
  status: 'pending' | 'reviewed' | 'resolved' | 'false_positive';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  resolution?: string;
  createdAt: Timestamp;
}

const FRAUD_THRESHOLD = 70;
const MAX_DAILY_CREDITS = 1000;
const MAX_TRANSACTION_AMOUNT = 500;
const VELOCITY_CHECK_MINUTES = 60;
const MAX_TRANSACTIONS_PER_HOUR = 10;

export const walletService = {
  async createWallet(userId: string, userName: string): Promise<Wallet> {
    const walletRef = doc(db, 'wallets', userId);
    const existingWallet = await getDoc(walletRef);

    if (existingWallet.exists()) {
      return existingWallet.data() as Wallet;
    }

    const wallet: Wallet = {
      id: userId,
      userId,
      userName,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      currency: 'USD',
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(walletRef, wallet);
    return wallet;
  },

  async getWallet(userId: string): Promise<Wallet | null> {
    const walletRef = doc(db, 'wallets', userId);
    const snapshot = await getDoc(walletRef);

    if (snapshot.exists()) {
      return snapshot.data() as Wallet;
    }

    return null;
  },

  async getDeviceFingerprint(): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('wallet-fp', 2, 2);
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

  async calculateFraudScore(
    userId: string,
    amount: number,
    type: 'credit' | 'debit',
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<{ score: number; alerts: string[] }> {
    let score = 0;
    const alerts: string[] = [];

    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - VELOCITY_CHECK_MINUTES * 60 * 1000));
    const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    const recentTransactionsQuery = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userId),
      where('createdAt', '>=', oneHourAgo),
      where('status', '==', 'completed')
    );
    const recentTransactions = await getDocs(recentTransactionsQuery);

    if (recentTransactions.size > MAX_TRANSACTIONS_PER_HOUR) {
      score += 30;
      alerts.push(`High velocity: ${recentTransactions.size} transactions in last hour`);
    }

    const dailyCreditsQuery = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userId),
      where('type', '==', 'credit'),
      where('createdAt', '>=', oneDayAgo),
      where('status', '==', 'completed')
    );
    const dailyCredits = await getDocs(dailyCreditsQuery);
    const dailyTotal = dailyCredits.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    if (dailyTotal > MAX_DAILY_CREDITS) {
      score += 40;
      alerts.push(`Exceeded daily credit limit: $${dailyTotal}`);
    }

    if (amount > MAX_TRANSACTION_AMOUNT) {
      score += 25;
      alerts.push(`Large transaction: $${amount}`);
    }

    const ipQuery = query(
      collection(db, 'wallet_transactions'),
      where('userId', '!=', userId),
      where('ipAddress', '==', ipAddress),
      where('createdAt', '>=', oneDayAgo)
    );
    const ipTransactions = await getDocs(ipQuery);

    if (ipTransactions.size > 5) {
      score += 20;
      alerts.push(`Multiple accounts from same IP`);
    }

    const deviceQuery = query(
      collection(db, 'wallet_transactions'),
      where('userId', '!=', userId),
      where('deviceFingerprint', '==', deviceFingerprint),
      where('createdAt', '>=', oneDayAgo)
    );
    const deviceTransactions = await getDocs(deviceQuery);

    if (deviceTransactions.size > 3) {
      score += 20;
      alerts.push(`Multiple accounts from same device`);
    }

    const wallet = await this.getWallet(userId);
    if (wallet && type === 'debit' && amount > wallet.balance * 0.9) {
      score += 15;
      alerts.push(`Large withdrawal: ${((amount / wallet.balance) * 100).toFixed(0)}% of balance`);
    }

    return { score, alerts };
  },

  async addCredit(
    userId: string,
    userName: string,
    amount: number,
    category: Transaction['category'],
    description: string,
    metadata?: Transaction['metadata'],
    ipAddress?: string
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      let wallet = await this.getWallet(userId);
      if (!wallet) {
        wallet = await this.createWallet(userId, userName);
      }

      if (wallet.status !== 'active') {
        return { success: false, error: 'Wallet is not active' };
      }

      const deviceFingerprint = await this.getDeviceFingerprint();
      const ip = ipAddress || '0.0.0.0';

      const fraudCheck = await this.calculateFraudScore(userId, amount, 'credit', ip, deviceFingerprint);

      const transactionRef = doc(collection(db, 'wallet_transactions'));
      const transaction: Transaction = {
        id: transactionRef.id,
        walletId: wallet.id,
        userId,
        userName,
        type: 'credit',
        amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance + amount,
        category,
        description,
        ...(metadata && { metadata }),
        status: fraudCheck.score > FRAUD_THRESHOLD ? 'pending' : 'completed',
        ipAddress: ip,
        deviceFingerprint,
        fraudScore: fraudCheck.score,
        flaggedForReview: fraudCheck.score > FRAUD_THRESHOLD,
        createdAt: Timestamp.now()
      };

      await setDoc(transactionRef, transaction);

      if (fraudCheck.score > FRAUD_THRESHOLD) {
        const alertRef = doc(collection(db, 'fraud_alerts'));
        const alert: FraudAlert = {
          id: alertRef.id,
          userId,
          userName,
          transactionId: transaction.id,
          alertType: 'ai_flagged',
          severity: fraudCheck.score > 90 ? 'critical' : 'high',
          description: `Suspicious credit transaction: ${fraudCheck.alerts.join(', ')}`,
          fraudScore: fraudCheck.score,
          metadata: { amount, category, alerts: fraudCheck.alerts },
          status: 'pending',
          createdAt: Timestamp.now()
        };
        await setDoc(alertRef, alert);

        return { success: false, error: 'Transaction flagged for review', transaction };
      }

      const walletRef = doc(db, 'wallets', userId);
      await updateDoc(walletRef, {
        balance: increment(amount),
        totalEarned: increment(amount),
        updatedAt: Timestamp.now(),
        lastTransactionAt: Timestamp.now()
      });

      return { success: true, transaction };
    } catch (error: any) {
      console.error('Error adding credit:', error);
      return { success: false, error: error.message };
    }
  },

  async deductCredit(
    userId: string,
    userName: string,
    amount: number,
    category: Transaction['category'],
    description: string,
    metadata?: Transaction['metadata'],
    ipAddress?: string
  ): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
    try {
      const wallet = await this.getWallet(userId);
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      if (wallet.status !== 'active') {
        return { success: false, error: 'Wallet is not active' };
      }

      if (wallet.balance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const deviceFingerprint = await this.getDeviceFingerprint();
      const ip = ipAddress || '0.0.0.0';

      const fraudCheck = await this.calculateFraudScore(userId, amount, 'debit', ip, deviceFingerprint);

      const transactionRef = doc(collection(db, 'wallet_transactions'));
      const transaction: Transaction = {
        id: transactionRef.id,
        walletId: wallet.id,
        userId,
        userName,
        type: 'debit',
        amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance - amount,
        category,
        description,
        ...(metadata && { metadata }),
        status: fraudCheck.score > FRAUD_THRESHOLD ? 'pending' : 'completed',
        ipAddress: ip,
        deviceFingerprint,
        fraudScore: fraudCheck.score,
        flaggedForReview: fraudCheck.score > FRAUD_THRESHOLD,
        createdAt: Timestamp.now()
      };

      await setDoc(transactionRef, transaction);

      if (fraudCheck.score > FRAUD_THRESHOLD) {
        const alertRef = doc(collection(db, 'fraud_alerts'));
        const alert: FraudAlert = {
          id: alertRef.id,
          userId,
          userName,
          transactionId: transaction.id,
          alertType: 'ai_flagged',
          severity: fraudCheck.score > 90 ? 'critical' : 'high',
          description: `Suspicious debit transaction: ${fraudCheck.alerts.join(', ')}`,
          fraudScore: fraudCheck.score,
          metadata: { amount, category, alerts: fraudCheck.alerts },
          status: 'pending',
          createdAt: Timestamp.now()
        };
        await setDoc(alertRef, alert);

        return { success: false, error: 'Transaction flagged for review', transaction };
      }

      const walletRef = doc(db, 'wallets', userId);
      await updateDoc(walletRef, {
        balance: increment(-amount),
        totalSpent: increment(amount),
        updatedAt: Timestamp.now(),
        lastTransactionAt: Timestamp.now()
      });

      return { success: true, transaction };
    } catch (error: any) {
      console.error('Error deducting credit:', error);
      return { success: false, error: error.message };
    }
  },

  async getTransactionHistory(
    userId: string,
    limitCount: number = 50
  ): Promise<Transaction[]> {
    const q = query(
      collection(db, 'wallet_transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Transaction);
  },

  async getTransaction(transactionId: string): Promise<Transaction | null> {
    const transactionRef = doc(db, 'wallet_transactions', transactionId);
    const snapshot = await getDoc(transactionRef);

    if (snapshot.exists()) {
      return snapshot.data() as Transaction;
    }

    return null;
  },

  async refundTransaction(
    transactionId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = await this.getTransaction(transactionId);
      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }

      if (transaction.type !== 'debit') {
        return { success: false, error: 'Can only refund debit transactions' };
      }

      if (transaction.status !== 'completed') {
        return { success: false, error: 'Can only refund completed transactions' };
      }

      const result = await this.addCredit(
        transaction.userId,
        transaction.userName,
        transaction.amount,
        'refund',
        `Refund: ${reason}`,
        {
          ...transaction.metadata,
          originalTransactionId: transactionId,
          adminId,
          refundReason: reason
        }
      );

      if (result.success) {
        await updateDoc(doc(db, 'wallet_transactions', transactionId), {
          status: 'cancelled'
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error refunding transaction:', error);
      return { success: false, error: error.message };
    }
  },

  async getFraudAlerts(status?: FraudAlert['status']): Promise<FraudAlert[]> {
    let q;
    if (status) {
      q = query(
        collection(db, 'fraud_alerts'),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        firestoreLimit(100)
      );
    } else {
      q = query(
        collection(db, 'fraud_alerts'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(100)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FraudAlert);
  },

  async resolveAlert(
    alertId: string,
    resolution: 'approved' | 'rejected' | 'false_positive',
    reviewerId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const alertRef = doc(db, 'fraud_alerts', alertId);
      const alertSnapshot = await getDoc(alertRef);

      if (!alertSnapshot.exists()) {
        return { success: false, error: 'Alert not found' };
      }

      const alert = alertSnapshot.data() as FraudAlert;

      await updateDoc(alertRef, {
        status: resolution === 'false_positive' ? 'false_positive' : 'resolved',
        reviewedBy: reviewerId,
        reviewedAt: Timestamp.now(),
        resolution: notes || resolution
      });

      if (resolution === 'approved') {
        const transactionRef = doc(db, 'wallet_transactions', alert.transactionId);
        const transaction = await getDoc(transactionRef);

        if (transaction.exists()) {
          const txData = transaction.data() as Transaction;
          await updateDoc(transactionRef, {
            status: 'completed',
            reviewedBy: reviewerId,
            reviewedAt: Timestamp.now()
          });

          const walletRef = doc(db, 'wallets', alert.userId);
          if (txData.type === 'credit') {
            await updateDoc(walletRef, {
              balance: increment(txData.amount),
              totalEarned: increment(txData.amount),
              updatedAt: Timestamp.now()
            });
          }
        }
      } else if (resolution === 'rejected') {
        await updateDoc(doc(db, 'wallet_transactions', alert.transactionId), {
          status: 'failed',
          reviewedBy: reviewerId,
          reviewedAt: Timestamp.now()
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      return { success: false, error: error.message };
    }
  },

  async getWalletStats(userId: string): Promise<{
    balance: number;
    totalEarned: number;
    totalSpent: number;
    transactionCount: number;
    recentTransactions: Transaction[];
  }> {
    const wallet = await this.getWallet(userId);
    const transactions = await this.getTransactionHistory(userId, 10);

    return {
      balance: wallet?.balance || 0,
      totalEarned: wallet?.totalEarned || 0,
      totalSpent: wallet?.totalSpent || 0,
      transactionCount: transactions.length,
      recentTransactions: transactions
    };
  },

  async deductFromWallet(
    userId: string,
    amount: number,
    category: string,
    description: string,
    referenceId?: string
  ): Promise<void> {
    const wallet = await this.getWallet(userId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const userName = wallet.userName;

    let validCategory: Transaction['category'];
    let metadata: Transaction['metadata'] | undefined;

    switch (category) {
      case 'activity':
        validCategory = 'booking';
        if (referenceId) {
          metadata = { bookingId: referenceId };
        }
        break;
      case 'purchase':
        validCategory = 'purchase';
        if (referenceId) {
          metadata = { productId: referenceId };
        }
        break;
      default:
        validCategory = 'purchase';
    }

    const result = await this.deductCredit(
      userId,
      userName,
      amount,
      validCategory,
      description,
      metadata
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to deduct from wallet');
    }
  }
};
