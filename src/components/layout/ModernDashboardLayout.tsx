import { ReactNode } from 'react';
import { Search, Mic, Bell, Settings, User, LogOut } from 'lucide-react';
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

        {/* Top Bar */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-4 right-4 z-40 flex items-center gap-3"
        >
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-64 pl-11 pr-11 py-2.5 bg-white/90 backdrop-blur-xl rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg transition"
            />
            <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Action Buttons */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/notifications')}
            className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Bell className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Settings className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <User className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-3 bg-white/90 backdrop-blur-xl text-gray-700 rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Main Content Area */}
        <div className="pt-24 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            {title && (
              <motion.h1
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-gray-900 mb-6"
              >
                {title}
              </motion.h1>
            )}

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

        {/* Page Indicator Dots */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
