import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, MessageCircle, Users, TrendingUp, Award, GraduationCap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserEnrollments } from '../services/courseService';
import { getUserPoints } from '../services/rewardsService';
import EmptyState from '../components/EmptyState';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeSessions: 0,
    supportRequests: 0,
    activeStudents: 0,
    coursesCreated: 0,
    messages: 0,
    coursesEnrolled: 0,
    overallProgress: 0,
    certificatesEarned: 0
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }

    // Redirect to role-specific dashboards
    if (currentUser.role === 'finance') {
      navigate('/finance-dashboard', { replace: true });
    } else if (currentUser.role === 'moderator') {
      navigate('/moderator-dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      setIsLoading(false);
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      let totalUsers = 0;
      let totalCourses = 0;
      let activeSessions = 0;
      let supportRequests = 0;

      if (currentUser.role === 'governor' || currentUser.role === 'mentor') {
        // Load users count
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        totalUsers = usersSnapshot.size;

        // Load courses count
        const coursesRef = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesRef);
        totalCourses = coursesSnapshot.size;

        // Load active simulations (as active sessions)
        const simulationsRef = collection(db, 'open_day_simulations');
        const activeSimsQuery = query(simulationsRef, where('completed', '==', false));
        const activeSimsSnapshot = await getDocs(activeSimsQuery);
        activeSessions = activeSimsSnapshot.size;
      }

      // Role-specific data
      let roleSpecificData = {};

      if (currentUser.role === 'mentor') {
        const usersRef = collection(db, 'users');
        const coursesRef = collection(db, 'courses');

        // Count students (for mentors)
        const studentsQuery = query(usersRef, where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);
        const activeStudents = studentsSnapshot.size;

        // Count courses created by this mentor
        const mentorCoursesQuery = query(coursesRef, where('coach_id', '==', currentUser.uid));
        const mentorCoursesSnapshot = await getDocs(mentorCoursesQuery);
        const coursesCreated = mentorCoursesSnapshot.size;

        roleSpecificData = {
          activeStudents,
          coursesCreated,
          messages: 0
        };
      } else if (currentUser.role === 'student') {
        const enrollments = await getUserEnrollments(currentUser.uid);
        const completedEnrollments = enrollments.filter(e => e.completed);

        let overallProgress = 0;
        if (enrollments.length > 0) {
          const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
          overallProgress = Math.round(totalProgress / enrollments.length);
        }

        roleSpecificData = {
          coursesEnrolled: enrollments.length,
          overallProgress: overallProgress,
          certificatesEarned: completedEnrollments.length
        };
      }

      setDashboardData({
        totalUsers,
        totalCourses,
        activeSessions,
        supportRequests,
        ...roleSpecificData
      });
    } catch (error: any) {
      if (error?.code !== 'permission-denied' && !error?.message?.includes('Missing or insufficient permissions')) {
        console.error('Error loading dashboard data:', error);
      }
    }
  };

  if (!currentUser || isLoading) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (currentUser.role === 'student') {
    return (
      <>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
              Welcome back, {currentUser.name.split(' ')[0]}!
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Continue your journey to cabin crew excellence
            </p>
          </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#FF3B3F] to-[#E6282C] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Courses Enrolled</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.coursesEnrolled}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#3D4A52] to-[#2A3439] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Overall Progress</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.overallProgress}%</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#5A6B75] to-[#3D4A52] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <Award className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Certificates Earned</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.certificatesEarned}</p>
          </motion.div>
        </div>

        {dashboardData.coursesEnrolled === 0 && (
          <motion.div variants={itemVariants}>
            <EmptyState
              icon={BookOpen}
              title="No Courses Yet"
              description="You haven't enrolled in any courses yet. Explore our free lessons or browse courses to get started on your cabin crew journey."
              action={{
                label: 'Explore Courses',
                onClick: () => navigate('/courses'),
              }}
              secondaryAction={{
                label: 'View Leaderboard',
                onClick: () => navigate('/leaderboard'),
              }}
            />
          </motion.div>
        )}
        </motion.div>
      </>
    );
  }

  if (currentUser.role === 'mentor') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
            Mentor Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage your students and educational content
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#FF3B3F] to-[#E6282C] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <Users className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Active Students</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.activeStudents}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#3D4A52] to-[#2A3439] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Courses Created</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.coursesCreated}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#5A6B75] to-[#3D4A52] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Messages</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.messages}</p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <EmptyState
            icon={GraduationCap}
            title="Start Creating Content"
            description="No uploads yet. Start by adding your first course or resource to help your students succeed in their cabin crew journey."
            action={{
              label: 'Upload Content',
              onClick: () => navigate('/coach-dashboard'),
            }}
            secondaryAction={{
              label: 'View Students',
              onClick: () => navigate('/students'),
            }}
          />
        </motion.div>
      </motion.div>
    );
  }

  if (currentUser.role === 'governor') {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#000000] mb-2">
            Governor Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            System overview and management
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#FF3B3F] to-[#E6282C] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <Users className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Total Users</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.totalUsers}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#3D4A52] to-[#2A3439] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Total Courses</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.totalCourses}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#5A6B75] to-[#3D4A52] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <TrendingUp className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Active Sessions</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.activeSessions}</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-[#E6282C] to-[#CC2428] rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white"
          >
            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 mb-3 md:mb-4 opacity-80" />
            <p className="text-xs md:text-sm opacity-90 mb-1">Support Requests</p>
            <p className="text-3xl md:text-4xl font-bold">{dashboardData.supportRequests}</p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <EmptyState
            icon={BarChart3}
            title="No Analytics Data Yet"
            description="Once mentors and students begin interacting with the platform, comprehensive metrics and analytics will appear here to help you monitor system performance."
            action={{
              label: 'Manage Users',
              onClick: () => navigate('/users'),
            }}
            secondaryAction={{
              label: 'System Settings',
              onClick: () => navigate('/maintenance'),
            }}
          />
        </motion.div>
      </motion.div>
    );
  }

  return null;
}