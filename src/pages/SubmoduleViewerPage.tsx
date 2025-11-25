import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, BookOpen, Play, Upload } from 'lucide-react';
import { getSubmodule, Submodule } from '../services/mainModuleService';
import { getCoursesBySubmodule, Course } from '../services/courseService';
import { motion } from 'framer-motion';
import NewCourseForm from '../components/NewCourseForm';
import { useApp } from '../context/AppContext';
import { updateLastAccessed, isEnrolledInModule } from '../services/enrollmentService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function SubmoduleViewerPage() {
  const { submoduleId } = useParams<{ submoduleId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [submodule, setSubmodule] = useState<Submodule | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);

  const isAdmin = currentUser?.role === 'mentor' || currentUser?.role === 'governor';

  useEffect(() => {
    if (submoduleId) {
      loadSubmoduleData();
    }
  }, [submoduleId]);

  const loadSubmoduleData = async () => {
    if (!submoduleId) return;

    try {
      const sub = await getSubmodule(submoduleId);
      setSubmodule(sub);

      if (sub) {
        console.log('SubmoduleViewer: Skipping enrollment check - allowing all users to view submodules');

        if (currentUser && submoduleId) {
          await updateLastAccessed(currentUser.uid, submoduleId);
        }

        const courseIds: string[] = [];
        if (sub.course_id) courseIds.push(sub.course_id);
        if (sub.course1_id) courseIds.push(sub.course1_id);
        if (sub.course2_id) courseIds.push(sub.course2_id);

        console.log('SubmoduleViewer: Submodule data:', sub);
        console.log('SubmoduleViewer: Course IDs found:', courseIds);

        if (courseIds.length > 0) {
          const coursesData = await Promise.all(
            courseIds.map(async (courseId) => {
              console.log('SubmoduleViewer: Fetching course:', courseId);
              const courseDoc = await getDoc(doc(db, 'courses', courseId));
              if (courseDoc.exists()) {
                console.log('SubmoduleViewer: Course found:', courseDoc.id, courseDoc.data());
                return { id: courseDoc.id, ...courseDoc.data() } as Course;
              } else {
                console.log('SubmoduleViewer: Course not found:', courseId);
              }
              return null;
            })
          );

          const validCourses = coursesData.filter(c => c !== null) as Course[];
          console.log('SubmoduleViewer: Valid courses:', validCourses);
          setCourses(validCourses);
        } else {
          console.log('SubmoduleViewer: No course IDs in submodule');
          setCourses([]);
        }
      }
    } catch (error) {
      console.error('Error loading submodule:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
      </div>
    );
  }

  if (!submodule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Submodule Not Found</h1>
        <button
          onClick={() => navigate(isAdmin ? '/coach-dashboard' : '/courses')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {isAdmin ? 'Dashboard' : 'Courses'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(`/main-modules/${submodule.parentModuleId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Main Module
        </button>

        <div className="glass-card overflow-hidden mb-8">
          {submodule.coverImage && (
            <img
              src={submodule.coverImage}
              alt={submodule.title}
              className="w-full h-64 object-cover"
            />
          )}
          <div className="p-8">
            <div className="mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-3 inline-block">
                Submodule #{submodule.order}
              </span>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{submodule.title}</h1>
              <p className="text-lg text-gray-600 leading-relaxed">{submodule.description}</p>
            </div>

            {isAdmin && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCourseForm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  <Upload className="w-5 h-5" />
                  Add Course
                </button>
              </div>
            )}
          </div>
        </div>

        {courses.length > 0 ? (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-[#D71920]" />
                Courses
              </h2>
              <p className="text-gray-600">Courses in this submodule</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-course overflow-hidden transition cursor-pointer border-2 border-transparent hover:border-[#D71920]"
                  onClick={() => {
                    console.log('SubmoduleViewer: Navigating to course:', course.id, 'with submoduleId:', submoduleId);
                    navigate(`/course/${course.id}?moduleId=${submoduleId}&type=sub`);
                  }}
                >
                  <div className="relative">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    {course.video_url && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h3>
                    {course.subtitle && (
                      <p className="text-sm text-gray-500 mb-2">{course.subtitle}</p>
                    )}
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{course.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{course.duration}</span>
                      <span className="capitalize">{course.level}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Courses Yet</h3>
            <p className="text-gray-600 mb-6">
              {isAdmin
                ? 'Add courses to this submodule to get started'
                : 'This submodule is being prepared. Check back soon!'
              }
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowCourseForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:shadow-lg transition inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add First Course
              </button>
            )}
          </div>
        )}

        {isAdmin && (
          <NewCourseForm
            isOpen={showCourseForm}
            onClose={() => setShowCourseForm(false)}
            onSuccess={loadSubmoduleData}
            preselectedSubmoduleId={submoduleId}
          />
        )}
      </div>
    </div>
  );
}
