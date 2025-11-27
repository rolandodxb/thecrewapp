import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Award, PlayCircle, ChevronRight, CheckCircle, Folder, Layers, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  getUserEnrollments,
  getAverageProgress,
  getCompletedModulesCount,
  getInProgressModulesCount,
  ModuleEnrollment
} from '../services/enrollmentService';
import { getMainModule, getSubmodule, getAllMainModules } from '../services/mainModuleService';
import { calculateModuleProgress, getUserEnrollments as getCourseEnrollments } from '../services/courseService';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EnrolledItem {
  id: string;
  title: string;
  description: string;
  type: 'main_module' | 'submodule' | 'course';
  coverImage: string;
  enrolled_at: string;
  progress_percentage: number;
  completed: boolean;
  last_accessed: string;
}

export default function MyProgressPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [enrolledModules, setEnrolledModules] = useState<EnrolledItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    completed: 0,
    inProgress: 0,
    averageProgress: 0
  });

  useEffect(() => {
    if (currentUser) {
      loadProgressData();
    }
  }, [currentUser]);

  const loadProgressData = async () => {
    console.log('loadProgressData called, currentUser:', currentUser);
    if (!currentUser) {
      console.log('No current user, exiting loadProgressData');
      return;
    }

    try {
      setLoading(true);

      // Fetch ALL enrollments from course_enrollments collection
      const enrollmentsQuery = query(
        collection(db, 'course_enrollments'),
        where('user_id', '==', currentUser.uid)
      );

      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      console.log('Total enrollments found:', enrollmentsSnap.size);

      if (enrollmentsSnap.empty) {
        console.log('No enrollments found');
        setEnrolledModules([]);
        setStats({
          totalEnrolled: 0,
          completed: 0,
          inProgress: 0,
          averageProgress: 0
        });
        setLoading(false);
        return;
      }

      const enrolledModules: EnrolledItem[] = [];

      for (const enrollDoc of enrollmentsSnap.docs) {
        const enrollData = enrollDoc.data();
        console.log('Processing enrollment:', enrollDoc.id, enrollData);

        // The enrollment could be for a module_id or course_id
        const moduleId = enrollData.module_id || enrollData.course_id;

        if (!moduleId) {
          console.log('No module_id or course_id found in enrollment:', enrollDoc.id);
          continue;
        }

        try {
          // Try to fetch as main module first
          let module = await getMainModule(moduleId);
          let moduleType: 'main_module' | 'submodule' | 'course' = 'main_module';

          // If not found as main module, try submodule
          if (!module) {
            console.log('Not found as main module, trying submodule:', moduleId);
            module = await getSubmodule(moduleId);
            moduleType = 'submodule';
          }

          // If still not found, skip
          if (!module) {
            console.log('Module not found:', moduleId);
            continue;
          }

          console.log('Found module:', module.title, 'type:', moduleType);

          // Handle timestamps - convert Firestore Timestamp to ISO string
          const convertTimestamp = (timestamp: any): string => {
            if (!timestamp) return new Date().toISOString();
            if (typeof timestamp === 'string') return timestamp;
            if (timestamp.toDate) return timestamp.toDate().toISOString();
            if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toISOString();
            return new Date(timestamp).toISOString();
          };

          const enrolledAt = convertTimestamp(enrollData.enrolled_at);
          const lastAccessed = convertTimestamp(enrollData.last_accessed || enrollData.enrolled_at);
          const progressPercentage = enrollData.progress_percentage || 0;
          const completed = enrollData.completed || false;

          enrolledModules.push({
            id: moduleId,
            title: module.title,
            description: module.description,
            type: moduleType,
            coverImage: module.coverImage || '',
            enrolled_at: enrolledAt,
            progress_percentage: progressPercentage,
            completed: completed,
            last_accessed: lastAccessed
          });

          console.log('Added module to list:', module.title, 'progress:', progressPercentage);
        } catch (error) {
          console.error('Error processing module:', moduleId, error);
        }
      }

      console.log('Total enrolled modules processed:', enrolledModules.length);

      // Sort by last accessed (most recent first)
      enrolledModules.sort((a, b) =>
        new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
      );

      setEnrolledModules(enrolledModules);

      // Calculate stats
      const totalProgress = enrolledModules.reduce((sum, item) => sum + item.progress_percentage, 0);
      const avgProgress = enrolledModules.length > 0 ? Math.round(totalProgress / enrolledModules.length) : 0;
      const completed = enrolledModules.filter(item => item.completed).length;
      const inProgress = enrolledModules.filter(item => !item.completed && item.progress_percentage > 0).length;

      setStats({
        totalEnrolled: enrolledModules.length,
        completed,
        inProgress,
        averageProgress: avgProgress
      });

      console.log('Stats calculated:', {
        totalEnrolled: enrolledModules.length,
        completed,
        inProgress,
        averageProgress: avgProgress
      });

    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (moduleId: string, moduleType: 'main_module' | 'submodule' | 'course') => {
    if (moduleType === 'main_module') {
      navigate(`/main-modules/${moduleId}`);
    } else if (moduleType === 'submodule') {
      navigate(`/submodules/${moduleId}`);
    } else {
      navigate(`/courses/${moduleId}`);
    }
  };

  const handleContinueLearning = () => {
    if (enrolledModules.length > 0) {
      const lastModule = enrolledModules[0];
      handleModuleClick(lastModule.id, lastModule.type);
    } else {
      navigate('/courses');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Progress</h1>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-90">Average Progress</p>
                <p className="text-3xl font-bold">{stats.averageProgress}%</p>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="glass-card rounded-full h-2 transition-all duration-500"
                style={{ width: `${stats.averageProgress}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-widget p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Enrolled Modules</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalEnrolled}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Active enrollments</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-widget p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.completed}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Modules finished</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-widget p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <PlayCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.inProgress}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Currently learning</p>
          </motion.div>
        </div>

        {enrolledModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-[#EADBC8] to-[#F5E6D3] rounded-2xl p-8 mb-8 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Continue Where You Left Off</h2>
                <p className="text-gray-700 mb-4">
                  Last module: <span className="font-semibold">{enrolledModules[0].title}</span>
                </p>
                <button
                  onClick={handleContinueLearning}
                  className="flex items-center gap-2 px-6 py-3 bg-[#D71920] hover:bg-[#B91518] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                >
                  <PlayCircle className="w-5 h-5" />
                  Continue Learning
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <PlayCircle className="w-24 h-24 text-[#D71920] opacity-20" />
            </div>
          </motion.div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Enrolled Modules</h2>
          <p className="text-gray-600">Click on any module to continue learning</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => handleModuleClick(module.id, module.type)}
              className="glass-course overflow-hidden transition cursor-pointer border border-transparent hover:border-[#D71920]"
            >
              <div className="relative">
                {module.coverImage ? (
                  <img
                    src={module.coverImage}
                    alt={module.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    {module.type === 'main_module' ? (
                      <Folder className="w-16 h-16 text-gray-400" />
                    ) : module.type === 'submodule' ? (
                      <Layers className="w-16 h-16 text-gray-400" />
                    ) : (
                      <FileText className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                )}
                {module.completed && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Completed
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${
                    module.type === 'main_module' ? 'bg-red-100' :
                    module.type === 'submodule' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {module.type === 'main_module' ? (
                      <Folder className="w-5 h-5 text-[#D71920]" />
                    ) : module.type === 'submodule' ? (
                      <Layers className="w-5 h-5 text-blue-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {module.type === 'main_module' ? 'Main Module' :
                     module.type === 'submodule' ? 'Submodule' :
                     'Course'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{module.description}</p>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Progress</span>
                    <span className="text-sm font-bold text-[#D71920]">{module.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        module.completed
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-[#D71920] to-[#B91518]'
                      }`}
                      style={{ width: `${module.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last accessed: {new Date(module.last_accessed).toLocaleDateString()}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          ))}

          {enrolledModules.length === 0 && (
            <div className="col-span-2 glass-card rounded-2xl p-12 text-center shadow-lg">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Enrolled Modules</h3>
              <p className="text-gray-600 mb-6">
                Start your learning journey by enrolling in available modules.
              </p>
              <button
                onClick={() => navigate('/courses')}
                className="px-6 py-3 bg-[#D71920] hover:bg-[#B91518] text-white rounded-xl font-bold transition"
              >
                Browse Modules
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
