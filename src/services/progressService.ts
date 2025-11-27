import { supabase } from '../lib/auth';
export interface RecentActivity {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  timestamp: string;
}
export interface LessonProgress {
  viewed: boolean;
  viewedAt: string | null;
}
export interface ModuleProgress {
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
}
export interface UserProgress {
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lastActive: string;
  recentActivity: RecentActivity[];
}
export const registerLessonView = async (
  userId: string,
  courseId: string,
  moduleId: string,
  lessonId: string,
  lessonTitle: string
): Promise<void> => {
  try {
    const lessonProgressRef = doc(
      db,
      'userProgress',
      userId,
      'modules',
      moduleId,
      'lessons',
      lessonId
    );
    const lessonProgressSnap = await getDoc(lessonProgressRef);
    const isFirstView = !lessonProgressSnap.exists() || !lessonProgressSnap.data()?.viewed;
    if (isFirstView) {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const moduleProgressRef = doc(db, 'userProgress', userId, 'modules', moduleId);
        const courseRef = doc(db, 'courses', courseId);
        const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
        const userSnap = await transaction.get(userRef);
        const moduleProgressSnap = await transaction.get(moduleProgressRef);
        const courseSnap = await transaction.get(courseRef);
        const moduleSnap = await transaction.get(moduleRef);
        transaction.set(lessonProgressRef, {
          viewed: true,
          viewedAt: new Date().toISOString()
        });
        const moduleLessonCount = moduleSnap.exists() ? moduleSnap.data().lessonCount : 0;
        const moduleCompletedLessons = moduleProgressSnap.exists()
          ? moduleProgressSnap.data().completedLessons + 1
          : 1;
        const moduleProgressPercentage = moduleLessonCount > 0
          ? Math.round((moduleCompletedLessons / moduleLessonCount) * 100)
          : 0;
        transaction.set(
          moduleProgressRef,
          {
            completedLessons: moduleCompletedLessons,
            totalLessons: moduleLessonCount,
            progressPercentage: moduleProgressPercentage
          },
          { merge: true }
        );
        const courseTotalLessons = courseSnap.exists() ? courseSnap.data().totalLessons : 0;
        const userCompletedLessons = userSnap.exists()
          ? (userSnap.data().completedLessons || 0) + 1
          : 1;
        const userProgressPercentage = courseTotalLessons > 0
          ? Math.round((userCompletedLessons / courseTotalLessons) * 100)
          : 0;
        const currentActivity = userSnap.exists() ? userSnap.data().recentActivity || [] : [];
        const newActivity: RecentActivity = {
          lessonId,
          lessonTitle,
          moduleId,
          timestamp: new Date().toISOString()
        };
        const updatedActivity = [newActivity, ...currentActivity].slice(0, 20);
        transaction.update(userRef, {
          completedLessons: userCompletedLessons,
          totalLessons: courseTotalLessons,
          progressPercentage: userProgressPercentage,
          lastActive: new Date().toISOString(),
          recentActivity: updatedActivity
        });
      });
      console.log('Lesson view registered successfully');
    } else {
      await updateDoc(doc(db, 'users', userId), {
        lastActive: new Date().toISOString()
      });
      console.log('Lesson already viewed, only updated lastActive');
    }
  } catch (error) {
    console.error('Error registering lesson view:', error);
    throw error;
  }
};
export const getLessonProgress = async (
  userId: string,
  moduleId: string,
  lessonId: string
): Promise<LessonProgress> => {
  try {
    const lessonProgressRef = doc(
      db,
      'userProgress',
      userId,
      'modules',
      moduleId,
      'lessons',
      lessonId
    );
    const lessonProgressSnap = await getDoc(lessonProgressRef);
    if (lessonProgressSnap.exists()) {
      const data = lessonProgressSnap.data();
      return {
        viewed: data.viewed || false,
        viewedAt: data.viewedAt || null
      };
    }
    return {
      viewed: false,
      viewedAt: null
    };
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    return {
      viewed: false,
      viewedAt: null
    };
  }
};
export const getModuleProgress = async (
  userId: string,
  moduleId: string
): Promise<ModuleProgress> => {
  try {
    const moduleProgressRef = doc(db, 'userProgress', userId, 'modules', moduleId);
    const moduleProgressSnap = await getDoc(moduleProgressRef);
    if (moduleProgressSnap.exists()) {
      const data = moduleProgressSnap.data();
      return {
        completedLessons: data.completedLessons || 0,
        totalLessons: data.totalLessons || 0,
        progressPercentage: data.progressPercentage || 0
      };
    }
    return {
      completedLessons: 0,
      totalLessons: 0,
      progressPercentage: 0
    };
  } catch (error) {
    console.error('Error getting module progress:', error);
    return {
      completedLessons: 0,
      totalLessons: 0,
      progressPercentage: 0
    };
  }
};
export const getUserProgress = async (userId: string): Promise<UserProgress> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        completedLessons: data.completedLessons || 0,
        totalLessons: data.totalLessons || 0,
        progressPercentage: data.progressPercentage || 0,
        lastActive: data.lastActive || '',
        recentActivity: data.recentActivity || []
      };
    }
    return {
      completedLessons: 0,
      totalLessons: 0,
      progressPercentage: 0,
      lastActive: '',
      recentActivity: []
    };
  } catch (error) {
    console.error('Error getting user progress:', error);
    return {
      completedLessons: 0,
      totalLessons: 0,
      progressPercentage: 0,
      lastActive: '',
      recentActivity: []
    };
  }
};
export const getAllModulesProgress = async (
  userId: string,
  courseId: string
): Promise<Map<string, ModuleProgress>> => {
  try {
    const progressMap = new Map<string, ModuleProgress>();
    const modulesRef = collection(db, 'courses', courseId, 'modules');
    const modulesSnap = await getDocs(modulesRef);
    for (const moduleDoc of modulesSnap.docs) {
      const moduleId = moduleDoc.id;
      const progress = await getModuleProgress(userId, moduleId);
      progressMap.set(moduleId, progress);
    }
    return progressMap;
  } catch (error) {
    console.error('Error getting all modules progress:', error);
    return new Map();
  }
};
export const initializeUserProgress = async (userId: string, courseId: string): Promise<void> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) {
      console.warn('Course not found');
      return;
    }
    const courseData = courseSnap.data();
    const totalLessons = courseData.totalLessons || 0;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      totalLessons: totalLessons,
      completedLessons: 0,
      progressPercentage: 0,
      recentActivity: []
    });
    console.log('User progress initialized');
  } catch (error) {
    console.error('Error initializing user progress:', error);
    throw error;
  }
};
export const getModuleLessons = async (courseId: string, moduleId: string): Promise<any[]> => {
  try {
    const lessonsRef = collection(db, 'courses', courseId, 'modules', moduleId, 'lessons');
    const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
    const lessonsSnap = await getDocs(lessonsQuery);
    return lessonsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting module lessons:', error);
    return [];
  }
};
export const recalculateUserProgress = async (userId: string, courseId: string): Promise<void> => {
  try {
    const modulesRef = collection(db, 'userProgress', userId, 'modules');
    const modulesSnap = await getDocs(modulesRef);
    let totalCompleted = 0;
    for (const moduleDoc of modulesSnap.docs) {
      const lessonsRef = collection(db, 'userProgress', userId, 'modules', moduleDoc.id, 'lessons');
      const lessonsSnap = await getDocs(lessonsRef);
      const viewedCount = lessonsSnap.docs.filter(doc => doc.data().viewed).length;
      totalCompleted += viewedCount;
    }
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    const totalLessons = courseSnap.exists() ? courseSnap.data().totalLessons : 0;
    const progressPercentage = totalLessons > 0
      ? Math.round((totalCompleted / totalLessons) * 100)
      : 0;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      completedLessons: totalCompleted,
      totalLessons: totalLessons,
      progressPercentage: progressPercentage
    });
    console.log('User progress recalculated');
  } catch (error) {
    console.error('Error recalculating user progress:', error);
    throw error;
  }
};