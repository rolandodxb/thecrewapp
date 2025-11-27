import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AlertCircle, Search, Mic, Bell, Settings, User, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import OfflineIndicator from '../OfflineIndicator';
import ModernSidebar from './ModernSidebar';
import GlobalSearchBar from '../GlobalSearchBar';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { banners, currentUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Special pages that need full-screen (no layout)
  const isFullScreenPage = ['/chat', '/login', '/register', '/'].includes(location.pathname);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Full screen pages (Chat, Login, Landing) - no layout
  if (isFullScreenPage) {
    return <>{children}</>;
  }

  // All other pages get the modern layout
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Offline Indicator */}
      <OfflineIndicator />

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
        {currentUser && <ModernSidebar />}

        {/* Desktop Search Bar - Top Center */}
        {currentUser && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="hidden lg:block fixed top-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4"
            style={{ marginRight: '300px' }}
          >
            <GlobalSearchBar />
          </motion.div>
        )}

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

        {/* Top Bar - Action Buttons */}
        {currentUser && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 z-40 flex items-center gap-1.5 sm:gap-2 md:gap-3"
          >
            {/* Waitlist Button - Blue */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/governor/waitlist')}
              className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
              title="Waitlist Dashboard"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </motion.button>

            {/* Notifications Button - Magenta */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/notifications')}
              className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </motion.button>

            {/* Social Profile Button - Green */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/social-profile/${currentUser?.uid}`)}
              className="p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
              title="Social Profile"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
            </motion.button>

            {/* Search Button for Mobile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileSearch(true)}
              className="lg:hidden p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
              title="Search"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
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
        )}

        {/* Banners */}
        <AnimatePresence>
          {banners.map((banner) => (
            <motion.div
              key={banner.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-full px-4"
            >
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{banner.title}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="pt-24 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Content Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 min-h-[calc(100vh-12rem)]"
            >
              {children}
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}
