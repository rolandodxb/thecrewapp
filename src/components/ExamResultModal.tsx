import { motion } from 'framer-motion';
import { Trophy, XCircle, Star, TrendingUp, Award, Clock } from 'lucide-react';
import { ExamResult } from '../services/examService';

interface ExamResultModalProps {
  result: ExamResult;
  examTitle: string;
  onClose: () => void;
  onRetry?: () => void;
  cooldownMinutes?: number;
}

export default function ExamResultModal({
  result,
  examTitle,
  onClose,
  onRetry,
  cooldownMinutes = 5
}: ExamResultModalProps) {
  const percentage = result.score;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div
          className={`backdrop-blur-2xl rounded-3xl border-2 shadow-2xl overflow-hidden ${
            result.passed
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-400/50'
              : 'bg-gradient-to-br from-red-500/20 to-rose-600/20 border-red-400/50'
          }`}
          style={{
            boxShadow: result.passed
              ? '0 20px 60px 0 rgba(34, 197, 94, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)'
              : '0 20px 60px 0 rgba(239, 68, 68, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              {result.passed ? (
                <div className="relative inline-block">
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto drop-shadow-2xl" />
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute -top-2 -right-2"
                  >
                    <Star className="w-8 h-8 text-yellow-300 fill-yellow-300" />
                  </motion.div>
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -10, 10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: 0.5
                    }}
                    className="absolute -bottom-2 -left-2"
                  >
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                  </motion.div>
                </div>
              ) : (
                <XCircle className="w-24 h-24 text-red-400 mx-auto drop-shadow-2xl" />
              )}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-3"
            >
              {result.passed ? 'Congratulations!' : 'Keep Trying!'}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 text-lg mb-6"
            >
              {examTitle}
            </motion.p>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="relative inline-block mb-8"
            >
              <svg className="w-48 h-48 mx-auto" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke={result.passed ? '#4ade80' : '#f87171'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 85}`}
                  strokeDashoffset={`${2 * Math.PI * 85 * (1 - percentage / 100)}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - percentage / 100) }}
                  transition={{ duration: 1.5, delay: 0.6 }}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-6xl font-bold text-white"
                  >
                    {percentage}%
                  </motion.div>
                  <div className="text-white/70 text-sm mt-1">Your Score</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{result.correctAnswers}</div>
                <div className="text-white/70 text-xs">Correct</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <XCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{result.incorrectQuestions.length}</div>
                <div className="text-white/70 text-xs">Incorrect</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{result.pointsAwarded}</div>
                <div className="text-white/70 text-xs">Points</div>
              </div>
            </motion.div>

            {result.passed ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl p-6 mb-6"
              >
                <h3 className="text-xl font-bold text-white mb-2">Exam Passed!</h3>
                <p className="text-white/80 text-sm">
                  You've successfully validated this lesson. Keep up the great work!
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl p-6 mb-6"
              >
                <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  Retry in {cooldownMinutes} minutes
                </h3>
                <p className="text-white/80 text-sm">
                  You need {80}% to pass. Review the material and try again after the cooldown period.
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="flex gap-3"
            >
              {!result.passed && onRetry && (
                <button
                  onClick={onRetry}
                  className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-2xl font-bold transition text-lg"
                >
                  Review Material
                </button>
              )}
              <button
                onClick={onClose}
                className={`${
                  result.passed ? 'w-full' : 'flex-1'
                } px-8 py-4 bg-gradient-to-r ${
                  result.passed
                    ? 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : 'from-[#D71920] to-[#B91518] hover:from-[#B91518] hover:to-[#A01316]'
                } text-white rounded-2xl font-bold transition shadow-lg text-lg`}
              >
                {result.passed ? 'Continue Learning' : 'Close'}
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
