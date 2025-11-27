import { db } from '../lib/auth';
import { courses } from '../data/coursesData';
export const initializeDefaultCourses = async (): Promise<void> => {
  try {
    const coursesRef = collection(db, 'courses');
    const existingCourses = await getDocs(coursesRef);
    if (existingCourses.size > 0) {
      console.log('Courses already exist, skipping initialization');
      return;
    }
    console.log('Initializing default courses...');
    for (const course of courses) {
      const courseData = {
        ...course,
        coach_id: 'system',
        allow_download: false,
        content_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const docRef = doc(db, 'courses', course.id);
      await setDoc(docRef, courseData);
      console.log(`Created course: ${course.title}`);
    }
    console.log('Default courses initialization complete!');
  } catch (error) {
    console.error('Error initializing courses:', error);
    throw error;
  }
};