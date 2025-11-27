import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AnalyticsData {
  activeUsers: number;
  totalUsers: number;
  newUsersThisWeek: number;
  totalMessages: number;
  messagesThisWeek: number;
  totalCourses: number;
  activeCourses: number;
  enrollments: number;
  subscriptionsByPlan: {
    free: number;
    basic: number;
    pro: number;
    vip: number;
  };
  topConversations: Array<{
    id: string;
    name: string;
    messageCount: number;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  messageActivity: Array<{
    date: string;
    count: number;
  }>;
}

export async function getAnalyticsSummary(): Promise<AnalyticsData> {
  const now = Timestamp.now();
  const oneWeekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));

  const [
    totalUsersSnapshot,
    activeUsersSnapshot,
    newUsersSnapshot,
    totalMessagesSnapshot,
    recentMessagesSnapshot,
    coursesSnapshot,
    enrollmentsSnapshot,
  ] = await Promise.all([
    getCountFromServer(collection(db, 'users')),
    getCountFromServer(
      query(collection(db, 'userPresence'), where('lastSeen', '>=', oneHourAgo))
    ),
    getCountFromServer(
      query(collection(db, 'users'), where('createdAt', '>=', oneWeekAgo))
    ),
    getCountFromServer(collection(db, 'messages')),
    getCountFromServer(
      query(collection(db, 'messages'), where('createdAt', '>=', oneWeekAgo))
    ),
    getDocs(collection(db, 'courses')),
    getCountFromServer(collection(db, 'course_enrollments')),
  ]);

  const usersSnapshot = await getDocs(collection(db, 'users'));
  const subscriptionsByPlan = {
    free: 0,
    basic: 0,
    pro: 0,
    vip: 0,
  };

  usersSnapshot.docs.forEach((doc) => {
    const user = doc.data();
    const plan = (user.subscription?.toLowerCase() || 'free') as keyof typeof subscriptionsByPlan;
    if (subscriptionsByPlan[plan] !== undefined) {
      subscriptionsByPlan[plan]++;
    }
  });

  const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
  const conversationMessages: Record<string, number> = {};

  const messagesSnapshot = await getDocs(collection(db, 'messages'));
  messagesSnapshot.docs.forEach((doc) => {
    const message = doc.data();
    const convId = message.conversationId;
    conversationMessages[convId] = (conversationMessages[convId] || 0) + 1;
  });

  const topConversations = conversationsSnapshot.docs
    .map((doc) => ({
      id: doc.id,
      name: doc.data().name || 'Unnamed Conversation',
      messageCount: conversationMessages[doc.id] || 0,
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 10);

  const userGrowth = await getUserGrowthData(30);
  const messageActivity = await getMessageActivityData(30);

  return {
    activeUsers: activeUsersSnapshot.data().count,
    totalUsers: totalUsersSnapshot.data().count,
    newUsersThisWeek: newUsersSnapshot.data().count,
    totalMessages: totalMessagesSnapshot.data().count,
    messagesThisWeek: recentMessagesSnapshot.data().count,
    totalCourses: coursesSnapshot.docs.length,
    activeCourses: coursesSnapshot.docs.filter((doc) => doc.data().published).length,
    enrollments: enrollmentsSnapshot.data().count,
    subscriptionsByPlan,
    topConversations,
    userGrowth,
    messageActivity,
  };
}

async function getUserGrowthData(days: number) {
  const data: Array<{ date: string; count: number }> = [];
  const usersSnapshot = await getDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(1000))
  );

  const dailyCounts: Record<string, number> = {};

  usersSnapshot.docs.forEach((doc) => {
    const user = doc.data();
    if (user.createdAt) {
      let date: Date;
      if (user.createdAt.toDate && typeof user.createdAt.toDate === 'function') {
        date = user.createdAt.toDate();
      } else if (user.createdAt instanceof Date) {
        date = user.createdAt;
      } else if (typeof user.createdAt === 'string') {
        date = new Date(user.createdAt);
      } else if (typeof user.createdAt === 'number') {
        date = new Date(user.createdAt);
      } else {
        return;
      }
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    }
  });

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: dailyCounts[dateStr] || 0,
    });
  }

  return data;
}

async function getMessageActivityData(days: number) {
  const data: Array<{ date: string; count: number }> = [];
  const messagesSnapshot = await getDocs(
    query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(5000))
  );

  const dailyCounts: Record<string, number> = {};

  messagesSnapshot.docs.forEach((doc) => {
    const message = doc.data();
    if (message.createdAt) {
      let date: Date;
      if (message.createdAt.toDate && typeof message.createdAt.toDate === 'function') {
        date = message.createdAt.toDate();
      } else if (message.createdAt instanceof Date) {
        date = message.createdAt;
      } else if (typeof message.createdAt === 'string') {
        date = new Date(message.createdAt);
      } else if (typeof message.createdAt === 'number') {
        date = new Date(message.createdAt);
      } else {
        return;
      }
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    }
  });

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: dailyCounts[dateStr] || 0,
    });
  }

  return data;
}

export async function getRealtimeMetrics() {
  const oneMinuteAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 1000));
  const fiveMinutesAgo = Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));

  const [recentMessagesSnapshot, activeUsersSnapshot] = await Promise.all([
    getCountFromServer(
      query(collection(db, 'messages'), where('createdAt', '>=', oneMinuteAgo))
    ),
    getCountFromServer(
      query(collection(db, 'userPresence'), where('lastSeen', '>=', fiveMinutesAgo))
    ),
  ]);

  return {
    messagesPerMinute: recentMessagesSnapshot.data().count,
    activeNow: activeUsersSnapshot.data().count,
  };
}
