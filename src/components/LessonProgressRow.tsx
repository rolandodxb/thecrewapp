import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, PlayCircle } from 'lucide-react';
import { getLessonProgress, LessonProgress } from '../services/progressService';

interface LessonProgressRowProps {
  lessonId: string;
  lessonTitle: string;
  duration: number;
  moduleId: string;
  userId: string;
  onClick: () => void;
}

export default function LessonProgressRow({
  lessonId,
  lessonTitle,
  duration,
  moduleId,
  userId,
  onClick
}: LessonProgressRowProps) {
  const [progress, setProgress] = useState<LessonProgress>({
    viewed: false,
    viewedAt: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId, moduleId, lessonId]);

  const loadProgress = async () => {
    try {
      const lessonProgress = await getLessonProgress(userId, moduleId, lessonId);
      setProgress(lessonProgress);
    } catch (error) {
      console.error('Error loading lesson progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
        <div className="flex-1 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition group ${
        progress.viewed
          ? 'bg-green-50 border-green-200 hover:bg-green-100'
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex-shrink-0">
        {progress.viewed ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : (
          <Circle className="w-6 h-6 text-gray-400 group-hover:text-[#D71920] transition" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`font-semibold text-sm truncate ${
          progress.viewed ? 'text-green-900' : 'text-gray-900'
        }`}>
          {lessonTitle}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            {duration} min
          </span>
          {progress.viewedAt && (
            <span className="text-xs text-green-600">
              Completed {formatDate(progress.viewedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <PlayCircle className={`w-5 h-5 ${
          progress.viewed ? 'text-green-600' : 'text-gray-400 group-hover:text-[#D71920]'
        } transition`} />
      </div>
    </div>
  );
}
