import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, Upload, Layers, BookOpen, Play, FileText, Edit } from 'lucide-react';
import { getAllMainModules, getSubmodulesByParent, MainModule } from '../services/mainModuleService';
import { getAllCourses, Course } from '../services/courseService';
import { motion } from 'framer-motion';

export default function NewCoachDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [mainModules, setMainModules] = useState<MainModule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submoduleCounts, setSubmoduleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'mentor' && currentUser.role !== 'governor')) {
      navigate('/dashboard');
      return;
    }

    loadModules();
  }, [currentUser, navigate]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const [modules, allCourses] = await Promise.all([
        getAllMainModules(),
        getAllCourses()
      ]);

      setMainModules(modules);
      setCourses(allCourses);

      const counts: Record<string, number> = {};
      for (const module of modules) {
        const submodules = await getSubmodulesByParent(module.id);
        counts[module.id] = submodules.length;
      }
      setSubmoduleCounts(counts);
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || (currentUser.role !== 'mentor' && currentUser.role !== 'governor')) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">
          Coach Dashboard
        </h1>
        <p className="text-gray-600">Manage your training modules and courses</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/create-module')}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition"
        >
          <div className="glass-light/20 p-3 rounded-lg">
            <FolderPlus className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">Create Module</h3>
            <p className="text-blue-100 text-sm">Add a new main module or submodule</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/create-course')}
          className="flex items-center gap-4 p-6 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl shadow-lg hover:shadow-xl transition"
        >
          <div className="glass-light/20 p-3 rounded-lg">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold">Add Course</h3>
            <p className="text-red-100 text-sm">Upload a new course to a submodule</p>
          </div>
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Main Modules ({mainModules.length})
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
        </div>
      ) : mainModules.length === 0 ? (
        <div className="glass-light rounded-xl shadow-lg p-12 text-center">
          <FolderPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Modules Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first main module to start building your training program
          </p>
          <button
            onClick={() => navigate('/create-module')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create First Module
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainModules.map((module) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-light rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
              onClick={() => navigate(`/main-modules/${module.id}`)}
            >
              <img
                src={module.coverImage}
                alt={module.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    Main Module
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{module.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Layers className="w-4 h-4" />
                  <span>{submoduleCounts[module.id] || 0} Submodules</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}


      <div className="mt-12 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          All Courses ({courses.length})
        </h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-light rounded-xl shadow-lg p-12 text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Courses Yet</h3>
          <p className="text-gray-600 mb-6">
            Upload your first course to start training students
          </p>
          <button
            onClick={() => navigate('/create-course')}
            className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-semibold hover:shadow-lg transition inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-light rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => navigate(`/course/${course.id}`)}
              />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    course.content_type === 'video' ? 'bg-red-100 text-red-700' :
                    course.content_type === 'pdf' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {course.content_type === 'video' && <Play className="w-3 h-3 inline mr-1" />}
                    {course.content_type === 'pdf' && <FileText className="w-3 h-3 inline mr-1" />}
                    {course.content_type === 'text' && <BookOpen className="w-3 h-3 inline mr-1" />}
                    {course.content_type.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    course.level === 'beginner' ? 'bg-green-100 text-green-700' :
                    course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {course.level.toUpperCase()}
                  </span>
                </div>
                <h3
                  className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-[#D71920] transition"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{course.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <BookOpen className="w-4 h-4" />
                    {course.lessons} Lessons
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/create-course', { state: { course } });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
