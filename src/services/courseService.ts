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
  orderBy
} from 'firebase/firestore';
import { uploadPDFToStorage, deletePDFFromStorage } from './storageService';

export const enrollInCourse = async (userId: string, courseId: string): Promise<void> => {
  const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);

  await setDoc(enrollmentRef, {
    user_id: userId,
    course_id: courseId,
    enrolled_at: new Date().toISOString(),
    progress: 0,
    completed: false,
    last_accessed: new Date().toISOString()
  });
};

export const isEnrolledInCourse = async (userId: string, courseId: string): Promise<boolean> => {
  const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);
  const enrollmentSnap = await getDoc(enrollmentRef);
  return enrollmentSnap.exists();
};

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress?: number;
  progress_percentage?: number;
  completed: boolean;
  last_accessed?: string;
}

export const getUserEnrollments = async (userId: string): Promise<Enrollment[]> => {
  const enrollmentsRef = collection(db, 'course_enrollments');
  const q = query(enrollmentsRef, where('user_id', '==', userId), orderBy('enrolled_at', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    const progress = data.progress_percentage || data.progress || 0;
    return { id: doc.id, ...data, progress } as Enrollment;
  });
};

export const getEnrolledCourses = async (userId: string): Promise<Course[]> => {
  try {
    const enrollments = await getUserEnrollments(userId);
    const courseIds = enrollments.map(e => e.course_id);

    if (courseIds.length === 0) return [];

    const courses: Course[] = [];
    for (const courseId of courseIds) {
      const course = await getCourseById(courseId);
      if (course) {
        courses.push(course);
      }
    }

    return courses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return [];
  }
};

export const updateCourseProgress = async (userId: string, courseId: string, progress: number): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);
    const enrollmentSnap = await getDoc(enrollmentRef);

    const completed = progress >= 100;

    if (enrollmentSnap.exists()) {
      await updateDoc(enrollmentRef, {
        progress,
        completed,
        last_accessed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      await setDoc(enrollmentRef, {
        user_id: userId,
        course_id: courseId,
        progress,
        completed,
        enrolled_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};

// Calculate module progress based on completed courses
export const calculateModuleProgress = async (
  userId: string,
  courseIds: string[]
): Promise<{ progress: number; completedCount: number; totalCount: number }> => {
  try {
    const totalCourses = courseIds.filter(id => id).length;

    if (totalCourses === 0) {
      return { progress: 0, completedCount: 0, totalCount: 0 };
    }

    let completedCount = 0;

    for (const courseId of courseIds) {
      if (!courseId) continue;

      const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${courseId}`);
      const enrollmentSnap = await getDoc(enrollmentRef);

      if (enrollmentSnap.exists()) {
        const data = enrollmentSnap.data();
        if (data.completed) {
          completedCount++;
        }
      }
    }

    const progress = Math.round((completedCount / totalCourses) * 100);

    return { progress, completedCount, totalCount: totalCourses };
  } catch (error) {
    console.error('Error calculating module progress:', error);
    return { progress: 0, completedCount: 0, totalCount: 0 };
  }
};

export const isCourseUnlocked = async (userId: string, course: Course): Promise<boolean> => {
  try {
    if (!course.module_id && !course.submodule_id) {
      return true;
    }

    const moduleId = course.module_id || course.submodule_id;
    if (!moduleId) return true;

    const coursesRef = collection(db, 'courses');
    const q = query(
      coursesRef,
      where(course.module_id ? 'module_id' : 'submodule_id', '==', moduleId),
      orderBy('order_in_module', 'asc')
    );

    const snapshot = await getDocs(q);
    const moduleCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];

    const currentIndex = moduleCourses.findIndex(c => c.id === course.id);
    if (currentIndex === 0) return true;

    const previousCourse = moduleCourses[currentIndex - 1];
    if (!previousCourse) return true;

    // Check if previous course is completed
    const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${previousCourse.id}`);
    const enrollmentSnap = await getDoc(enrollmentRef);

    if (!enrollmentSnap.exists()) {
      console.log(`Course ${course.title} locked: previous course not started`);
      return false;
    }

    const enrollment = enrollmentSnap.data();
    if (!enrollment.completed || enrollment.progress < 100) {
      console.log(`Course ${course.title} locked: previous course not completed`);
      return false;
    }

    // Check if previous course has an exam that needs to be passed
    const examsRef = collection(db, 'exams');
    const examQuery = query(examsRef, where('courseId', '==', previousCourse.id));
    const examSnapshot = await getDocs(examQuery);

    if (!examSnapshot.empty) {
      // Previous course has an exam - check if passed
      const exam = examSnapshot.docs[0];
      const examId = exam.id;

      const resultRef = doc(db, 'userExams', `${examId}_${userId}_latest`);
      const resultSnap = await getDoc(resultRef);

      if (!resultSnap.exists()) {
        console.log(`Course ${course.title} locked: previous course exam not attempted`);
        return false;
      }

      const result = resultSnap.data();
      if (!result.passed) {
        console.log(`Course ${course.title} locked: previous course exam not passed`);
        return false;
      }
    }

    console.log(`Course ${course.title} unlocked: all requirements met`);
    return true;
  } catch (error) {
    console.error('Error checking course unlock status:', error);
    return true;
  }
};

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  plan: 'free' | 'pro' | 'vip';
  category: 'grooming' | 'service' | 'safety' | 'interview' | 'language';
  lessons: number;
  coach_id: string;
  pdf_url?: string;
  pdf_path?: string;
  video_url?: string;
  allow_download: boolean;
  content_type: 'pdf' | 'video' | 'text';
  suppressed?: boolean;
  suppressed_at?: string;
  module_id?: string;
  main_module_id?: string;
  submodule_id?: string;
  order_in_module?: number;
  visible?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  plan: 'free' | 'pro' | 'vip';
  category: 'grooming' | 'service' | 'safety' | 'interview' | 'language';
  lessons?: number;
  pdfFile?: File;
  video_url?: string;
  subtitle?: string;
  allow_download: boolean;
  content_type: 'pdf' | 'video' | 'text';
  module_id?: string;
  submodule_id?: string;
  order_in_module?: number;
  visible?: boolean;
}

export const createCourse = async (data: CreateCourseData, coachId: string): Promise<Course> => {
  try {
    const courseId = crypto.randomUUID();
    let pdfUrl: string | undefined;
    let pdfPath: string | undefined;

    if (data.pdfFile) {
      const uploadResult = await uploadPDFToStorage(data.pdfFile, courseId);
      pdfUrl = uploadResult.url;
      pdfPath = uploadResult.path;
    }

    const courseData: any = {
      id: courseId,
      title: data.title,
      description: data.description,
      instructor: data.instructor,
      thumbnail: data.thumbnail,
      duration: data.duration,
      level: data.level,
      plan: data.plan,
      category: data.category,
      lessons: data.lessons || 1,
      coach_id: coachId,
      allow_download: data.allow_download,
      content_type: data.content_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (pdfUrl) courseData.pdf_url = pdfUrl;
    if (pdfPath) courseData.pdf_path = pdfPath;
    if (data.video_url) courseData.video_url = data.video_url;
    if (data.subtitle) courseData.subtitle = data.subtitle;
    if (data.module_id) courseData.module_id = data.module_id;
    if (data.submodule_id) courseData.submodule_id = data.submodule_id;
    if (data.order_in_module !== undefined) courseData.order_in_module = data.order_in_module;
    if (data.visible !== undefined) courseData.visible = data.visible;

    const docRef = doc(db, 'courses', courseId);
    await setDoc(docRef, courseData);

    return courseData as Course;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (
  courseId: string,
  data: Partial<CreateCourseData>,
  existingPdfPath?: string
): Promise<Course> => {
  try {
    let pdfUrl: string | undefined;
    let pdfPath: string | undefined;

    if (data.pdfFile) {
      if (existingPdfPath) {
        await deletePDFFromStorage(existingPdfPath);
      }

      const uploadResult = await uploadPDFToStorage(data.pdfFile, courseId);
      pdfUrl = uploadResult.url;
      pdfPath = uploadResult.path;
    }

    const updateData: any = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (pdfUrl) updateData.pdf_url = pdfUrl;
    if (pdfPath) updateData.pdf_path = pdfPath;

    delete updateData.pdfFile;

    const docRef = doc(db, 'courses', courseId);
    await updateDoc(docRef, updateData);

    const docSnap = await getDoc(docRef);
    return { id: docSnap.id, ...docSnap.data() } as Course;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string, pdfPath?: string): Promise<void> => {
  try {
    if (pdfPath) {
      await deletePDFFromStorage(pdfPath);
    }

    const docRef = doc(db, 'courses', courseId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export const getCoursesByCoach = async (coachId: string): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    const q = query(
      coursesRef,
      where('coach_id', '==', coachId)
    );

    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Course[];

    return courses.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};

export const getStandaloneCourses = async (category?: string): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, 'courses');
    let q;

    if (category) {
      q = query(
        coursesRef,
        where('module_id', '==', null),
        where('category', '==', category)
      );
    } else {
      q = query(coursesRef, where('module_id', '==', null));
    }

    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Course[];

    return courses.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching standalone courses:', error);
    return [];
  }
};

export const getAllCourses = async (): Promise<Course[]> => {
  try {
    console.log('Fetching courses from Firebase...');
    const coursesRef = collection(db, 'courses');
    const querySnapshot = await getDocs(coursesRef);

    console.log('Courses query result:', {
      size: querySnapshot.size,
      empty: querySnapshot.empty,
      docs: querySnapshot.docs.length
    });

    const courses = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Course data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...data
      };
    }) as Course[];

    console.log('Total courses fetched:', courses.length);
    return courses.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error fetching all courses:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }
};

export const getCoursesByModule = async (moduleId: string): Promise<Course[]> => {
  try {
    console.log('Fetching courses for module:', moduleId);
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('module_id', '==', moduleId));
    const querySnapshot = await getDocs(q);

    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Course[];

    const visibleCourses = courses.filter(course => course.visible !== false);
    console.log('Courses found for module:', visibleCourses.length);
    return visibleCourses.sort((a, b) => (a.order_in_module || 0) - (b.order_in_module || 0));
  } catch (error) {
    console.error('Error fetching courses by module:', error);
    return [];
  }
};

export const getCoursesBySubmodule = async (submoduleId: string): Promise<Course[]> => {
  try {
    console.log('Fetching courses for submodule:', submoduleId);
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('submodule_id', '==', submoduleId));
    const querySnapshot = await getDocs(q);

    const courses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Course[];

    console.log('Courses found for submodule:', courses.length);
    return courses.sort((a, b) => (a.order_in_module || 0) - (b.order_in_module || 0));
  } catch (error) {
    console.error('Error fetching courses by submodule:', error);
    return [];
  }
};

export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const docRef = doc(db, 'courses', courseId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};
