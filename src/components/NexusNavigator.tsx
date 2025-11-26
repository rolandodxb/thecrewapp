import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NexusDashboard {
  id: string;
  title: string;
  content: ReactNode;
}

interface NexusNavigatorProps {
  dashboards: NexusDashboard[];
  initialIndex?: number;
}

export default function NexusNavigator({ dashboards, initialIndex = 0 }: NexusNavigatorProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentIndex < dashboards.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Title Bar */}
      <div className="flex-shrink-0 flex items-center justify-center py-3 sm:py-4 md:py-6 px-2">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-xl px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 md:py-3 rounded-full shadow-lg max-w-full"
        >
          <h2 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 text-center truncate">
            {dashboards[currentIndex]?.title}
          </h2>
        </motion.div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 relative overflow-hidden px-2 sm:px-3 md:px-4 lg:px-6 pb-16 sm:pb-20 md:pb-24">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            className="absolute inset-0 w-full h-full overflow-y-auto"
          >
            <div className="max-w-[1920px] mx-auto">
              {dashboards[currentIndex]?.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows - Smaller */}
      <div className="fixed bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Previous Arrow */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`p-1.5 sm:p-2 md:p-2.5 rounded-full shadow-lg transition-all ${
            currentIndex === 0
              ? 'bg-gray-300 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          }`}
        >
          <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
        </motion.button>

        {/* Page Indicators */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-white/90 backdrop-blur-xl px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-full shadow-lg">
          {dashboards.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={`transition-all rounded-full ${
                index === currentIndex
                  ? 'w-3 sm:w-4 md:w-5 h-1 sm:h-1.5 bg-gray-900'
                  : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-gray-400 hover:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Next Arrow */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNext}
          disabled={currentIndex === dashboards.length - 1}
          className={`p-1.5 sm:p-2 md:p-2.5 rounded-full shadow-lg transition-all ${
            currentIndex === dashboards.length - 1
              ? 'bg-gray-300 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          }`}
        >
          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
        </motion.button>
      </div>
    </div>
  );
}
