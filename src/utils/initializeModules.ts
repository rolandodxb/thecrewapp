import { createModule } from '../services/moduleService';

export const initializeDefaultModules = async (): Promise<void> => {
  const defaultModules = [
    {
      name: 'Interview Prep - Module 1',
      description: 'Master the basics of cabin crew interviews including common questions, body language, and first impressions',
      category: 'interview' as const,
      order: 1,
      visible: false,
      lessons: [
        {
          id: 'intro-interview-1',
          title: 'Introduction to Cabin Crew Interviews',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '8:30',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-interview-1',
          title: 'Common Interview Questions',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '12:45',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-interview-1',
          title: 'Body Language & First Impressions',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '10:20',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Interview Prep - Module 2',
      description: 'Advanced interview techniques, scenario-based questions, and assessment day preparation',
      category: 'interview' as const,
      order: 2,
      visible: false,
      lessons: [
        {
          id: 'intro-interview-2',
          title: 'Advanced Interview Techniques',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '9:15',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-interview-2',
          title: 'Scenario-Based Questions',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '14:00',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-interview-2',
          title: 'Assessment Day Preparation',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '11:30',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Grooming - Module 1',
      description: 'Essential grooming standards for cabin crew including uniform guidelines, hair, makeup, and personal presentation',
      category: 'grooming' as const,
      order: 1,
      visible: false,
      lessons: [
        {
          id: 'intro-grooming-1',
          title: 'Introduction to Cabin Crew Grooming',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '7:45',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-grooming-1',
          title: 'Uniform Guidelines & Standards',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '13:20',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-grooming-1',
          title: 'Hair & Makeup Standards',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '15:10',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Grooming - Module 2',
      description: 'Advanced grooming techniques and maintaining professional appearance during long flights',
      category: 'grooming' as const,
      order: 2,
      visible: false,
      lessons: [
        {
          id: 'intro-grooming-2',
          title: 'Advanced Grooming Techniques',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '8:00',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-grooming-2',
          title: 'Long-Flight Grooming Maintenance',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '12:00',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-grooming-2',
          title: 'Professional Image Management',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '10:45',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Customer Service - Module 1',
      description: 'Fundamentals of exceptional customer service, communication skills, and handling passenger requests',
      category: 'service' as const,
      order: 1,
      visible: false,
      lessons: [
        {
          id: 'intro-service-1',
          title: 'Introduction to Customer Service Excellence',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '9:30',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-service-1',
          title: 'Communication Skills & Active Listening',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '14:15',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-service-1',
          title: 'Handling Passenger Requests',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '11:40',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Customer Service - Module 2',
      description: 'Managing difficult passengers, conflict resolution, and delivering premium service',
      category: 'service' as const,
      order: 2,
      visible: false,
      lessons: [
        {
          id: 'intro-service-2',
          title: 'Advanced Customer Service Techniques',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '8:50',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-service-2',
          title: 'Conflict Resolution & Difficult Passengers',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '16:00',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-service-2',
          title: 'Premium Service Delivery',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '13:25',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Safety - Module 1',
      description: 'Core aviation safety procedures, emergency equipment, and pre-flight safety checks',
      category: 'safety' as const,
      order: 1,
      visible: false,
      lessons: [
        {
          id: 'intro-safety-1',
          title: 'Introduction to Aviation Safety',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '10:00',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-safety-1',
          title: 'Emergency Equipment & Procedures',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '18:30',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-safety-1',
          title: 'Pre-Flight Safety Checks',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '14:45',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Safety - Module 2',
      description: 'Advanced emergency procedures, evacuations, medical emergencies, and crisis management',
      category: 'safety' as const,
      order: 2,
      visible: false,
      lessons: [
        {
          id: 'intro-safety-2',
          title: 'Advanced Safety & Emergency Response',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '11:15',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-safety-2',
          title: 'Emergency Evacuations & Crisis Management',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '20:00',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-safety-2',
          title: 'Medical Emergencies & First Aid',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '17:30',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Language - Module 1',
      description: 'Essential aviation English terminology, announcements, and basic passenger communication',
      category: 'language' as const,
      order: 1,
      visible: false,
      lessons: [
        {
          id: 'intro-language-1',
          title: 'Introduction to Aviation English',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '9:00',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-language-1',
          title: 'Aviation Terminology & Phrases',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '15:20',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-language-1',
          title: 'Passenger Announcements & Communication',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '12:50',
          order: 3,
          isIntro: false
        }
      ]
    },
    {
      name: 'Language - Module 2',
      description: 'Advanced language skills, cultural awareness, and multilingual passenger interactions',
      category: 'language' as const,
      order: 2,
      visible: false,
      lessons: [
        {
          id: 'intro-language-2',
          title: 'Advanced Communication & Cultural Awareness',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '10:30',
          order: 1,
      visible: false,
          isIntro: true
        },
        {
          id: 'lesson1-language-2',
          title: 'Multilingual Passenger Interactions',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '16:45',
          order: 2,
      visible: false,
          isIntro: false
        },
        {
          id: 'lesson2-language-2',
          title: 'Cultural Sensitivity & Global Communication',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration: '14:00',
          order: 3,
          isIntro: false
        }
      ]
    }
  ];

  console.log('Initializing default modules...');
  console.log('Total modules to create:', defaultModules.length);

  let successCount = 0;
  let errorCount = 0;

  for (const module of defaultModules) {
    try {
      console.log(`Creating module: ${module.name}...`);
      const moduleId = await createModule(module);
      console.log(`✅ Successfully created module: ${module.name} (ID: ${moduleId})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error creating module ${module.name}:`, error);
      console.error('Module data:', JSON.stringify(module, null, 2));
      errorCount++;
    }
  }

  console.log(`\n=== Module Initialization Complete ===`);
  console.log(`✅ Success: ${successCount} modules`);
  console.log(`❌ Errors: ${errorCount} modules`);
  console.log(`=====================================\n`);
};
