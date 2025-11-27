import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { registerLessonView, getLessonProgress } from '../services/progressService';
import { supabase } from '../lib/auth';
interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  moduleId: string;
  description?: string;
}
export default function LessonViewerPage() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isViewed, setIsViewed] = useState(false);
  const [registering, setRegistering] = useState(false);
  useEffect(() => {
    if (courseId && moduleId && lessonId) {
      loadLesson();
    }
  }, [courseId, moduleId, lessonId]);
  useEffect(() => {
    if (currentUser && courseId && moduleId && lessonId && lesson) {
      checkProgress();
      registerView();
    }
  }, [currentUser, lesson]);
  const loadLesson = async () => {
    if (!courseId || !moduleId || !lessonId) return;
    try {
      const lessonRef = doc(db, 'courses', courseId, 'modules', moduleId, 'lessons', lessonId);
      const lessonSnap = await getDoc(lessonRef);
      if (lessonSnap.exists()) {
        setLesson({
          id: lessonSnap.id,
          ...lessonSnap.data()
        } as Lesson);
      } else {
        console.error('Lesson not found');
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };
  const checkProgress = async () => {
    if (!currentUser || !moduleId || !lessonId) return;
    try {
      const progress = await getLessonProgress(currentUser.uid, moduleId, lessonId);
      setIsViewed(progress.viewed);
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };
  const registerView = async () => {
    if (!currentUser || !courseId || !moduleId || !lessonId || !lesson || registering) return;
    try {
      setRegistering(true);
      await registerLessonView(
        currentUser.uid,
        courseId,
        moduleId,
        lessonId,
        lesson.title
      );
      setIsViewed(true);
    } catch (error) {
      console.error('Error registering lesson view:', error);
    } finally {
      setRegistering(false);
    }
  };
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      let videoId = '';
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('/')[0] || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0]?.split('/')[0] || '';
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('/')[0] || '';
      }
      videoId = videoId.trim();
      if (videoId && videoId.length === 11) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
    }
    return url;
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }
  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Lesson Not Found</h1>
        <button
          onClick={() => navigate('/my-progress')}
          className="flex items-center gap-2 px-6 py-3 bg-[#D71920] hover:bg-[#B91518] text-white rounded-xl font-bold transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Progress
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/my-progress')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Progress
          </button>
          {isViewed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Completed</span>
            </motion.div>
          )}
        </div>
        <div className="glass-video overflow-hidden mb-6">
          {lesson.videoUrl ? (
            <div className="aspect-video w-full bg-black">
              <iframe
                src={getYouTubeEmbedUrl(lesson.videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-gray-900 flex items-center justify-center">
              <p className="text-white text-lg">No video available</p>
            </div>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {lesson.duration} minutes
                </span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">
                  Lesson {lesson.order}
                </span>
              </div>
            </div>
          </div>
          {lesson.description && (
            <div className="mt-6 prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{lesson.description}</p>
            </div>
          )}
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <h3 className="font-bold text-lg text-blue-900 mb-2">Keep Learning!</h3>
            <p className="text-blue-800 mb-4">
              Your progress is automatically saved. Continue with the next lesson or explore other modules.
            </p>
            <button
              onClick={() => navigate('/my-progress')}
              className="px-6 py-3 bg-[#D71920] hover:bg-[#B91518] text-white rounded-xl font-bold transition"
            >
              View My Progress
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}