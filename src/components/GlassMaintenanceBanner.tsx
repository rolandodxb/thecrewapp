import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import { FeatureShutdown, FEATURE_LABELS } from '../services/featureShutdownService';

interface GlassMaintenanceBannerProps {
  shutdown: FeatureShutdown;
  onRefresh?: () => void;
}

export default function GlassMaintenanceBanner({ shutdown, onRefresh }: GlassMaintenanceBannerProps) {
  const formatEndTime = (date: Date | null) => {
    if (!date) return 'To be determined';

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    };

    return date.toLocaleString(undefined, options);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(255, 248, 240, 0.4) 0%, rgba(255, 235, 220, 0.6) 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', damping: 20 }}
        className="w-full max-w-2xl"
      >
        <div
          className="relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.35)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            borderRadius: '28px',
            border: '1px solid rgba(255, 255, 255, 0.45)',
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.12),
              0 2px 8px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 0 rgba(255, 255, 255, 0.3)
            `
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(173, 216, 230, 0.15) 100%)',
              mixBlendMode: 'overlay'
            }}
          />

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          <div className="relative p-8 sm:p-10 lg:p-12">
            <div className="flex flex-col items-center text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 159, 64, 0.25), rgba(255, 99, 132, 0.25))',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 159, 64, 0.3)',
                  boxShadow: '0 8px 24px rgba(255, 159, 64, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
              >
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" strokeWidth={2.5} />
              </motion.div>

              <div className="space-y-3">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #1f1f1f 0%, #4a4a4a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {FEATURE_LABELS[shutdown.featureKey]} Is Under Maintenance
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 text-sm sm:text-base"
                >
                  This feature is temporarily unavailable while we perform updates
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full space-y-4 sm:space-y-5"
              >
                <div
                  className="p-5 sm:p-6 rounded-2xl text-left"
                  style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Reason
                  </h3>
                  <p className="text-gray-800 text-base sm:text-lg font-medium leading-relaxed">
                    {shutdown.shutdownReason}
                  </p>
                </div>

                <div
                  className="p-5 sm:p-6 rounded-2xl text-left"
                  style={{
                    background: 'rgba(173, 216, 230, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(173, 216, 230, 0.4)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                  }}
                >
                  <h3 className="text-sm font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                    Message from the Academy
                  </h3>
                  <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
                    {shutdown.maintenanceMessage}
                  </p>
                </div>

                {shutdown.maintenanceEndsAt && (
                  <div
                    className="p-5 sm:p-6 rounded-2xl"
                    style={{
                      background: 'rgba(144, 238, 144, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(144, 238, 144, 0.4)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                      <div className="text-left flex-1">
                        <h3 className="text-sm font-semibold text-green-700 mb-2 uppercase tracking-wide">
                          Expected Return
                        </h3>
                        <p className="text-gray-800 text-base sm:text-lg font-medium">
                          {formatEndTime(shutdown.maintenanceEndsAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={handleRefresh}
                className="group relative px-8 py-4 rounded-2xl font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #D71920 0%, #FF3366 50%, #FF6B9D 100%)',
                  boxShadow: '0 8px 24px rgba(215, 25, 32, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                <div className="relative flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  <span className="text-base sm:text-lg">Refresh Status</span>
                </div>
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-500 italic"
              >
                We apologize for any inconvenience. Thank you for your patience.
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
