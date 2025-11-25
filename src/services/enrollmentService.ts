import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
  increment
} from 'firebase/firestore';

export interface ModuleEnrollment {
  user_id: string;
  module_id: string;
  module_type: 'main_module' | 'submodule';
  enrolled_at: string;
  last_accessed: string;
  progress_percentage: number;
  completed: boolean;
  completed_at?: string;
}

export interface CourseProgress {
  user_id: string;
  course_id: string;
  module_id: string;
  enrolled_at: string;
  last_accessed: string;
  video_progress: number;
  video_duration: number;
  completed: boolean;
  completed_at?: string;
}

export interface VideoProgress {
  user_id: string;
  course_id: string;
  video_url: string;
  current_time: number;
  duration: number;
  last_watched: string;
  completed: boolean;
}

export const enrollInModule = async (
  userId: string,
  moduleId: string,
  moduleType: 'main_module' | 'submodule'
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${moduleId}`);

    const enrollment = {
      user_id: userId,
      course_id: moduleId,
      module_id: moduleId,
      module_type: moduleType,
      enrolled_at: Timestamp.now(),
      last_accessed: Timestamp.now(),
      progress_percentage: 0,
      completed: false
    };

    await setDoc(enrollmentRef, enrollment);
    console.log('Enrolled in module:', moduleId);
  } catch (error) {
    console.error('Error enrolling in module:', error);
    throw error;
  }
};

export const isEnrolledInModule = async (
  userId: string,
  moduleId: string
): Promise<boolean> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${moduleId}`);
    const enrollmentSnap = await getDoc(enrollmentRef);
    return enrollmentSnap.exists();
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
};

export const getModuleEnrollment = async (
  userId: string,
  moduleId: string
): Promise<ModuleEnrollment | null> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${moduleId}`);
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (enrollmentSnap.exists()) {
      return enrollmentSnap.data() as ModuleEnrollment;
    }
    return null;
  } catch (error) {
    console.error('Error getting module enrollment:', error);
    return null;
  }
};

export const updateLastAccessed = async (
  userId: string,
  moduleId: string
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${moduleId}`);
    await setDoc(enrollmentRef, {
      last_accessed: Timestamp.now()
    }, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('⚠️ Last accessed permission denied - deploy Firestore rules to fix');
      return;
    }
    console.error('Error updating last accessed:', error);
  }
};

export const trackCourseProgress = async (
  userId: string,
  courseId: string,
  moduleId: string,
  videoProgress: number,
  videoDuration: number
): Promise<void> => {
  try {
    const progressRef = doc(db, 'course_progress', `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);

    const isCompleted = videoProgress >= videoDuration * 0.9;

    if (progressSnap.exists()) {
      const updates: any = {
        last_accessed: new Date().toISOString(),
        video_progress: videoProgress,
        video_duration: videoDuration,
        completed: isCompleted
      };

      if (isCompleted && !progressSnap.data().completed) {
        updates.completed_at = new Date().toISOString();
      }

      await updateDoc(progressRef, updates);
    } else {
      const progress: CourseProgress = {
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        enrolled_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        video_progress: videoProgress,
        video_duration: videoDuration,
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : undefined
      };

      await setDoc(progressRef, progress);
    }

    await updateModuleProgress(userId, moduleId);
  } catch (error: any) {
    // Suppress permission errors until Firestore rules are deployed
    if (error?.code === 'permission-denied') {
      console.warn('⚠️ Course progress permission denied - deploy Firestore rules to fix');
      return;
    }
    console.error('Error tracking course progress:', error);
    throw error;
  }
};

export const getCourseProgress = async (
  userId: string,
  courseId: string
): Promise<CourseProgress | null> => {
  try {
    const progressRef = doc(db, 'course_progress', `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      return progressSnap.data() as CourseProgress;
    }
    return null;
  } catch (error) {
    console.error('Error getting course progress:', error);
    return null;
  }
};

export const updateModuleProgress = async (
  userId: string,
  moduleId: string
): Promise<void> => {
  try {
    const progressQuery = query(
      collection(db, 'course_progress'),
      where('user_id', '==', userId),
      where('module_id', '==', moduleId)
    );

    const progressSnap = await getDocs(progressQuery);
    const totalCourses = progressSnap.size;

    if (totalCourses === 0) return;

    const completedCourses = progressSnap.docs.filter(
      doc => doc.data().completed
    ).length;

    const progressPercentage = (completedCourses / totalCourses) * 100;
    const isModuleCompleted = progressPercentage === 100;

    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${moduleId}`);
    const updates: any = {
      progress_percentage: progressPercentage,
      completed: isModuleCompleted,
      last_accessed: Timestamp.now()
    };

    if (isModuleCompleted) {
      const enrollmentSnap = await getDoc(enrollmentRef);
      if (enrollmentSnap.exists() && !enrollmentSnap.data().completed) {
        updates.completed_at = Timestamp.now();
      }
    }

    await setDoc(enrollmentRef, updates, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('⚠️ Module progress permission denied - deploy Firestore rules to fix');
      return;
    }
    console.error('Error updating module progress:', error);
  }
};

export const saveVideoProgress = async (
  userId: string,
  courseId: string,
  videoUrl: string,
  currentTime: number,
  duration: number
): Promise<void> => {
  try {
    const videoProgressRef = doc(db, 'video_progress', `${userId}_${courseId}`);

    const videoProgress: VideoProgress = {
      user_id: userId,
      course_id: courseId,
      video_url: videoUrl,
      current_time: currentTime,
      duration: duration,
      last_watched: new Date().toISOString(),
      completed: currentTime >= duration * 0.9
    };

    await setDoc(videoProgressRef, videoProgress);
  } catch (error) {
    console.error('Error saving video progress:', error);
  }
};

export const getVideoProgress = async (
  userId: string,
  courseId: string
): Promise<VideoProgress | null> => {
  try {
    const videoProgressRef = doc(db, 'video_progress', `${userId}_${courseId}`);
    const videoProgressSnap = await getDoc(videoProgressRef);

    if (videoProgressSnap.exists()) {
      return videoProgressSnap.data() as VideoProgress;
    }
    return null;
  } catch (error) {
    console.error('Error getting video progress:', error);
    return null;
  }
};

export const getUserEnrollments = async (
  userId: string
): Promise<ModuleEnrollment[]> => {
  try {
    const enrollmentsQuery = query(
      collection(db, 'course_enrollments'),
      where('user_id', '==', userId)
    );

    const enrollmentsSnap = await getDocs(enrollmentsQuery);
    return enrollmentsSnap.docs.map(doc => doc.data() as ModuleEnrollment);
  } catch (error) {
    console.error('Error getting user enrollments:', error);
    return [];
  }
};

export const getAverageProgress = async (userId: string): Promise<number> => {
  try {
    const enrollments = await getUserEnrollments(userId);
    if (enrollments.length === 0) return 0;

    const totalProgress = enrollments.reduce(
      (sum, enrollment) => sum + (enrollment.progress_percentage || 0),
      0
    );

    return Math.round(totalProgress / enrollments.length);
  } catch (error) {
    console.error('Error getting average progress:', error);
    return 0;
  }
};

export const getCompletedModulesCount = async (userId: string): Promise<number> => {
  try {
    const enrollments = await getUserEnrollments(userId);
    return enrollments.filter(e => e.completed).length;
  } catch (error) {
    console.error('Error getting completed modules count:', error);
    return 0;
  }
};

export const getInProgressModulesCount = async (userId: string): Promise<number> => {
  try {
    const enrollments = await getUserEnrollments(userId);
    return enrollments.filter(e => !e.completed && e.progress_percentage > 0).length;
  } catch (error) {
    console.error('Error getting in-progress modules count:', error);
    return 0;
  }
};

// Course Enrollments (using course_enrollments collection)
export interface CourseEnrollment {
  user_id: string;
  course_id: string;
  enrolled_at: Timestamp;
  last_accessed: Timestamp;
  progress_percentage: number;
  completed: boolean;
  completed_at?: Timestamp;
  current_module?: string;
  current_lesson?: string;
}

export const enrollInCourse = async (
  userId: string,
  courseId: string
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);

    // Check if already enrolled
    const existingEnrollment = await getDoc(enrollmentRef);
    if (existingEnrollment.exists()) {
      console.log('Already enrolled in course:', courseId);
      return;
    }

    const enrollment: CourseEnrollment = {
      user_id: userId,
      course_id: courseId,
      enrolled_at: Timestamp.now(),
      last_accessed: Timestamp.now(),
      progress_percentage: 0,
      completed: false
    };

    await setDoc(enrollmentRef, enrollment);
    console.log('Enrolled in course:', courseId);
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

export const isEnrolledInCourse = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);
    const enrollmentSnap = await getDoc(enrollmentRef);
    return enrollmentSnap.exists();
  } catch (error) {
    console.error('Error checking course enrollment:', error);
    return false;
  }
};

export const getCourseEnrollment = async (
  userId: string,
  courseId: string
): Promise<CourseEnrollment | null> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (enrollmentSnap.exists()) {
      return enrollmentSnap.data() as CourseEnrollment;
    }
    return null;
  } catch (error) {
    console.error('Error getting course enrollment:', error);
    return null;
  }
};

export const updateCourseProgress = async (
  userId: string,
  courseId: string,
  progressPercentage: number,
  currentModule?: string,
  currentLesson?: string
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);
    const isCompleted = progressPercentage >= 100;

    const updates: any = {
      last_accessed: Timestamp.now(),
      progress_percentage: progressPercentage,
      completed: isCompleted
    };

    if (currentModule) updates.current_module = currentModule;
    if (currentLesson) updates.current_lesson = currentLesson;

    if (isCompleted) {
      const existingEnrollment = await getDoc(enrollmentRef);
      if (existingEnrollment.exists() && !existingEnrollment.data().completed) {
        updates.completed_at = Timestamp.now();
      }
    }

    await setDoc(enrollmentRef, updates, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      console.warn('⚠️ Course enrollment update permission denied - deploy Firestore rules to fix');
      return;
    }
    console.error('Error updating course progress:', error);
  }
};

export const getUserCourseEnrollments = async (
  userId: string
): Promise<CourseEnrollment[]> => {
  try {
    const enrollmentsQuery = query(
      collection(db, 'course_enrollments'),
      where('user_id', '==', userId)
    );

    const enrollmentsSnap = await getDocs(enrollmentsQuery);
    return enrollmentsSnap.docs.map(doc => doc.data() as CourseEnrollment);
  } catch (error) {
    console.error('Error getting user course enrollments:', error);
    return [];
  }
};
