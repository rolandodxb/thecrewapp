import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FolderPlus, Upload, BookOpen, Play, Folder, CheckCircle } from 'lucide-react';
import { getMainModule, getSubmodulesByParent, MainModule, Submodule } from '../services/mainModuleService';
import { getCoursesByModule, Course, calculateModuleProgress } from '../services/courseService';
import { motion } from 'framer-motion';
import CreateModuleForm from '../components/CreateModuleForm';
import NewCourseForm from '../components/NewCourseForm';
import { useApp } from '../context/AppContext';
import { updateLastAccessed, isEnrolledInModule } from '../services/enrollmentService';
import { supabase } from '../lib/auth';
import ModuleExamTrigger from '../components/ModuleExamTrigger';
export default function MainModuleViewerPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [mainModule, setMainModule] = useState<MainModule | null>(null);
  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCompletionStatus, setCourseCompletionStatus] = useState<Record<string, { completed: boolean; examPassed: boolean }>>({});
  const [moduleProgress, setModuleProgress] = useState({ progress: 0, completedCount: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const isAdmin = currentUser?.role === 'mentor' || currentUser?.role === 'governor';
  useEffect(() => {
    if (moduleId) {
      loadModuleData();
    }
  }, [moduleId]);
  const loadModuleData = async () => {
    if (!moduleId) return;
    try {
      console.log('MainModuleViewer: Loading module:', moduleId);
      console.log('MainModuleViewer: Current user:', currentUser?.email, 'isAdmin:', isAdmin);
      const module = await getMainModule(moduleId);
      setMainModule(module);
      if (module) {
        console.log('MainModuleViewer: Skipping enrollment check - allowing all users to view modules');
        if (currentUser && moduleId) {
          await updateLastAccessed(currentUser.uid, moduleId);
        }
        const submodulesFromModule = module.submodules || [];
        setSubmodules(submodulesFromModule);
        const courseIds: string[] = [];
        if (module.course_id) courseIds.push(module.course_id);
        if (module.course1_id) courseIds.push(module.course1_id);
        if (module.course2_id) courseIds.push(module.course2_id);
        console.log('MainModuleViewer: Module data:', module);
        console.log('MainModuleViewer: Course IDs found:', courseIds);
        if (courseIds.length > 0) {
          const coursesData = await Promise.all(
            courseIds.map(async (courseId) => {
              console.log('MainModuleViewer: Fetching course:', courseId);
              const courseDoc = await getDoc(doc(db, 'courses', courseId));
              if (courseDoc.exists()) {
                console.log('MainModuleViewer: Course found:', courseDoc.id, courseDoc.data());
                return { id: courseDoc.id, ...courseDoc.data() } as Course;
              } else {
                console.log('MainModuleViewer: Course not found:', courseId);
              }
              return null;
            })
          );
          const validCourses = coursesData.filter(c => c !== null) as Course[];
          console.log('MainModuleViewer: Valid courses:', validCourses);
          setCourses(validCourses);
          if (currentUser && validCourses.length > 0) {
            await loadCourseCompletionStatus(validCourses.map(c => c.id));
            // Calculate module progress
            const progress = await calculateModuleProgress(currentUser.uid, courseIds);
            setModuleProgress(progress);
          }
        } else {
          console.log('MainModuleViewer: No course IDs in module');
          setCourses([]);
        }
      }
    } catch (error) {
      console.error('Error loading main module:', error);
    } finally {
      setLoading(false);
    }
  };
  const loadCourseCompletionStatus = async (courseIds: string[]) => {
    if (!currentUser) return;
    const statusMap: Record<string, { completed: boolean; examPassed: boolean }> = {};
    for (const courseId of courseIds) {
      const progressRef = doc(db, 'course_progress', `${currentUser.uid}_${courseId}`);
      const progressSnap = await getDoc(progressRef);
      const completed = progressSnap.exists() && progressSnap.data().completed === true;
      const examsRef = collection(db, 'exams');
      const examQuery = query(examsRef, where('courseId', '==', courseId));
      const examSnapshot = await getDocs(examQuery);
      let examPassed = false;
      if (!examSnapshot.empty) {
        const exam = examSnapshot.docs[0];
        const examId = exam.id;
        const resultRef = doc(db, 'userExams', `${examId}_${currentUser.uid}_latest`);
        const resultSnap = await getDoc(resultRef);
        examPassed = resultSnap.exists() && resultSnap.data().passed === true;
      } else {
        examPassed = true;
      }
      statusMap[courseId] = { completed, examPassed };
    }
    setCourseCompletionStatus(statusMap);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
      </div>
    );
  }
  if (!mainModule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Module Not Found</h1>
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
          onClick={() => navigate(isAdmin ? '/coach-dashboard' : '/courses')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to {isAdmin ? 'Dashboard' : 'Courses'}
        </button>
        <div className="glass-card overflow-hidden mb-8">
          {mainModule.coverImage && (
            <img
              src={mainModule.coverImage}
              alt={mainModule.title}
              className="w-full h-80 object-cover"
            />
          )}
          <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{mainModule.title}</h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">{mainModule.description}</p>
            {currentUser && moduleProgress.totalCount > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Module Progress: {moduleProgress.completedCount} of {moduleProgress.totalCount} courses completed
                  </span>
                  <span className="text-sm font-bold text-[#D71920]">{moduleProgress.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D71920] to-[#B91518] transition-all duration-500 rounded-full"
                    style={{ width: `${moduleProgress.progress}%` }}
                  />
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  <Plus className="w-5 h-5" />
                  Add Submodule
                </button>
                <button
                  onClick={() => setShowAddCourse(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:shadow-lg transition"
                >
                  <Upload className="w-5 h-5" />
                  Add Course
                </button>
              </div>
            )}
          </div>
        </div>
        {currentUser && moduleId && mainModule && courses.length > 0 && (
          <ModuleExamTrigger
            userId={currentUser.uid}
            courseIds={courses.map(c => c.id)}
            moduleId={moduleId}
            moduleName={mainModule.title}
          />
        )}
        {courses.length > 0 && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-[#D71920]" />
                Courses
              </h2>
              <p className="text-gray-600">Direct courses in this module</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const status = courseCompletionStatus[course.id];
                const isCompleted = status?.completed && status?.examPassed;
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`glass-course overflow-hidden transition cursor-pointer border-2 ${
                      isCompleted
                        ? 'bg-green-50/40 border-green-500/50 hover:border-green-500'
                        : 'border-transparent hover:border-[#D71920]'
                    }`}
                    onClick={() => {
                      console.log('MainModuleViewer: Navigating to course:', course.id, 'with moduleId:', moduleId);
                      navigate(`/course/${course.id}?moduleId=${moduleId}&type=main`);
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
                    {course.video_url && !isCompleted && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                    {isCompleted && (
                      <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2 shadow-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
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
              );
              })}
            </div>
          </div>
        )}
        {submodules.length > 0 && (
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Folder className="w-8 h-8 text-blue-600" />
                Submodules
              </h2>
              <p className="text-gray-600">Explore submodules within this module</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submodules.map((submodule) => (
                <motion.div
                  key={submodule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden transition cursor-pointer border-2 border-transparent hover:border-blue-500"
                  onClick={() => navigate(`/submodules/${submodule.id}`)}
                >
                  {submodule.coverImage ? (
                    <img
                      src={submodule.coverImage}
                      alt={submodule.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Folder className="w-16 h-16 text-blue-400" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        Submodule #{submodule.order}
                      </span>
                      {(submodule.course_id || submodule.course1_id) && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {submodule.course1_id && submodule.course2_id ? '2 Videos' : '1 Video'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{submodule.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{submodule.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        {courses.length === 0 && submodules.length === 0 && (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Content Yet</h3>
            <p className="text-gray-600 mb-6">
              {isAdmin
                ? 'Start building this module by adding courses or submodules'
                : 'This module is being prepared. Check back soon!'
              }
            </p>
            {isAdmin && (
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setShowAddCourse(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:shadow-lg transition inline-flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Add Course
                </button>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Submodule
                </button>
              </div>
            )}
          </div>
        )}
        {isAdmin && (
          <>
            <CreateModuleForm
              isOpen={showCreateForm}
              onClose={() => setShowCreateForm(false)}
              onSuccess={loadModuleData}
            />
            <NewCourseForm
              isOpen={showAddCourse}
              onClose={() => setShowAddCourse(false)}
              onSuccess={loadModuleData}
              preselectedMainModuleId={moduleId}
            />
          </>
        )}
      </div>
    </div>
  );
}