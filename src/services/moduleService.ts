import { db } from '../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

export interface ModuleLesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: string;
  order: number;
  isIntro: boolean;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  category: 'grooming' | 'service' | 'safety' | 'interview' | 'language';
  order: number;
  lessons: ModuleLesson[];
  quiz_id?: string;
  visible: boolean;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

export interface UserModuleProgress {
  user_id: string;
  module_id: string;
  completed_courses: string[];
  completed_lessons: string[];
  quiz_passed: boolean;
  quiz_score?: number;
  quiz_attempts: number;
  last_attempt_at?: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export const createModule = async (moduleData: Omit<Module, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    console.log('Creating module in Firestore...');
    const moduleRef = doc(collection(db, 'modules'));
    const now = new Date().toISOString();

    const newModule: Module = {
      id: moduleRef.id,
      ...moduleData,
      created_at: now,
      updated_at: now
    };

    console.log('Module data prepared:', { id: newModule.id, name: newModule.name });
    await setDoc(moduleRef, newModule);
    console.log('Module saved to Firestore successfully');
    return moduleRef.id;
  } catch (error) {
    console.error('Error in createModule:', error);
    throw error;
  }
};

export const updateModule = async (moduleId: string, updates: Partial<Module>): Promise<void> => {
  const moduleRef = doc(db, 'modules', moduleId);
  await updateDoc(moduleRef, {
    ...updates,
    updated_at: new Date().toISOString()
  });
};

export const deleteModule = async (moduleId: string): Promise<void> => {
  const moduleRef = doc(db, 'modules', moduleId);
  await deleteDoc(moduleRef);
};

export const getModule = async (moduleId: string): Promise<Module | null> => {
  const moduleRef = doc(db, 'modules', moduleId);
  const moduleSnap = await getDoc(moduleRef);
  return moduleSnap.exists() ? moduleSnap.data() as Module : null;
};

export const getModulesByCategory = async (category: string): Promise<Module[]> => {
  const modulesRef = collection(db, 'modules');
  const q = query(
    modulesRef,
    where('category', '==', category),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Module);
};

export const getAllModules = async (): Promise<Module[]> => {
  try {
    const modulesRef = collection(db, 'modules');
    console.log('Fetching modules from Firestore...');

    // Try with composite index first
    try {
      const q = query(modulesRef, orderBy('category', 'asc'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      console.log('Modules fetched with composite index:', snapshot.size);
      return snapshot.docs.map(doc => doc.data() as Module);
    } catch (indexError: any) {
      // If composite index doesn't exist, fetch all and sort in memory
      console.warn('Composite index not found, fetching all modules:', indexError.message);
      const snapshot = await getDocs(modulesRef);
      console.log('Modules fetched without index:', snapshot.size);
      const modules = snapshot.docs.map(doc => doc.data() as Module);

      // Sort in memory
      return modules.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.order - b.order;
      });
    }
  } catch (error) {
    console.error('Error in getAllModules:', error);
    throw error;
  }
};

export const getVisibleRootModules = async (): Promise<Module[]> => {
  try {
    const modulesRef = collection(db, 'modules');
    console.log('Fetching visible root modules (order = 1)...');

    const snapshot = await getDocs(modulesRef);
    const modules = snapshot.docs.map(doc => doc.data() as Module);

    // Filter for visible modules with order = 1
    const rootModules = modules.filter(module =>
      module.visible === true && module.order === 1
    );

    console.log('Visible root modules found:', rootModules.length);
    return rootModules.sort((a, b) => a.category.localeCompare(b.category));
  } catch (error) {
    console.error('Error in getVisibleRootModules:', error);
    throw error;
  }
};

export const getUserModuleProgress = async (userId: string, moduleId: string): Promise<UserModuleProgress | null> => {
  const progressRef = doc(db, 'user_module_progress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);
  return progressSnap.exists() ? progressSnap.data() as UserModuleProgress : null;
};

export const initializeUserModuleProgress = async (userId: string, moduleId: string, isFirstModule: boolean = false): Promise<void> => {
  const progressRef = doc(db, 'user_module_progress', `${userId}_${moduleId}`);

  const progress: UserModuleProgress = {
    user_id: userId,
    module_id: moduleId,
    completed_courses: [],
    completed_lessons: [],
    quiz_passed: false,
    quiz_attempts: 0,
    unlocked: isFirstModule,
    unlocked_at: isFirstModule ? new Date().toISOString() : undefined
  };

  await setDoc(progressRef, progress);
};

export const markCourseComplete = async (userId: string, moduleId: string, courseId: string): Promise<void> => {
  const progressRef = doc(db, 'user_module_progress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    const progress = progressSnap.data() as UserModuleProgress;
    if (!progress.completed_courses.includes(courseId)) {
      progress.completed_courses.push(courseId);
      await updateDoc(progressRef, { completed_courses: progress.completed_courses });
    }
  } else {
    await initializeUserModuleProgress(userId, moduleId);
    await updateDoc(progressRef, { completed_courses: [courseId] });
  }
};

export const updateQuizResult = async (
  userId: string,
  moduleId: string,
  score: number,
  passed: boolean
): Promise<void> => {
  const progressRef = doc(db, 'user_module_progress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    const progress = progressSnap.data() as UserModuleProgress;
    await updateDoc(progressRef, {
      quiz_passed: passed,
      quiz_score: score,
      quiz_attempts: progress.quiz_attempts + 1,
      last_attempt_at: new Date().toISOString()
    });

    if (passed) {
      await unlockNextModule(userId, moduleId);
    }
  }
};

export const unlockNextModule = async (userId: string, currentModuleId: string): Promise<void> => {
  const currentModule = await getModule(currentModuleId);
  if (!currentModule) return;

  const allModules = await getModulesByCategory(currentModule.category);
  const currentIndex = allModules.findIndex(m => m.id === currentModuleId);

  if (currentIndex !== -1 && currentIndex < allModules.length - 1) {
    const nextModule = allModules[currentIndex + 1];
    const nextProgressRef = doc(db, 'user_module_progress', `${userId}_${nextModule.id}`);

    const nextProgressSnap = await getDoc(nextProgressRef);
    if (nextProgressSnap.exists()) {
      await updateDoc(nextProgressRef, {
        unlocked: true,
        unlocked_at: new Date().toISOString()
      });
    } else {
      await setDoc(nextProgressRef, {
        user_id: userId,
        module_id: nextModule.id,
        completed_courses: [],
        quiz_passed: false,
        quiz_attempts: 0,
        unlocked: true,
        unlocked_at: new Date().toISOString()
      });
    }
  }
};

export const getUserProgressForCategory = async (userId: string, category: string): Promise<Map<string, UserModuleProgress>> => {
  const modules = await getModulesByCategory(category);
  const progressMap = new Map<string, UserModuleProgress>();

  for (const module of modules) {
    const progress = await getUserModuleProgress(userId, module.id);
    if (progress) {
      progressMap.set(module.id, progress);
    } else {
      const isFirstModule = module.order === 1;
      await initializeUserModuleProgress(userId, module.id, isFirstModule);
      const newProgress = await getUserModuleProgress(userId, module.id);
      if (newProgress) {
        progressMap.set(module.id, newProgress);
      }
    }
  }

  return progressMap;
};

export const isModuleUnlocked = async (userId: string, moduleId: string): Promise<boolean> => {
  const progress = await getUserModuleProgress(userId, moduleId);

  if (!progress) {
    const module = await getModule(moduleId);
    if (module?.order === 1) {
      await initializeUserModuleProgress(userId, moduleId, true);
      return true;
    }
    return false;
  }

  return progress.unlocked;
};

export const canTakeModuleQuiz = async (userId: string, moduleId: string, coursesInModule: string[]): Promise<boolean> => {
  const progress = await getUserModuleProgress(userId, moduleId);
  if (!progress) return false;

  return coursesInModule.every(courseId => progress.completed_courses.includes(courseId));
};

export const markLessonComplete = async (userId: string, moduleId: string, lessonId: string): Promise<void> => {
  const progressRef = doc(db, 'user_module_progress', `${userId}_${moduleId}`);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    const progress = progressSnap.data() as UserModuleProgress;
    if (!progress.completed_lessons.includes(lessonId)) {
      progress.completed_lessons.push(lessonId);
      await updateDoc(progressRef, { completed_lessons: progress.completed_lessons });
    }
  } else {
    await initializeUserModuleProgress(userId, moduleId);
    await updateDoc(progressRef, { completed_lessons: [lessonId] });
  }
};

export const isLessonUnlocked = async (userId: string, moduleId: string, module: Module, lessonId: string): Promise<boolean> => {
  const lesson = module.lessons.find(l => l.id === lessonId);
  if (!lesson) return false;

  if (lesson.isIntro) return true;

  const progress = await getUserModuleProgress(userId, moduleId);
  if (!progress) return false;

  const prevLesson = module.lessons.find(l => l.order === lesson.order - 1);
  if (!prevLesson) return false;

  return progress.completed_lessons.includes(prevLesson.id) && progress.quiz_passed;
};

export const canWatchNextLesson = async (userId: string, moduleId: string, currentLessonId: string, module: Module): Promise<boolean> => {
  const progress = await getUserModuleProgress(userId, moduleId);
  if (!progress) return false;

  const currentLesson = module.lessons.find(l => l.id === currentLessonId);
  if (!currentLesson || currentLesson.isIntro) return true;

  return progress.quiz_passed;
};
