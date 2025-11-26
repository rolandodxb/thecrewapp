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
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col">
      {/* Title Bar */}
      <div className="flex-shrink-0 flex items-center justify-center py-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-xl px-8 py-3 rounded-full shadow-lg"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {dashboards[currentIndex]?.title}
          </h2>
        </motion.div>
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 relative overflow-hidden px-4 pb-24">
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
            {dashboards[currentIndex]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
        {/* Previous Arrow */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`p-4 rounded-full shadow-2xl transition-all ${
            currentIndex === 0
              ? 'bg-gray-300 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        {/* Page Indicators */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg">
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
                  ? 'w-8 h-2 bg-gray-900'
                  : 'w-2 h-2 bg-gray-400 hover:bg-gray-600'
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
          className={`p-4 rounded-full shadow-2xl transition-all ${
            currentIndex === dashboards.length - 1
              ? 'bg-gray-300 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}
