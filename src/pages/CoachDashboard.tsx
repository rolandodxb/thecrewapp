import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Upload, BookOpen, X, Plus, Edit } from 'lucide-react';
import CourseUploadForm from '../components/CourseUploadForm';
import { getCoursesByCoach, Course } from '../services/courseService';

export default function CoachDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'mentor' && currentUser.role !== 'governor')) {
      navigate('/dashboard');
      return;
    }

    loadCourses();
  }, [currentUser, navigate]);

  const loadCourses = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      const coursesData = await getCoursesByCoach(currentUser.uid);
      const visibleCourses = coursesData.filter(course => !course.suppressed);
      setCourses(visibleCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    setEditingCourse(null);
    loadCourses();
  };

  const handleEditCourse = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setEditingCourse(course);
  };

  if (!currentUser || (currentUser.role !== 'mentor' && currentUser.role !== 'governor')) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">
              Coach Dashboard
            </h1>
            <p className="text-base text-gray-600">
              Upload and manage educational content for your students
            </p>
          </div>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            <Plus className="w-5 h-5" />
            Upload Course
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF3B3F] border-t-transparent"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-light rounded-2xl shadow-lg p-12 text-center">
          <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-6">Upload your first course to get started</p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Upload First Course
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-[#1C1C1C] mb-6">
            My Courses ({courses.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="glass-light rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <div
                  className="h-48 bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${course.thumbnail})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      course.plan === 'free'
                        ? 'bg-white/90 text-gray-800'
                        : course.plan === 'pro'
                        ? 'bg-[#FF3B3F] text-white'
                        : 'bg-gradient-to-r from-[#3D4A52] to-[#2A3439] text-white'
                    }`}>
                      {course.plan.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 glass-light/90 rounded-full text-xs font-bold text-gray-800">
                      {course.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-[#1C1C1C] text-lg mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {course.lessons} lesson{course.lessons > 1 ? 's' : ''}
                    </span>
                    <span>{course.duration}</span>
                  </div>
                  <button
                    onClick={(e) => handleEditCourse(e, course)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#D71920] text-white rounded-lg font-semibold hover:bg-[#B91518] transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showUploadForm || editingCourse) && (
        <CourseUploadForm
          coachId={currentUser.uid}
          editingCourse={editingCourse || undefined}
          onSuccess={handleUploadSuccess}
          onCancel={() => {
            setShowUploadForm(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}
