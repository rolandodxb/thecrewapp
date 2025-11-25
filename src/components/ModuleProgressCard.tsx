import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LessonProgressRow from './LessonProgressRow';

interface Lesson {
  id: string;
  title: string;
  videoUrl?: string;
  duration: number;
  order: number;
  moduleId: string;
}

interface ModuleProgressCardProps {
  moduleId: string;
  moduleTitle: string;
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  lessons: Lesson[];
  userId: string;
  courseId: string;
  onLessonClick: (lessonId: string) => void;
}

export default function ModuleProgressCard({
  moduleId,
  moduleTitle,
  completedLessons,
  totalLessons,
  progressPercentage,
  lessons,
  userId,
  courseId,
  onLessonClick
}: ModuleProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div
        className="p-3 md:p-6 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg flex-shrink-0 ${progressPercentage === 100 ? 'bg-green-100' : 'bg-blue-100'}`}>
              {progressPercentage === 100 ? (
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              ) : (
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base md:text-lg text-gray-900 truncate">{moduleTitle}</h3>
              <p className="text-xs md:text-sm text-gray-600">
                {completedLessons} of {totalLessons} lessons
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between md:gap-4">
            <div className="text-left md:text-right">
              <p className="text-xl md:text-2xl font-bold text-[#D71920]">{progressPercentage}%</p>
              <p className="text-xs text-gray-500">Complete</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-gray-400 flex-shrink-0" />
            )}
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${
              progressPercentage === 100
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-[#D71920] to-[#B91518]'
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-gray-50"
          >
            <div className="p-4 space-y-2">
              {lessons.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No lessons available</p>
              ) : (
                lessons.map((lesson) => (
                  <LessonProgressRow
                    key={lesson.id}
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    duration={lesson.duration}
                    moduleId={moduleId}
                    userId={userId}
                    onClick={() => onLessonClick(lesson.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
