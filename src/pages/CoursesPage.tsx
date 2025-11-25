import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, Folder, Layers, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { enrollInModule } from '../services/enrollmentService';
import FeatureAccessGuard from '../components/FeatureAccessGuard';

interface Submodule {
  id: string;
  type: string;
  parentModuleId: string;
  order: number;
  title: string;
  description: string;
  coverImage: string;
  course_id?: string;
  course1_id?: string;
  course2_id?: string;
  created_at: string;
  updated_at: string;
  expanded: boolean;
  enrolled?: boolean;
}

interface MainModule {
  id: string;
  type: string;
  title: string;
  description: string;
  coverImage: string;
  visible: boolean;
  course_id?: string;
  course1_id?: string;
  course2_id?: string;
  created_at: string;
  updated_at: string;
  submodules: Submodule[];
  expanded: boolean;
  enrolled?: boolean;
}

function CoursesPageContent() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [mainModules, setMainModules] = useState<MainModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser && (currentUser.role === 'mentor' || currentUser.role === 'governor')) {
      navigate('/coach-dashboard');
      return;
    }
    loadMainModules();
  }, [currentUser, navigate]);

  const checkEnrollment = async (userId: string, moduleId: string): Promise<boolean> => {
    try {
      const enrollmentRef = doc(db, 'course_enrollments', `${userId}_${moduleId}`);
      const enrollmentSnap = await getDoc(enrollmentRef);
      return enrollmentSnap.exists();
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  };

  const loadMainModules = async () => {
    try {
      setLoading(true);

      const mainModulesRef = collection(db, 'main_modules');
      const mainModulesSnap = await getDocs(mainModulesRef);

      const mainModulesData: MainModule[] = await Promise.all(
        mainModulesSnap.docs.map(async (doc) => {
          const mainModuleData = doc.data();

          const isEnrolled = currentUser ? await checkEnrollment(currentUser.uid, doc.id) : false;

          const submodulesFromDoc = mainModuleData.submodules || [];

          const submodulesData: Submodule[] = await Promise.all(
            submodulesFromDoc.map(async (subData: any) => {
              const isSubEnrolled = currentUser ? await checkEnrollment(currentUser.uid, subData.id) : false;
              return {
                id: subData.id,
                type: 'submodule',
                parentModuleId: doc.id,
                order: subData.order,
                title: subData.title,
                description: subData.description,
                coverImage: subData.coverImage,
                course_id: subData.course_id,
                course1_id: subData.course1_id,
                course2_id: subData.course2_id,
                created_at: mainModuleData.created_at || '',
                updated_at: mainModuleData.updated_at || '',
                expanded: false,
                enrolled: isSubEnrolled
              } as Submodule;
            })
          );

          submodulesData.sort((a, b) => a.order - b.order);

          return {
            id: doc.id,
            type: mainModuleData.type || 'main',
            title: mainModuleData.title || 'Untitled Module',
            description: mainModuleData.description || '',
            coverImage: mainModuleData.coverImage || '',
            visible: mainModuleData.visible !== false,
            course_id: mainModuleData.course_id,
            course1_id: mainModuleData.course1_id,
            course2_id: mainModuleData.course2_id,
            created_at: mainModuleData.created_at || '',
            updated_at: mainModuleData.updated_at || '',
            submodules: submodulesData,
            expanded: false,
            enrolled: isEnrolled
          };
        })
      );

      setMainModules(mainModulesData);
      console.log('Loaded main modules:', mainModulesData.length);
      console.log('Modules with content:', mainModulesData);

      mainModulesData.forEach((module, index) => {
        console.log(`Module ${index + 1}:`, {
          id: module.id,
          title: module.title,
          course_id: module.course_id,
          course1_id: module.course1_id,
          course2_id: module.course2_id,
          submodules: module.submodules.length,
          submodulesDetail: module.submodules.map(sub => ({
            id: sub.id,
            title: sub.title,
            course_id: sub.course_id,
            course1_id: sub.course1_id,
            course2_id: sub.course2_id
          }))
        });
      });
    } catch (error) {
      console.error('Error loading main modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMainModule = (mainModuleId: string) => {
    setMainModules(prev =>
      prev.map(mm =>
        mm.id === mainModuleId ? { ...mm, expanded: !mm.expanded } : mm
      )
    );
  };

  const toggleSubmodule = (mainModuleId: string, submoduleId: string) => {
    setMainModules(prev =>
      prev.map(mm =>
        mm.id === mainModuleId
          ? {
              ...mm,
              submodules: mm.submodules.map(sm =>
                sm.id === submoduleId ? { ...sm, expanded: !sm.expanded } : sm
              )
            }
          : mm
      )
    );
  };

  const handleEnrollModule = async (moduleId: string, moduleType: 'main_module' | 'submodule') => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      console.log('Enrolling in module:', moduleId, 'type:', moduleType);

      await enrollInModule(currentUser.uid, moduleId, moduleType);
      console.log('Enrollment successful, reloading modules...');

      await loadMainModules();
      console.log('Navigating to module viewer...');

      navigate(`/${moduleType === 'main_module' ? 'main-modules' : 'submodules'}/${moduleId}`);
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll. Please try again.');
    }
  };

  const handleMainModuleClick = (moduleId: string, isEnrolled: boolean) => {
    console.log('CoursesPage: Main module clicked:', moduleId, 'enrolled:', isEnrolled);
    if (isEnrolled) {
      console.log('CoursesPage: Navigating to /main-modules/' + moduleId);
      navigate(`/main-modules/${moduleId}`);
    }
  };

  const handleSubmoduleClick = (submoduleId: string, isEnrolled: boolean) => {
    console.log('CoursesPage: Submodule clicked:', submoduleId, 'enrolled:', isEnrolled);
    if (isEnrolled) {
      console.log('CoursesPage: Navigating to /submodules/' + submoduleId);
      navigate(`/submodules/${submoduleId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D71920] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 px-4 md:px-0">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Learning Modules</h1>
          <p className="text-sm md:text-base text-gray-600">Explore our comprehensive training modules</p>
        </div>

        {mainModules.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center shadow-lg">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">No Modules Available</h3>
            <p className="text-sm md:text-base text-gray-600">Training modules will be added soon.</p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {mainModules.map((mainModule) => (
              <motion.div
                key={mainModule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-course border-transparent hover:border-[#D71920] transition"
              >
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                    {mainModule.coverImage && (
                      <img
                        src={mainModule.coverImage}
                        alt={mainModule.title}
                        className="w-full md:w-32 h-48 md:h-32 object-cover rounded-xl shadow-md md:flex-shrink-0"
                      />
                    )}

                    <div className="flex-1 w-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-2 md:gap-3 flex-1">
                          <div className="p-2 md:p-3 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-xl flex-shrink-0">
                            <Folder className="w-4 h-4 md:w-6 md:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h2 className="text-lg md:text-2xl font-bold text-gray-900 break-words">{mainModule.title}</h2>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                              <span className="flex items-center gap-1 text-xs md:text-sm text-gray-500">
                                <Layers className="w-3 h-3 md:w-4 md:h-4" />
                                {mainModule.submodules.length} submodules
                              </span>
                              <span className={`flex items-center gap-1 text-xs md:text-sm ${mainModule.visible ? 'text-green-600' : 'text-gray-400'}`}>
                                {mainModule.visible ? <Eye className="w-3 h-3 md:w-4 md:h-4" /> : <EyeOff className="w-3 h-3 md:w-4 md:h-4" />}
                                {mainModule.visible ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => toggleMainModule(mainModule.id)}
                          className="p-1.5 md:p-2 hover:glass-bubble rounded-lg transition flex-shrink-0"
                        >
                          {mainModule.expanded ? (
                            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                          )}
                        </button>
                      </div>

                      <p className="text-sm md:text-base text-gray-700 mb-4 leading-relaxed">{mainModule.description}</p>

                      {mainModule.enrolled ? (
                        <button
                          onClick={() => handleMainModuleClick(mainModule.id, true)}
                          className="w-full md:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                          <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                          Continue Learning
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnrollModule(mainModule.id, 'main_module')}
                          className="w-full md:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-[#D71920] hover:bg-[#B91518] text-white rounded-xl font-semibold transition shadow-md hover:shadow-lg text-sm md:text-base"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {mainModule.expanded && mainModule.submodules.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 glass-light"
                    >
                      <div className="p-4 md:p-6">
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
                          <Layers className="w-4 h-4 md:w-5 md:h-5 text-[#D71920]" />
                          Submodules ({mainModule.submodules.length})
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          {mainModule.submodules.map((submodule) => (
                            <motion.div
                              key={submodule.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="glass-light overflow-hidden transition border border-transparent hover:border-blue-500"
                            >
                              <div className="p-3 md:p-4">
                                <div className="flex flex-col md:flex-row items-start gap-3">
                                  {submodule.coverImage && (
                                    <img
                                      src={submodule.coverImage}
                                      alt={submodule.title}
                                      className="w-full md:w-20 h-32 md:h-20 object-cover rounded-lg md:flex-shrink-0"
                                    />
                                  )}

                                  <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                          <Folder className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-xs md:text-sm break-words">{submodule.title}</h4>
                                      </div>
                                      <span className="text-[10px] md:text-xs bg-blue-100 text-blue-700 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-semibold flex-shrink-0 ml-2">
                                        #{submodule.order}
                                      </span>
                                    </div>

                                    <p className="text-xs md:text-sm text-gray-600 mb-3 line-clamp-2">{submodule.description}</p>

                                    {submodule.enrolled ? (
                                      <button
                                        onClick={() => handleSubmoduleClick(submodule.id, true)}
                                        className="w-full px-3 md:px-4 py-1.5 md:py-2 bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm rounded-lg font-semibold transition flex items-center justify-center gap-2"
                                      >
                                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                                        Continue
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEnrollModule(submodule.id, 'submodule');
                                        }}
                                        className="w-full px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm rounded-lg font-semibold transition"
                                      >
                                        Enroll
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <FeatureAccessGuard featureKey="modules">
      <CoursesPageContent />
    </FeatureAccessGuard>
  );
}
