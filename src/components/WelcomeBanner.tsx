import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface WelcomeBannerProps {
  userName: string;
  isFirstLogin: boolean;
  onDismiss: () => void;
}

export default function WelcomeBanner({ userName, isFirstLogin, onDismiss }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 5000);

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsVisible(false);
        onDismiss();
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-16 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none"
        >
          <div className="w-full max-w-4xl pointer-events-auto">
            <div className="bg-gradient-to-r from-[#D71920] via-[#D4AF37] to-[#D71920] text-white rounded-b-xl shadow-2xl overflow-hidden">
              <div className="relative p-4 md:p-6">
                <div className="absolute inset-0 bg-black/10" />

                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="relative flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 animate-pulse" />

                  <div className="text-center">
                    <h2 className="text-xl md:text-3xl font-bold">
                      {isFirstLogin ? (
                        <>Welcome aboard, {userName}!</>
                      ) : (
                        <>Welcome back, {userName}!</>
                      )}
                    </h2>
                    <p className="text-sm md:text-base text-white/90 mt-1">
                      {isFirstLogin ? (
                        'Your journey to becoming cabin crew starts now'
                      ) : (
                        'Ready to continue your training?'
                      )}
                    </p>
                  </div>

                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 animate-pulse" />
                </motion.div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    className="h-full bg-white/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
