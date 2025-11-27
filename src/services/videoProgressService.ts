import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction
} from 'firebase/firestore';

export interface VideoProgress {
  videoNumber: 1 | 2;
  watchedPercentage: number;
  completed: boolean;
  completedAt: string | null;
  lastWatchedAt: string;
}

export interface ModuleVideoProgress {
  userId: string;
  moduleId: string;
  video1: VideoProgress;
  video2: VideoProgress;
  quizCompleted: boolean;
  quizScore: number | null;
  quizCompletedAt: string | null;
  overallProgress: number;
  canAccessVideo2: boolean;
  canTakeQuiz: boolean;
  submodulesUnlocked: boolean;
}

export const initializeModuleProgress = async (
  userId: string,
  moduleId: string
): Promise<ModuleVideoProgress> => {
  const progressRef = doc(db, 'videoProgress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    return progressSnap.data() as ModuleVideoProgress;
  }

  const initialProgress: ModuleVideoProgress = {
    userId,
    moduleId,
    video1: {
      videoNumber: 1,
      watchedPercentage: 0,
      completed: false,
      completedAt: null,
      lastWatchedAt: new Date().toISOString()
    },
    video2: {
      videoNumber: 2,
      watchedPercentage: 0,
      completed: false,
      completedAt: null,
      lastWatchedAt: new Date().toISOString()
    },
    quizCompleted: false,
    quizScore: null,
    quizCompletedAt: null,
    overallProgress: 0,
    canAccessVideo2: false,
    canTakeQuiz: false,
    submodulesUnlocked: false
  };

  await setDoc(progressRef, initialProgress);
  return initialProgress;
};

export const getModuleProgress = async (
  userId: string,
  moduleId: string
): Promise<ModuleVideoProgress | null> => {
  const progressRef = doc(db, 'videoProgress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    return progressSnap.data() as ModuleVideoProgress;
  }

  return null;
};

export const updateVideoProgress = async (
  userId: string,
  moduleId: string,
  videoNumber: 1 | 2,
  watchedPercentage: number
): Promise<void> => {
  const progressRef = doc(db, 'videoProgress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (!progressSnap.exists()) {
    await initializeModuleProgress(userId, moduleId);
  }

  const videoKey = videoNumber === 1 ? 'video1' : 'video2';

  await updateDoc(progressRef, {
    [`${videoKey}.watchedPercentage`]: watchedPercentage,
    [`${videoKey}.lastWatchedAt`]: new Date().toISOString()
  });
};

export const markVideoComplete = async (
  userId: string,
  moduleId: string,
  videoNumber: 1 | 2
): Promise<{ success: boolean; message: string }> => {
  const progressRef = doc(db, 'videoProgress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (!progressSnap.exists()) {
    return { success: false, message: 'Progress not found' };
  }

  const progress = progressSnap.data() as ModuleVideoProgress;
  const video = videoNumber === 1 ? progress.video1 : progress.video2;

  if (video.watchedPercentage < 80) {
    return {
      success: false,
      message: `You must watch at least 80% of video ${videoNumber} to mark it as complete. Current: ${Math.round(video.watchedPercentage)}%`
    };
  }

  if (video.completed) {
    return {
      success: false,
      message: `Video ${videoNumber} is already marked as complete!`
    };
  }

  const videoKey = videoNumber === 1 ? 'video1' : 'video2';
  const updates: any = {
    [`${videoKey}.completed`]: true,
    [`${videoKey}.completedAt`]: new Date().toISOString(),
    [`${videoKey}.watchedPercentage`]: 100
  };

  let completedVideos = 0;
  if (videoNumber === 1) {
    completedVideos = 1 + (progress.video2.completed ? 1 : 0);
    updates.canAccessVideo2 = true;
  } else if (videoNumber === 2) {
    completedVideos = (progress.video1.completed ? 1 : 0) + 1;
    updates.canTakeQuiz = true;
  }

  const totalVideos = 2;
  updates.overallProgress = Math.round((completedVideos / totalVideos) * 100);

  await updateDoc(progressRef, updates);

  await updateModuleEnrollmentProgress(userId, moduleId, updates.overallProgress);

  return { success: true, message: `Video ${videoNumber} marked as complete!` };
};

export const submitQuiz = async (
  userId: string,
  moduleId: string,
  score: number
): Promise<{ success: boolean; message: string; passed: boolean }> => {
  const progressRef = doc(db, 'videoProgress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (!progressSnap.exists()) {
    return { success: false, message: 'Progress not found', passed: false };
  }

  const progress = progressSnap.data() as ModuleVideoProgress;

  if (!progress.video2.completed) {
    return {
      success: false,
      message: 'You must complete video 2 before taking the quiz',
      passed: false
    };
  }

  const passed = score >= 70;

  await updateDoc(progressRef, {
    quizCompleted: true,
    quizScore: score,
    quizCompletedAt: new Date().toISOString(),
    submodulesUnlocked: passed
  });

  if (passed) {
    await updateUserPoints(userId, 100, 'Module quiz passed');
  }

  return {
    success: true,
    message: passed
      ? 'Congratulations! You passed the quiz and unlocked submodules!'
      : 'Quiz completed. Score 70% or higher to unlock submodules.',
    passed
  };
};

const updateUserPoints = async (
  userId: string,
  points: number,
  reason: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (userSnap.exists()) {
        const currentPoints = userSnap.data().points || 0;
        transaction.update(userRef, {
          points: currentPoints + points,
          lastPointsUpdate: new Date().toISOString(),
          lastPointsReason: reason
        });
      }
    });
  } catch (error) {
    console.error('Error updating user points:', error);
  }
};

export const getUserModulesProgress = async (
  userId: string
): Promise<ModuleVideoProgress[]> => {
  const q = query(
    collection(db, 'videoProgress'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ModuleVideoProgress);
};

export const getAverageProgress = async (userId: string): Promise<number> => {
  const progressList = await getUserModulesProgress(userId);

  if (progressList.length === 0) return 0;

  const totalProgress = progressList.reduce(
    (sum, progress) => sum + progress.overallProgress,
    0
  );

  return Math.round(totalProgress / progressList.length);
};

export const recalculateModuleProgress = async (
  userId: string,
  moduleId: string
): Promise<number> => {
  try {
    const progressRef = doc(db, 'videoProgress', `${userId}_${moduleId}`);
    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) {
      return 0;
    }

    const progress = progressSnap.data() as ModuleVideoProgress;
    let completedVideos = 0;
    if (progress.video1.completed) completedVideos++;
    if (progress.video2.completed) completedVideos++;

    const totalVideos = 2;
    const overallProgress = Math.round((completedVideos / totalVideos) * 100);

    await updateDoc(progressRef, { overallProgress });
    await updateModuleEnrollmentProgress(userId, moduleId, overallProgress);

    return overallProgress;
  } catch (error) {
    console.error('Error recalculating module progress:', error);
    return 0;
  }
};

const updateModuleEnrollmentProgress = async (
  userId: string,
  moduleId: string,
  progressPercentage: number
): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${moduleId}`);
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (enrollmentSnap.exists()) {
      const updates: any = {
        progress_percentage: progressPercentage,
        last_accessed: Timestamp.now()
      };

      if (progressPercentage >= 100) {
        updates.completed = true;
        if (!enrollmentSnap.data().completed) {
          updates.completed_at = Timestamp.now();
        }
      }

      await updateDoc(enrollmentRef, updates);
    }
  } catch (error) {
    console.error('Error updating module enrollment progress:', error);
  }
};
