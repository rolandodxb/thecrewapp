import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, Plane } from 'lucide-react';
import { presentationSlides } from '../../data/openDayData';

interface OpenDayPresentationProps {
  onComplete: () => void;
}

export default function OpenDayPresentation({ onComplete }: OpenDayPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = presentationSlides[currentSlide];
  const progress = ((currentSlide + 1) / presentationSlides.length) * 100;
  const isLastSlide = currentSlide === presentationSlides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900">Phase 1: Open Day Presentation</h2>
          <div className="text-sm text-gray-600">
            Slide {currentSlide + 1} of {presentationSlides.length}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#D71920] to-[#CBA135]"
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <motion.div
        key={currentSlide}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-6"
      >
        <div className="mb-6">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{slide.title}</h3>
          <p className="text-lg text-gray-700 leading-relaxed">{slide.content}</p>
        </div>

        {slide.bullets && slide.bullets.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gray-900 mb-3">Key Points:</h4>
            <ul className="space-y-3">
              {slide.bullets.map((bullet, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-[#D71920] flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{bullet}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {slide.tips && slide.tips.length > 0 && (
          <div className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Plane className="w-5 h-5 text-[#D71920]" />
              Pro Tips:
            </h4>
            <ul className="space-y-2">
              {slide.tips.map((tip, index) => (
                <li key={index} className="text-gray-800 pl-4">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      <div className="flex gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
        >
          {isLastSlide ? 'Start Assessment' : 'Next'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
