import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  category: 'role_change' | 'feature_shutdown' | 'moderation' | 'admin_action' | 'system';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Timestamp;
}

export const auditLogService = {
  async log(
    userId: string,
    userEmail: string,
    action: string,
    category: 'role_change' | 'feature_shutdown' | 'moderation' | 'admin_action' | 'system',
    details: Record<string, any>
  ): Promise<string> {
    const logData = {
      userId,
      userEmail,
      action,
      category,
      details,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'audit_logs'), logData);
    return docRef.id;
  },

  async getLogs(
    filters?: {
      userId?: string;
      category?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limitCount: number = 50
  ): Promise<AuditLog[]> {
    let q = query(
      collection(db, 'audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    if (filters?.userId) {
      q = query(
        collection(db, 'audit_logs'),
        where('userId', '==', filters.userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    if (filters?.category) {
      q = query(
        collection(db, 'audit_logs'),
        where('category', '==', filters.category),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));
  },

  async exportToCSV(logs: AuditLog[]): Promise<string> {
    const headers = ['Date', 'User Email', 'Action', 'Category', 'Details'];
    const rows = logs.map(log => [
      log.createdAt.toDate().toISOString(),
      log.userEmail,
      log.action,
      log.category,
      JSON.stringify(log.details)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  downloadCSV(csvContent: string, filename: string = 'audit_logs.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
