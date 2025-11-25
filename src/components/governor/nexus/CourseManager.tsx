import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Trash2, Eye, EyeOff, Video, FileText, Search, Award, Plus } from 'lucide-react';
import { getAllCourses, deleteCourse, Course } from '../../../services/courseService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { getExamByCourseId } from '../../../services/examService';
import ExamCreationForm from '../../ExamCreationForm';
import { useApp } from '../../../context/AppContext';

export default function CourseManager() {
  const { currentUser } = useApp();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'video'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [examStatuses, setExamStatuses] = useState<Record<string, boolean>>({});
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const allCourses = await getAllCourses();
      setCourses(allCourses);

      const statuses: Record<string, boolean> = {};
      for (const course of allCourses) {
        const exam = await getExamByCourseId(course.id);
        statuses[course.id] = exam !== null;
      }
      setExamStatuses(statuses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuppressCourse = async (courseId: string, currentlySuppressed: boolean) => {
    setActionInProgress(courseId);
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        suppressed: !currentlySuppressed,
        suppressed_at: !currentlySuppressed ? new Date().toISOString() : null,
      });
      await loadCourses();
    } catch (error) {
      console.error('Error suppressing course:', error);
      alert('Failed to update course status');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Are you sure you want to permanently delete "${course.title}"? This action cannot be undone.`)) {
      return;
    }

    setActionInProgress(course.id);
    try {
      await deleteCourse(course.id, course.pdf_path);
      await loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAddExam = (course: Course) => {
    setSelectedCourse(course);
    setShowExamForm(true);
  };

  const handleExamCreated = () => {
    loadCourses();
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || course.content_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light border border-gray-200 rounded-xl p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900">Course Management</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2 glass-light border border-gray-200 rounded-xl text-gray-900 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              filterType === 'all'
                ? 'bg-[#3D4A52] text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('pdf')}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              filterType === 'pdf'
                ? 'bg-[#3D4A52] text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            PDF
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              filterType === 'video'
                ? 'bg-[#3D4A52] text-white'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Video className="w-4 h-4 inline mr-1" />
            Video
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          {searchQuery || filterType !== 'all' ? 'No courses match your filters' : 'No courses found'}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredCourses.map((course) => {
            const isSuppressed = (course as any).suppressed === true;
            const isProcessing = actionInProgress === course.id;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`bg-gray-50 border rounded-xl p-4 ${
                  isSuppressed ? 'border-red-700 opacity-60' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{course.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {course.instructor} • {course.category} • {course.level}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {course.content_type === 'video' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              <Video className="w-3 h-3" />
                              Video
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              <FileText className="w-3 h-3" />
                              PDF
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                            {course.plan.toUpperCase()}
                          </span>
                          {isSuppressed && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-bold">
                              SUPPRESSED
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddExam(course)}
                          disabled={isProcessing}
                          className={`p-2 rounded-xl transition ${
                            examStatuses[course.id]
                              ? 'bg-green-900 text-green-200'
                              : 'bg-blue-900 hover:bg-blue-800 text-blue-200'
                          } disabled:opacity-50`}
                          title={examStatuses[course.id] ? 'Exam exists' : 'Add exam'}
                        >
                          {examStatuses[course.id] ? <Award className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleSuppressCourse(course.id, isSuppressed)}
                          disabled={isProcessing}
                          className={`p-2 rounded-xl transition ${
                            isSuppressed
                              ? 'bg-green-900 hover:bg-green-800 text-green-200'
                              : 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200'
                          } disabled:opacity-50`}
                          title={isSuppressed ? 'Restore course' : 'Suppress course'}
                        >
                          {isSuppressed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          disabled={isProcessing}
                          className="p-2 bg-red-900 hover:bg-red-800 text-red-200 rounded-xl transition disabled:opacity-50"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Total: {filteredCourses.length} course(s) •
          Suppressed: {filteredCourses.filter((c: any) => c.suppressed).length} •
          With Exams: {Object.values(examStatuses).filter(Boolean).length}
        </div>
      </div>

      {showExamForm && selectedCourse && currentUser && (
        <ExamCreationForm
          moduleId={selectedCourse.main_module_id || selectedCourse.submodule_id || 'default'}
          lessonId={selectedCourse.id}
          courseId={selectedCourse.id}
          createdBy={currentUser.uid}
          onClose={() => {
            setShowExamForm(false);
            setSelectedCourse(null);
          }}
          onSuccess={handleExamCreated}
        />
      )}
    </motion.div>
  );
}
