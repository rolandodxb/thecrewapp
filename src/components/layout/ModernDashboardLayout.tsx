import { ReactNode, useState } from 'react';
import { Search, Mic, Bell, User, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import ModernSidebar from './ModernSidebar';
import GlobalSearchBar from '../GlobalSearchBar';

interface ModernDashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function ModernDashboardLayout({ children, title }: ModernDashboardLayoutProps) {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
          {/* Search Button for Mobile - Shows modal */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMobileSearch(true)}
            className="lg:hidden p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
            title="Search"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </motion.button>

          {/* Notifications Button - Pink */}
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

        {/* Desktop Search Bar - Top Center */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="hidden lg:block fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
        >
          <GlobalSearchBar />
        </motion.div>

        {/* Mobile Search Modal */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setShowMobileSearch(false)}
            >
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-0 left-0 right-0 bg-white p-4 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setShowMobileSearch(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold">Search</h3>
                </div>
                <GlobalSearchBar />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
