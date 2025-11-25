import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, GraduationCap, FileText, Video, UserPlus } from 'lucide-react';
import { getModule, Module, getModulesByCategory } from '../services/moduleService';
import { getCoursesByModule, Course, enrollInCourse, isEnrolledInCourse } from '../services/courseService';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';

export default function ModuleViewerPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [module, setModule] = useState<Module | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [relatedModules, setRelatedModules] = useState<Module[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (moduleId) {
      loadModuleData();
    }
  }, [moduleId]);

  const loadModuleData = async () => {
    if (!moduleId) return;

    try {
      console.log('Loading module data for:', moduleId);

      // Load the main module
      const moduleData = await getModule(moduleId);
      setModule(moduleData);

      if (moduleData) {
        // Load visible courses in this module
        const moduleCourses = await getCoursesByModule(moduleId);
        console.log('Courses in module:', moduleCourses.length);
        setCourses(moduleCourses);

        // Check enrollment status
        if (currentUser) {
          const isEnrolled = await isEnrolledInCourse(currentUser.uid, moduleId);
          setEnrolled(isEnrolled);
        }

        // Load other modules in the same category
        const categoryModules = await getModulesByCategory(moduleData.category);
        const otherModules = categoryModules.filter(m =>
          m.id !== moduleId && m.visible === true
        );
        console.log('Related modules:', otherModules.length);
        setRelatedModules(otherModules);
      }
    } catch (error) {
      console.error('Error loading module data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!currentUser || !moduleId) return;

    setEnrolling(true);
    try {
      await enrollInCourse(currentUser.uid, moduleId);
      setEnrolled(true);
      alert('Successfully enrolled in module!');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll in module. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Module Not Found</h1>
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Modules
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <button
          onClick={() => navigate('/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Modules
        </button>

        <div className="glass-card rounded-xl shadow-lg overflow-hidden mb-6">
          {module.cover_image && (
            <img
              src={module.cover_image}
              alt={module.name}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                  <span className="text-sm text-blue-600 font-semibold uppercase">
                    {module.category}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{module.name}</h1>
                <p className="text-gray-600 mb-4">{module.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {module.lessons?.length || 0} Video Lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {courses.length} Course Materials
                  </span>
                </div>
              </div>

              {currentUser && currentUser.role === 'student' && !enrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {enrolling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Enroll Now
                    </>
                  )}
                </button>
              )}

              {enrolled && currentUser?.role === 'student' && (
                <div className="px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold">
                  ✓ Enrolled
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module Video Lessons */}
      {module.lessons && module.lessons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Video Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {module.lessons.map((lesson) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => {
                  // Navigate to lesson viewer or play video
                  window.open(lesson.videoUrl, '_blank');
                }}
              >
                <div className="bg-gradient-to-br from-red-600 to-red-700 h-32 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{lesson.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Video className="w-4 h-4" />
                    <span>{lesson.duration}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Courses in this module */}
      {courses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Materials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {course.content_type === 'pdf' ? (
                      <FileText className="w-4 h-4 text-red-600" />
                    ) : (
                      <Video className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      {course.content_type}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{course.instructor}</span>
                    <span>{course.duration}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Related modules in same category */}
      {relatedModules.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            More {module.category.charAt(0).toUpperCase() + module.category.slice(1)} Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedModules.map((relatedModule) => (
              <motion.div
                key={relatedModule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => navigate(`/modules/${relatedModule.id}`)}
              >
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 h-32 flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-white opacity-80" />
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                      Module {relatedModule.order}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{relatedModule.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{relatedModule.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && relatedModules.length === 0 && (!module.lessons || module.lessons.length === 0) && (
        <div className="glass-card rounded-xl shadow-lg p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Content Coming Soon</h2>
          <p className="text-gray-600">
            Course materials for this module will be available soon.
          </p>
        </div>
      )}
    </div>
  );
}
