import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div
            className={`glass-card rounded-xl px-6 py-3 flex items-center gap-3 shadow-lg border-2 ${
              isOnline
                ? 'border-green-200 bg-green-50/80'
                : 'border-red-200 bg-red-50/80'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-900">Back Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-900">You're Offline</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
