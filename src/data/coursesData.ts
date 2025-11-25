export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  plan: 'free' | 'pro' | 'vip';
  category: 'grooming' | 'service' | 'safety' | 'interview' | 'language';
  lessons: number;
}

export const courses: Course[] = [
  {
    id: 'course-001',
    title: 'Introduction to Cabin Crew',
    description: 'Learn the basics of becoming a flight attendant, including roles, responsibilities, and what airlines look for in candidates.',
    instructor: 'Sarah Johnson',
    thumbnail: 'https://images.pexels.com/photos/1309644/pexels-photo-1309644.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '2 hours',
    level: 'beginner',
    plan: 'free',
    category: 'interview',
    lessons: 8
  },
  {
    id: 'course-002',
    title: 'Professional Grooming Standards',
    description: 'Master the grooming and appearance standards required by top airlines like Emirates, Etihad, and Qatar Airways.',
    instructor: 'Maria Garcia',
    thumbnail: 'https://images.pexels.com/photos/3756681/pexels-photo-3756681.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '1.5 hours',
    level: 'beginner',
    plan: 'free',
    category: 'grooming',
    lessons: 6
  },
  {
    id: 'course-003',
    title: 'Basic Aviation Safety',
    description: 'Understanding fundamental safety procedures and emergency protocols in aviation.',
    instructor: 'Captain Ahmed Al-Rashid',
    thumbnail: 'https://images.pexels.com/photos/358319/pexels-photo-358319.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '3 hours',
    level: 'beginner',
    plan: 'free',
    category: 'safety',
    lessons: 10
  },
  {
    id: 'course-004',
    title: 'Advanced Customer Service',
    description: 'Deliver exceptional service to premium passengers and handle difficult situations with grace and professionalism.',
    instructor: 'Jennifer Lee',
    thumbnail: 'https://images.pexels.com/photos/2467558/pexels-photo-2467558.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '4 hours',
    level: 'intermediate',
    plan: 'pro',
    category: 'service',
    lessons: 12
  },
  {
    id: 'course-005',
    title: 'Emirates Interview Preparation',
    description: 'Complete preparation for the Emirates assessment day, including video interview, group exercises, and final interview tips.',
    instructor: 'Former Emirates Recruiter',
    thumbnail: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '5 hours',
    level: 'advanced',
    plan: 'pro',
    category: 'interview',
    lessons: 15
  },
  {
    id: 'course-006',
    title: 'Aviation English Excellence',
    description: 'Master aviation-specific English vocabulary, phrases, and communication techniques used in the industry.',
    instructor: 'David Thompson',
    thumbnail: 'https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '6 hours',
    level: 'intermediate',
    plan: 'pro',
    category: 'language',
    lessons: 18
  },
  {
    id: 'course-007',
    title: 'VIP Passenger Handling',
    description: 'Learn the art of serving high-profile passengers, including royalty, celebrities, and business executives.',
    instructor: 'Fatima Al-Zahra',
    thumbnail: 'https://images.pexels.com/photos/1097456/pexels-photo-1097456.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '3 hours',
    level: 'advanced',
    plan: 'vip',
    category: 'service',
    lessons: 10
  },
  {
    id: 'course-008',
    title: 'Emergency Response Mastery',
    description: 'Advanced training in handling emergencies, evacuations, and life-threatening situations with confidence.',
    instructor: 'Captain Michael Stevens',
    thumbnail: 'https://images.pexels.com/photos/163811/flight-sun-bird-flying-163811.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '8 hours',
    level: 'advanced',
    plan: 'vip',
    category: 'safety',
    lessons: 20
  },
  {
    id: 'course-009',
    title: 'International Etiquette & Culture',
    description: 'Navigate cultural differences and provide culturally sensitive service to passengers from around the world.',
    instructor: 'Dr. Aisha Mohammed',
    thumbnail: 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800',
    duration: '4 hours',
    level: 'advanced',
    plan: 'vip',
    category: 'service',
    lessons: 14
  }
];

export function getCoursesByPlan(userPlan: 'free' | 'pro' | 'vip'): Course[] {
  const planHierarchy = { 'free': 0, 'pro': 1, 'vip': 2 };
  const userPlanLevel = planHierarchy[userPlan];

  return courses.filter(course => {
    const coursePlanLevel = planHierarchy[course.plan];
    return coursePlanLevel <= userPlanLevel;
  });
}

export function getCoursesByCategory(category: Course['category'], userPlan: 'free' | 'pro' | 'vip'): Course[] {
  const availableCourses = getCoursesByPlan(userPlan);
  return availableCourses.filter(course => course.category === category);
}
