import { ReactNode } from 'react';
import { Search, Mic, Bell, User, LogOut, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import ModernSidebar from './ModernSidebar';

interface ModernDashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function ModernDashboardLayout({ children, title }: ModernDashboardLayoutProps) {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fixed Background Image with reduced opacity */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage: 'url("https://images.pexels.com/photos/2387877/pexels-photo-2387877.jpeg?auto=compress&cs=tinysrgb&w=1920")',
          backgroundAttachment: 'fixed'
        }}
      />

      {/* Overlay gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50/80 via-gray-100/80 to-gray-200/80 backdrop-blur-sm" />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen">
        {/* Modern Sidebar */}
        <ModernSidebar />

        {/* Top Bar - Responsive */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-40 flex items-center gap-1.5 sm:gap-2 md:gap-3"
        >
          {/* Search Bar - Hidden on small screens to prevent overlap */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-40 lg:w-56 xl:w-64 pl-9 lg:pl-11 pr-9 lg:pr-11 py-2 lg:py-2.5 bg-white/90 backdrop-blur-xl rounded-full text-xs lg:text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-lg transition"
            />
            <Mic className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 text-gray-400" />
          </div>

          {/* Notifications Button - Magenta/Pink */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/notifications')}
            className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </motion.button>

          {/* Profile Button - Green */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
            title="My Profile"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </motion.button>

          {/* Logout Button - White */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 sm:p-2.5 md:p-3 bg-white/90 backdrop-blur-xl text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </motion.button>
        </motion.div>

        {/* Main Content Area - Responsive */}
        <div className="pt-16 sm:pt-20 md:pt-24 px-2 sm:px-3 md:px-4 lg:px-6 pb-4 sm:pb-6 md:pb-8">
          <div className="max-w-7xl 2xl:max-w-[1920px] mx-auto">
            {title && (
              <motion.h1
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6"
              >
                {title}
              </motion.h1>
            )}

            {/* Content Card - Responsive */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] md:min-h-[calc(100vh-12rem)]"
            >
              {children}
            </motion.div>
          </div>
        </div>

        {/* Page Indicator Dots - Smaller size */}
        <div className="fixed bottom-3 sm:bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 sm:gap-1.5">
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-900 rounded-full"></div>
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
