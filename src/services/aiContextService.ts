import { collection, query, where, getDocs, doc, getDoc, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserContext {
  userId: string;
  role: 'student' | 'coach' | 'mentor' | 'governor' | 'moderator';
  profile: {
    name: string;
    email: string;
    photoURL?: string;
    phone?: string;
    nationality?: string;
    experience?: string;
  };
  progress: {
    enrolledCourses: number;
    completedModules: number;
    totalPoints: number;
    badges: string[];
    currentLevel: string;
  };
  marketplace: {
    purchasedProducts: Array<{
      id: string;
      title: string;
      type: string;
      purchaseDate: Date;
    }>;
    soldProducts: Array<{
      id: string;
      title: string;
      revenue: number;
    }>;
  };
  community: {
    postsCount: number;
    commentsCount: number;
    likesReceived: number;
    recentActivity: Array<{
      type: string;
      content: string;
      timestamp: Date;
    }>;
  };
  modules: {
    created: number;
    enrolled: number;
    completed: number;
  };
  analytics?: {
    studentCount?: number;
    revenue?: number;
    engagement?: number;
  };
}

class AIContextService {
  private contextCache: Map<string, { data: UserContext; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  async getUserContext(userId: string): Promise<UserContext> {
    const cached = this.contextCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const context = await this.fetchUserContext(userId);
    this.contextCache.set(userId, { data: context, timestamp: Date.now() });
    return context;
  }

  private async fetchUserContext(userId: string): Promise<UserContext> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User not found');
    }

    const context: UserContext = {
      userId,
      role: userData.role || 'student',
      profile: {
        name: userData.name || 'Unknown',
        email: userData.email || '',
        photoURL: userData.photoURL,
        phone: userData.phone,
        nationality: userData.nationality,
        experience: userData.experience,
      },
      progress: await this.getProgressData(userId),
      marketplace: await this.getMarketplaceData(userId),
      community: await this.getCommunityData(userId),
      modules: await this.getModuleData(userId),
    };

    if (context.role === 'coach' || context.role === 'mentor') {
      context.analytics = await this.getAnalyticsData(userId);
    }

    return context;
  }

  private async getProgressData(userId: string) {
    try {
      const enrollmentsQuery = query(
        collection(db, 'course_enrollments'),
        where('userId', '==', userId)
      );
      const enrollmentsSnap = await getDocs(enrollmentsQuery);

      const progressQuery = query(
        collection(db, 'user_module_progress'),
        where('userId', '==', userId)
      );
      const progressSnap = await getDocs(progressQuery);

      let completedModules = 0;
      progressSnap.forEach((doc) => {
        const data = doc.data();
        if (data.completed) completedModules++;
      });

      const pointsDoc = await getDoc(doc(db, 'user_points', userId));
      const totalPoints = pointsDoc.exists() ? pointsDoc.data().total_points || 0 : 0;

      const badgesQuery = query(
        collection(db, 'user_badges'),
        where('userId', '==', userId)
      );
      const badgesSnap = await getDocs(badgesQuery);
      const badges = badgesSnap.docs.map((doc) => doc.data().badge_type || doc.data().type);

      return {
        enrolledCourses: enrollmentsSnap.size,
        completedModules,
        totalPoints,
        badges,
        currentLevel: this.calculateLevel(totalPoints),
      };
    } catch (error) {
      console.error('Error fetching progress:', error);
      return {
        enrolledCourses: 0,
        completedModules: 0,
        totalPoints: 0,
        badges: [],
        currentLevel: 'Beginner',
      };
    }
  }

  private async getMarketplaceData(userId: string) {
    try {
      const purchasesQuery = query(
        collection(db, 'orders'),
        where('buyerId', '==', userId),
        where('status', '==', 'completed')
      );
      const purchasesSnap = await getDocs(purchasesQuery);

      const purchasedProducts = purchasesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.productTitle || 'Unknown Product',
          type: data.productType || 'digital',
          purchaseDate: data.createdAt?.toDate() || new Date(),
        };
      });

      const salesQuery = query(
        collection(db, 'orders'),
        where('sellerId', '==', userId),
        where('status', '==', 'completed')
      );
      const salesSnap = await getDocs(salesQuery);

      const soldProducts = salesSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.productTitle || 'Unknown Product',
          revenue: data.amount || 0,
        };
      });

      return { purchasedProducts, soldProducts };
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      return { purchasedProducts: [], soldProducts: [] };
    }
  }

  private async getCommunityData(userId: string) {
    try {
      const postsQuery = query(
        collection(db, 'communityPosts'),
        where('userId', '==', userId)
      );
      const postsSnap = await getDocs(postsQuery);

      let commentsCount = 0;
      let likesReceived = 0;

      postsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.commentsCount) commentsCount += data.commentsCount;
        if (data.likes) likesReceived += data.likes.length;
      });

      const recentQuery = query(
        collection(db, 'communityPosts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentSnap = await getDocs(recentQuery);

      const recentActivity = recentSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          type: 'post',
          content: data.content?.substring(0, 100) || '',
          timestamp: data.createdAt?.toDate() || new Date(),
        };
      });

      return {
        postsCount: postsSnap.size,
        commentsCount,
        likesReceived,
        recentActivity,
      };
    } catch (error) {
      console.error('Error fetching community data:', error);
      return {
        postsCount: 0,
        commentsCount: 0,
        likesReceived: 0,
        recentActivity: [],
      };
    }
  }

  private async getModuleData(userId: string) {
    try {
      const createdQuery = query(
        collection(db, 'main_modules'),
        where('createdBy', '==', userId)
      );
      const createdSnap = await getDocs(createdQuery);

      const enrolledQuery = query(
        collection(db, 'course_enrollments'),
        where('userId', '==', userId)
      );
      const enrolledSnap = await getDocs(enrolledQuery);

      const completedQuery = query(
        collection(db, 'user_module_progress'),
        where('userId', '==', userId)
      );
      const completedSnap = await getDocs(completedQuery);
      const completedCount = completedSnap.docs.filter(doc => doc.data().completed === true).length;

      return {
        created: createdSnap.size,
        enrolled: enrolledSnap.size,
        completed: completedCount,
      };
    } catch (error) {
      console.error('Error fetching module data:', error);
      return { created: 0, enrolled: 0, completed: 0 };
    }
  }

  private async getAnalyticsData(userId: string) {
    try {
      const studentsQuery = query(
        collection(db, 'enrollments'),
        where('coachId', '==', userId)
      );
      const studentsSnap = await getDocs(studentsQuery);

      const revenueQuery = query(
        collection(db, 'orders'),
        where('sellerId', '==', userId),
        where('status', '==', 'completed')
      );
      const revenueSnap = await getDocs(revenueQuery);

      let totalRevenue = 0;
      revenueSnap.forEach((doc) => {
        totalRevenue += doc.data().amount || 0;
      });

      return {
        studentCount: studentsSnap.size,
        revenue: totalRevenue,
        engagement: studentsSnap.size > 0 ? Math.min(100, (studentsSnap.size / 10) * 100) : 0,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return { studentCount: 0, revenue: 0, engagement: 0 };
    }
  }

  private calculateLevel(points: number): string {
    if (points < 100) return 'Beginner';
    if (points < 500) return 'Intermediate';
    if (points < 1000) return 'Advanced';
    if (points < 2000) return 'Expert';
    return 'Master';
  }

  subscribeToUserContext(userId: string, callback: (context: UserContext) => void) {
    return onSnapshot(doc(db, 'users', userId), async () => {
      const context = await this.getUserContext(userId);
      callback(context);
    });
  }

  clearCache(userId?: string) {
    if (userId) {
      this.contextCache.delete(userId);
    } else {
      this.contextCache.clear();
    }
  }
}

export const aiContextService = new AIContextService();
