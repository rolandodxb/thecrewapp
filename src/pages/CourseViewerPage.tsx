import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, CheckCircle, Award } from 'lucide-react';
import { getCourseById, Course, updateCourseProgress, isCourseUnlocked } from '../services/courseService';
import { useApp } from '../context/AppContext';
import PDFViewer from '../components/PDFViewer';
import UpgradePrompt from '../components/UpgradePrompt';
import { markLessonWatched } from '../services/rewardsService';
import { trackCourseProgress, getCourseProgress, enrollInCourse, isEnrolledInCourse } from '../services/enrollmentService';
import { getExamByCourseId, getUserExamResult, Exam, ExamResult } from '../services/examService';
import FeatureAccessGuard from '../components/FeatureAccessGuard';
import CourseExamInterface from '../components/CourseExamInterface';
import ExamResultModal from '../components/ExamResultModal';
import { AnimatePresence } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

function CourseViewerPageContent() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showExam, setShowExam] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [isRetake, setIsRetake] = useState(false);
  const [lastExamResult, setLastExamResult] = useState<any>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const [videoStartTime] = useState(Date.now());
  const [courseCompleted, setCourseCompleted] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const moduleIdFromUrl = searchParams.get('moduleId');
  const moduleType = searchParams.get('type');
  const [isUnlocked, setIsUnlocked] = useState(true);

  useEffect(() => {
    console.log('CourseViewerPage: URL params detected:', {
      moduleIdFromUrl,
      moduleType,
      fullUrl: window.location.href,
      courseId
    });
  }, [moduleIdFromUrl, moduleType, courseId]);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  useEffect(() => {
    if (currentUser && courseId && course) {
      markLessonWatched(currentUser.uid, courseId);
    }
  }, [currentUser, courseId, course]);

  useEffect(() => {
    if (courseCompleted) {
      return;
    }

    const trackProgress = () => {
      const timeWatching = (Date.now() - videoStartTime) / 1000;
      const estimatedProgress = Math.min((timeWatching / 180) * 100, 99);

      setWatchProgress(estimatedProgress);

      if (estimatedProgress >= 80 && !videoWatched && currentUser && courseId && course) {
        setVideoWatched(true);
        console.log('Video watched 80%, tracking progress...');
        const moduleId = course.main_module_id || course.submodule_id;
        if (moduleId) {
          trackCourseProgress(currentUser.uid, courseId, moduleId, 80, 100);
        }
      }
    };

    const interval = setInterval(trackProgress, 3000);
    return () => clearInterval(interval);
  }, [videoStartTime, videoWatched, currentUser, courseId, course, courseCompleted]);

  const loadCourse = async () => {
    if (!courseId) return;

    try {
      console.log('CourseViewer: Loading course with ID:', courseId);
      const courseData = await getCourseById(courseId);
      console.log('CourseViewer: Course data received:', courseData);
      setCourse(courseData);

      if (!courseData) {
        console.error('CourseViewer: Course not found in database');
        setLoading(false);
        return;
      }

      console.log('CourseViewer: Course video_url:', courseData.video_url);
      console.log('CourseViewer: Course pdf_url:', courseData.pdf_url);

      if (currentUser) {
        const unlocked = await isCourseUnlocked(currentUser.uid, courseData);
        console.log('CourseViewer: Course unlocked:', unlocked);
        setIsUnlocked(unlocked);

        // Auto-enroll user in course when they open it
        const enrolled = await isEnrolledInCourse(currentUser.uid, courseId);
        if (!enrolled) {
          await enrollInCourse(currentUser.uid, courseId);
          console.log('CourseViewer: Auto-enrolled user in course');
        }
      }

      const examData = await getExamByCourseId(courseId);

      if (currentUser) {
        const progress = await getCourseProgress(currentUser.uid, courseId);
        if (progress && progress.completed) {
          console.log('CourseViewer: Course already completed, setting watch progress to 100%');
          setWatchProgress(100);
          setVideoWatched(true);
          setCourseCompleted(true);
        }
      }

      if (examData) {
        if (!examData.courseId) {
          console.warn('Exam missing courseId, setting it to:', courseId);
          examData.courseId = courseId;
        }
        setExam(examData);

        if (currentUser && examData.id) {
          console.log('CourseViewer: Fetching exam result for exam ID:', examData.id);
          const resultRef = doc(db, 'userExams', `${examData.id}_${currentUser.uid}_latest`);
          const resultSnap = await getDoc(resultRef);

          if (resultSnap.exists()) {
            const result = resultSnap.data();
            console.log('CourseViewer: Exam result fetched:', result);
            setLastExamResult(result);
            if (result.passed) {
              setHasPassed(true);
              console.log('CourseViewer: User has passed exam, score:', result.lastScore);
            }
          } else {
            console.log('CourseViewer: No exam result found for this user');
          }
        }
      } else {
        setExam(null);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = () => {
    if (!course || !currentUser) return false;

    const planHierarchy = { free: 0, pro: 1, vip: 2 };
    const userPlanLevel = planHierarchy[currentUser.plan];
    const coursePlanLevel = planHierarchy[course.plan];

    return coursePlanLevel <= userPlanLevel;
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) {
      console.error('No video URL provided');
      return '';
    }

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

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
      }
    } catch (error) {
      console.error('Error parsing YouTube URL:', error, url);
    }
    return url;
  };

  const handleVideoWatchComplete = async () => {
    console.log('Mark Complete button clicked');
    if (!currentUser) {
      console.error('No current user');
      alert('Please log in to mark progress');
      return;
    }
    if (!courseId) {
      console.error('No course ID');
      return;
    }
    if (!course) {
      console.error('No course data');
      return;
    }

    try {
      console.log('Marking course complete:', {
        userId: currentUser.uid,
        courseId,
        course: course.title,
        moduleIdFromUrl,
        moduleType
      });

      setVideoWatched(true);
      setWatchProgress(100);

      const moduleId = moduleIdFromUrl || course.main_module_id || course.submodule_id;
      console.log('Module ID for progress:', moduleId);

      if (moduleId) {
        console.log('Tracking course progress...');
        await trackCourseProgress(currentUser.uid, courseId, moduleId, 100, 100);

        console.log('Updating course progress...');
        await updateCourseProgress(currentUser.uid, courseId, 100);

        console.log('✅ Course marked as complete!');
        alert('✅ Course marked as complete!');
      } else {
        console.warn('No module ID found in URL or course data');
        alert('⚠️ Course marked but no module linked');
      }
    } catch (error) {
      console.error('Error marking course complete:', error);
      alert('Failed to mark course complete. Check console for details.');
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF3B3F] border-t-transparent"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Course Not Found</h1>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </button>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="glass-modal p-8 max-w-md w-full text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Course Locked</h1>
          <p className="text-gray-600 mb-6">
            Complete the previous course and pass its exam with 80% or higher to unlock this course.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="glass-modal p-8 max-w-md w-full text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Course Locked</h1>
          <p className="text-gray-600 mb-6">
            This course requires a {course.plan.toUpperCase()} plan to access.
          </p>
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition mb-3"
          >
            Upgrade Now
          </button>
          <button
            onClick={() => navigate('/courses')}
            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
          >
            Back to Courses
          </button>
        </div>

        {showUpgradePrompt && (
          <UpgradePrompt
            isOpen={showUpgradePrompt}
            onClose={() => setShowUpgradePrompt(false)}
            requiredPlan={course.plan === 'vip' ? 'vip' : 'pro'}
            message={`This course requires ${course.plan.toUpperCase()} access`}
            feature={course.title}
          />
        )}
      </div>
    );
  }

  if (!course.pdf_url && !course.video_url) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">No Content Available</h1>
        <p className="text-gray-600 mb-6">This course doesn't have any content yet.</p>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Courses
        </button>
      </div>
    );
  }

  const handleExamComplete = async (result: ExamResult) => {
    setExamResult(result);

    if (result.passed && currentUser && courseId && course && exam) {
      setHasPassed(true);

      const updatedResult = {
        userId: currentUser.uid,
        moduleId: exam.moduleId,
        lessonId: exam.lessonId,
        courseId: courseId,
        attempts: (lastExamResult?.attempts || 0) + 1,
        lastScore: result.score,
        passed: true,
        passedAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
        answers: []
      };
      setLastExamResult(updatedResult);

      await updateCourseProgress(currentUser.uid, courseId, 100);

      if (course.main_module_id) {
        await trackCourseProgress(currentUser.uid, courseId, course.main_module_id, 100, 100);
      } else if (course.submodule_id) {
        await trackCourseProgress(currentUser.uid, courseId, course.submodule_id, 100, 100);
      }
    }
  };

  const handleStartExam = () => {
    setIsRetake(hasPassed);
    setShowExam(true);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    if (examResult?.passed) {
      navigate(-1);
    }
  };

  if (course.video_url) {
    return (
      <div className="min-h-screen">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Courses
          </button>

          {!showExam && (
          <div className="glass-video overflow-hidden mb-6">
            <div className="aspect-video w-full bg-black relative">
              {course.video_url ? (
                <iframe
                  src={getYouTubeEmbedUrl(course.video_url)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={course.title}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <p>No video available</p>
                </div>
              )}
            </div>
            {watchProgress > 0 && watchProgress < 100 && (
              <div className="bg-gray-800 h-1.5">
                <div
                  className="h-full bg-[#D71920] transition-all duration-500"
                  style={{ width: `${watchProgress}%` }}
                />
              </div>
            )}
          </div>
          )}

          {!showExam && (
          <div className="glass-card p-6 mb-6">
            <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                {course.category}
              </span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                {course.level}
              </span>
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                {course.duration}
              </span>
            </div>
            {courseCompleted ? (
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-base font-bold text-green-900">Course Completed</span>
                </div>
                {lastExamResult && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Exam Score</p>
                        <p className="font-bold text-green-700 text-lg">{lastExamResult.lastScore}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Status</p>
                        <p className="font-bold text-green-700 text-lg">
                          {lastExamResult.passed ? '✓ Passed' : 'Not Passed'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-900">Video Progress</span>
                  <span className="text-sm font-bold text-blue-600">{Math.round(watchProgress)}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${watchProgress}%` }}
                  />
                </div>
                {watchProgress >= 80 ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVideoWatchComplete}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition text-sm"
                    >
                      ✓ Mark Complete
                    </button>
                    {exam && (
                      <button
                        onClick={handleStartExam}
                        className={`flex-1 px-4 py-2 ${
                          hasPassed
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                            : 'bg-gradient-to-r from-[#D71921] to-[#B91518]'
                        } hover:shadow-lg text-white rounded-lg font-semibold transition text-sm`}
                      >
                        {hasPassed ? 'Retake Exam' : 'Take Exam'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      Watch video to unlock exam (need 80%)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {!showExam && exam && (
            <>
              {hasPassed && lastExamResult ? (
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Award className="w-12 h-12 text-white" />
                    </div>
                    <div className="inline-block px-6 py-2 bg-green-500 text-white rounded-full font-bold text-lg mb-4">
                      PASSED
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Completed!</h1>
                    <p className="text-lg text-gray-600">You have successfully passed this exam.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 text-center">
                      <div className="text-sm font-semibold text-blue-700 mb-2">Your Score</div>
                      <div className="text-4xl font-bold text-green-600">{lastExamResult.lastScore}%</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 text-center">
                      <div className="text-sm font-semibold text-green-700 mb-2">Attempts</div>
                      <div className="text-4xl font-bold text-green-600">{lastExamResult.attempts}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6 text-center">
                      <div className="text-sm font-semibold text-yellow-700 mb-2">Status</div>
                      <div className="text-2xl font-bold text-green-600">✓ Passed</div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartExam}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold transition"
                  >
                    Retake Exam
                  </button>
                </div>
              ) : watchProgress < 80 ? (
                <div
                  className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-2xl shadow-lg p-8 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(234, 219, 200, 0.9) 0%, rgba(245, 230, 211, 0.9) 100%)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-[#000000] mb-3">Exam Locked</h2>
                  <p className="text-gray-700 mb-4">
                    Watch at least 80% of the video to unlock the exam.
                  </p>
                  <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
                    <p className="text-orange-800 text-sm font-semibold">
                      Progress: {Math.round(watchProgress)}% / 80% required
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {showExam && exam && currentUser && (
            <div className="mt-8">
              <CourseExamInterface
                exam={exam}
                userId={currentUser.uid}
                onComplete={handleExamComplete}
                isRetake={isRetake}
              />
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <PDFViewer
      pdfUrl={course.pdf_url!}
      allowDownload={course.allow_download}
      onClose={() => navigate('/courses')}
    />
  );
}

export default function CourseViewerPage() {
  return (
    <FeatureAccessGuard featureKey="videos">
      <CourseViewerPageContent />
    </FeatureAccessGuard>
  );
}
