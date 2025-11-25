import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Plane, BookOpen, Brain, MessageCircle, Sparkles, Award, Trophy, Users } from 'lucide-react';

interface OnboardingCardProps {
  userName: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface Slide {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

export default function OnboardingCard({ userName, onComplete, onSkip }: OnboardingCardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const slides: Slide[] = [
    {
      id: 1,
      icon: <Plane className="w-16 h-16" />,
      title: `Welcome to Crews Academy, ${userName}! ✈️`,
      description: "Your cabin crew journey starts here. We're here to help you achieve your dream of joining top airlines with our comprehensive training platform.",
      gradient: 'from-[#D71920] to-[#B91518]'
    },
    {
      id: 2,
      icon: <BookOpen className="w-16 h-16" />,
      title: 'Structured Learning Modules 📚',
      description: 'Access organized training modules covering everything from grooming standards to safety procedures. Our new module system makes learning easy and trackable.',
      gradient: 'from-[#D4AF37] to-[#B8941F]'
    },
    {
      id: 3,
      icon: <Brain className="w-16 h-16" />,
      title: 'AI-Powered Training 🧠',
      description: 'Get personalized feedback with our AI Trainer for mock interviews, CV optimization, and English proficiency tests. Practice the Open Day Simulator for real assessment preparation.',
      gradient: 'from-[#D71920] via-[#D4AF37] to-[#D71920]'
    },
    {
      id: 4,
      icon: <Trophy className="w-16 h-16" />,
      title: 'Gamified Progress System 🏆',
      description: 'Earn points, unlock badges, and climb the leaderboard as you complete courses and quizzes. Track your progress and compete with peers worldwide!',
      gradient: 'from-[#B8941F] to-[#D4AF37]'
    },
    {
      id: 5,
      icon: <Users className="w-16 h-16" />,
      title: 'Connect & Network 💬',
      description: 'Chat with experienced mentors, recruiters, and connect with aspiring cabin crew members globally. Join our supportive community and get real-time help.',
      gradient: 'from-[#D4AF37] to-[#D71920]'
    },
    {
      id: 6,
      icon: <Award className="w-16 h-16" />,
      title: 'Graduate as Verified Crew ✨',
      description: 'Complete your training and declare yourself as a graduated cabin crew member. Earn your Verified Cabin Crew badge and showcase your achievement!',
      gradient: 'from-[#D71920] to-[#B91518]'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
      onClick={onSkip} // clicking outside skips
    >
      {/* FIX: wrapper div preventing propagation before Motion */}
      <div onClick={(e) => e.stopPropagation()} className="relative">
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          style={{ boxShadow: '0 0 40px rgba(215, 25, 32, 0.3), 0 0 80px rgba(212, 175, 55, 0.2)' }}
        >
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.gradient} opacity-20`} />

          <div className="relative p-8 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-flex items-center justify-center mb-6 p-4 rounded-full bg-white/20 text-white"
                >
                  {currentSlideData.icon}
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {currentSlideData.title}
                </h2>

                <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8 max-w-xl mx-auto">
                  {currentSlideData.description}
                </p>

                <div className="flex items-center justify-center gap-2 mb-8">
                  {slides.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={onSkip}
                    className="px-6 py-3 rounded-xl font-bold text-white border-2 border-white/30 hover:bg-white/10 transition-all"
                  >
                    Skip Tour
                  </button>

                  <button
                    onClick={handleNext}
                    className="group px-8 py-3 rounded-xl font-bold text-[#000000] bg-gradient-to-r from-white to-gray-100 hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                    style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)' }}
                  >
                    {currentSlide === slides.length - 1 ? (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Start My Journey
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-[#D71920] to-[#D4AF37]"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
