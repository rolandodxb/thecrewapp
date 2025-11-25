import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SystemAnnouncementBanner() {
  const { systemAnnouncement } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  console.log('SystemAnnouncementBanner - systemAnnouncement:', systemAnnouncement);

  if (!systemAnnouncement.active || isDismissed) return null;

  const getAnnouncementConfig = () => {
    switch (systemAnnouncement.type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgGradient: 'from-green-500/90 to-emerald-600/90',
          iconColor: 'text-white',
          borderColor: 'border-green-400/50',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgGradient: 'from-yellow-500/90 to-orange-600/90',
          iconColor: 'text-white',
          borderColor: 'border-yellow-400/50',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgGradient: 'from-red-500/90 to-rose-600/90',
          iconColor: 'text-white',
          borderColor: 'border-red-400/50',
        };
      default:
        return {
          icon: Info,
          bgGradient: 'from-blue-500/90 to-indigo-600/90',
          iconColor: 'text-white',
          borderColor: 'border-blue-400/50',
        };
    }
  };

  const config = getAnnouncementConfig();
  const Icon = config.icon;

  return (
    <>
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`bg-gradient-to-r ${config.bgGradient} rounded-full px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 flex items-center gap-1 sm:gap-1.5 md:gap-2 w-full cursor-pointer hover:opacity-90 transition-opacity`}
            style={{ originX: 0 }}
            onClick={() => setIsExpanded(true)}
          >
            <div className={`${config.iconColor} flex-shrink-0`}>
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-white font-medium text-[10px] sm:text-xs md:text-sm truncate">
                {systemAnnouncement.message}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-0.5 sm:p-1 transition flex-shrink-0"
              aria-label="Dismiss announcement"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsExpanded(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 right-0 z-[100] flex justify-center"
              style={{
                top: 'max(env(safe-area-inset-top, 4rem), 4rem)',
                padding: '0 max(env(safe-area-inset-right), 1rem) 0 max(env(safe-area-inset-left), 1rem)'
              }}
            >
              <div className={`bg-gradient-to-br ${config.bgGradient} rounded-xl shadow-2xl p-4 w-full max-w-sm mx-auto`}>
                <div className="flex items-start gap-2 mb-2">
                  <div className={`${config.iconColor} flex-shrink-0`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm sm:text-base mb-1">System Announcement</h3>
                    <p className="text-white/90 text-xs sm:text-sm leading-snug break-words">
                      {systemAnnouncement.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-0.5 transition flex-shrink-0"
                    aria-label="Close announcement"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setIsExpanded(false);
                      setIsDismissed(true);
                    }}
                    className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
