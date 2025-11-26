import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { PaginationHelper } from '../utils/paginationHelper';

export interface MinimalUserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  trustScore?: number;
  createdAt: any;
  suspended?: boolean;
}

export interface FullUserProfile extends MinimalUserProfile {
  plan?: string;
  points?: number;
  bio?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  nationality?: string;
  city?: string;
  interests?: string[];
  skills?: string[];
  languages?: string[];
  badges?: any[];
  achievements?: any[];
  enrolledCourses?: string[];
  completedCourses?: string[];
}

class OptimizedUsersService {
  private usersPaginationHelper: PaginationHelper<MinimalUserProfile>;
  private userCache: Map<string, { data: FullUserProfile; timestamp: number }>;
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.usersPaginationHelper = new PaginationHelper<MinimalUserProfile>('users', 25);
    this.userCache = new Map();
  }

  async fetchUsersPage(
    page: number = 1,
    filters: {
      role?: string;
      suspended?: boolean;
      minTrustScore?: number;
    } = {}
  ) {
    const whereConditions: any[] = [];

    if (filters.role) {
      whereConditions.push({
        field: 'role',
        operator: '==',
        value: filters.role,
      });
    }

    if (filters.suspended !== undefined) {
      whereConditions.push({
        field: 'suspended',
        operator: '==',
        value: filters.suspended,
      });
    }

    return this.usersPaginationHelper.fetchPage(page, {
      pageSize: 25,
      orderByField: 'createdAt',
      orderDirection: 'desc',
      whereConditions,
    });
  }

  async fetchUsersByRole(role: string, pageSize: number = 25) {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const users: MinimalUserProfile[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          role: data.role,
          trustScore: data.trustScore,
          createdAt: data.createdAt,
          suspended: data.suspended,
        });
      });

      return users;
    } catch (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }
  }

  async fetchFullUserProfile(userId: string): Promise<FullUserProfile | null> {
    const cached = this.userCache.get(userId);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      const fullProfile: FullUserProfile = {
        id: userDoc.id,
        name: data.name,
        email: data.email,
        avatar: data.avatar,
        role: data.role,
        trustScore: data.trustScore,
        createdAt: data.createdAt,
        suspended: data.suspended,
        plan: data.plan,
        points: data.points,
        bio: data.bio,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality,
        city: data.city,
        interests: data.interests,
        skills: data.skills,
        languages: data.languages,
        badges: data.badges,
        achievements: data.achievements,
        enrolledCourses: data.enrolledCourses,
        completedCourses: data.completedCourses,
      };

      this.userCache.set(userId, {
        data: fullProfile,
        timestamp: now,
      });

      return fullProfile;
    } catch (error) {
      console.error('Error fetching full user profile:', error);
      return null;
    }
  }

  async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date(),
      });

      this.userCache.delete(userId);
      this.usersPaginationHelper.clearCache();

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  async suspendUser(userId: string, reason: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspended: true,
        suspensionReason: reason,
        suspendedAt: new Date(),
      });

      this.userCache.delete(userId);
      this.usersPaginationHelper.clearCache();

      return true;
    } catch (error) {
      console.error('Error suspending user:', error);
      return false;
    }
  }

  async unsuspendUser(userId: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        suspended: false,
        suspensionReason: null,
        suspendedAt: null,
        unsuspendedAt: new Date(),
      });

      this.userCache.delete(userId);
      this.usersPaginationHelper.clearCache();

      return true;
    } catch (error) {
      console.error('Error unsuspending user:', error);
      return false;
    }
  }

  clearAllCaches(): void {
    this.userCache.clear();
    this.usersPaginationHelper.clearCache();
  }
}

export const optimizedUsersService = new OptimizedUsersService();
