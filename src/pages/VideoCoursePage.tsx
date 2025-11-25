import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Lock, Play, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  initializeModuleProgress,
  getModuleProgress,
  updateVideoProgress,
  markVideoComplete,
  submitQuiz,
  recalculateModuleProgress,
  ModuleVideoProgress
} from '../services/videoProgressService';
import CourseQuiz from '../components/CourseQuiz';

export default function VideoCoursePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [progress, setProgress] = useState<ModuleVideoProgress | null>(null);
  const [currentVideo, setCurrentVideo] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  useEffect(() => {
    if (currentUser && moduleId) {
      loadProgress();
    }
  }, [currentUser, moduleId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const watchedPercentage = (video.currentTime / video.duration) * 100;

      if (currentUser && moduleId && !isNaN(watchedPercentage)) {
        updateVideoProgress(
          currentUser.uid,
          moduleId,
          currentVideo,
          Math.round(watchedPercentage)
        );
      }
    };

    const interval = setInterval(() => {
      handleTimeUpdate();
    }, 5000);

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      clearInterval(interval);
    };
  }, [currentVideo, currentUser, moduleId]);

  const loadProgress = async () => {
    if (!currentUser || !moduleId) return;

    try {
      let prog = await getModuleProgress(currentUser.uid, moduleId);

      if (!prog) {
        prog = await initializeModuleProgress(currentUser.uid, moduleId);
      } else {
        await recalculateModuleProgress(currentUser.uid, moduleId);
        prog = await getModuleProgress(currentUser.uid, moduleId);
      }

      setProgress(prog);

      if (!prog.video1.completed) {
        setCurrentVideo(1);
      } else if (prog.canAccessVideo2 && !prog.video2.completed) {
        setCurrentVideo(2);
      } else if (prog.video2.completed && !prog.quizCompleted) {
        setCurrentVideo(2);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentUser || !moduleId || !progress) return;

    const result = await markVideoComplete(currentUser.uid, moduleId, currentVideo);

    if (result.success) {
      await loadProgress();
      alert(result.message);

      if (currentVideo === 1) {
        setCurrentVideo(2);
      }
    } else {
      alert(result.message);
    }
  };

  const handleTakeQuiz = () => {
    setShowQuiz(true);
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    if (!currentUser || !moduleId) return;

    const result = await submitQuiz(currentUser.uid, moduleId, score);

    setQuizPassed(result.passed);
    setShowQuiz(false);

    await loadProgress();

    if (result.passed) {
      setTimeout(() => {
        alert('Congratulations! You can now enroll in submodules.');
      }, 500);
    } else {
      alert('Quiz completed. You need 70% or higher to unlock submodules. Try again!');
    }
  };

  const switchVideo = (videoNumber: 1 | 2) => {
    if (videoNumber === 2 && !progress?.canAccessVideo2) {
      alert('Complete video 1 first to unlock video 2');
      return;
    }
    setCurrentVideo(videoNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Module Not Found</h1>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </button>
      </div>
    );
  }

  const currentVideoData = currentVideo === 1 ? progress.video1 : progress.video2;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/courses')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#D71920] transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </button>

        <div className="glass-video overflow-hidden">
          <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Open Day Training Module</h1>
            <p className="text-red-100 mb-4 text-sm">
              Complete both videos → Pass quiz (70%+) → Unlock other modules
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${progress.overallProgress}%` }}
                />
              </div>
              <span className="font-bold text-xl">{progress.overallProgress}%</span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                {progress.video1.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 border-2 border-white/50 rounded-full" />
                )}
                <span>Video 1</span>
              </div>
              <div className="flex items-center gap-2">
                {progress.video2.completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 border-2 border-white/50 rounded-full" />
                )}
                <span>Video 2</span>
              </div>
              <div className="flex items-center gap-2">
                {progress.quizCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 border-2 border-white/50 rounded-full" />
                )}
                <span>Quiz</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => switchVideo(1)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  currentVideo === 1
                    ? 'border-[#D71920] bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {progress.video1.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Play className="w-6 h-6 text-gray-400" />
                  )}
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900">Video 1: Introduction</h3>
                    <p className="text-sm text-gray-600">
                      {progress.video1.completed
                        ? 'Completed'
                        : `${Math.round(progress.video1.watchedPercentage)}% watched`}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => switchVideo(2)}
                disabled={!progress.canAccessVideo2}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !progress.canAccessVideo2
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : currentVideo === 2
                    ? 'border-[#D71920] bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {!progress.canAccessVideo2 ? (
                    <Lock className="w-6 h-6 text-gray-400" />
                  ) : progress.video2.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Play className="w-6 h-6 text-gray-400" />
                  )}
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900">Video 2: Grooming Standards</h3>
                    <p className="text-sm text-gray-600">
                      {!progress.canAccessVideo2
                        ? 'Complete Video 1 to unlock'
                        : progress.video2.completed
                        ? 'Completed'
                        : `${Math.round(progress.video2.watchedPercentage)}% watched`}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!showQuiz ? (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-black rounded-xl overflow-hidden mb-6">
                    <video
                      ref={videoRef}
                      className="w-full aspect-video"
                      controls
                      src={`/videos/module-${moduleId}-video-${currentVideo}.mp4`}
                    >
                      Your browser does not support video playback.
                    </video>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-900">
                      <strong>Progress:</strong> {Math.round(currentVideoData.watchedPercentage)}% watched.
                      Watch at least 80% to mark this video as complete.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    {!currentVideoData.completed && (
                      <button
                        onClick={handleMarkComplete}
                        disabled={currentVideoData.watchedPercentage < 80}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Mark as Complete
                      </button>
                    )}

                    {currentVideo === 2 && progress.video2.completed && progress.canTakeQuiz && !progress.quizCompleted && (
                      <button
                        onClick={handleTakeQuiz}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                      >
                        <Award className="w-5 h-5" />
                        Take Quiz
                      </button>
                    )}

                    {progress.quizCompleted && (
                      <div className="flex-1 px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <div>
                            <p className="font-bold text-green-900">Quiz Completed!</p>
                            <p className="text-sm text-green-700">
                              Score: {progress.quizScore}% - {progress.submodulesUnlocked ? 'Submodules Unlocked' : 'Retake to unlock submodules'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CourseQuiz
                    moduleId={moduleId || ''}
                    onComplete={handleQuizComplete}
                    onBack={() => setShowQuiz(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
