import { supabase } from '../lib/auth';
import { courses } from '../data/coursesData';

export const initializeDefaultCourses = async (): Promise<void> => {
  try {
    const { data: existingCourses, error } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    if (error) throw error;

    if (existingCourses && existingCourses.length > 0) {
      console.log('Courses already exist, skipping initialization');
      return;
    }

    console.log('Initializing default courses...');

    for (const course of courses) {
      const courseData = {
        id: course.id,
        title: course.title,
        description: course.description,
        coach_id: 'system',
        allow_download: false,
        content_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('courses')
        .insert(courseData);

      if (insertError) throw insertError;
      console.log(`Created course: ${course.title}`);
    }

    console.log('Default courses initialization complete!');
  } catch (error) {
    console.error('Error initializing courses:', error);
    throw error;
  }
};
