import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Trophy, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exam, submitExam, ExamResult, canTakeExam } from '../services/examService';

interface ExamInterfaceProps {
  exam: Exam;
  userId: string;
  onClose: () => void;
  onComplete: (result: ExamResult) => void;
}

export default function ExamInterface({ exam, userId, onClose, onComplete }: ExamInterfaceProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(exam.questions.length).fill(-1));
  const [selectedAnswer, setSelectedAnswer] = useState<number>(-1);
  const [startTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [canTake, setCanTake] = useState(true);
  const [retryTime, setRetryTime] = useState<string>('');

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    const eligibility = await canTakeExam(userId, exam.moduleId, exam.lessonId);
    setCanTake(eligibility.canTake);
    if (eligibility.retryAt) {
      setRetryTime(eligibility.retryAt);
    }
  };

  useEffect(() => {
    if (answers[currentQuestion] !== undefined && answers[currentQuestion] !== -1) {
      setSelectedAnswer(answers[currentQuestion]);
    } else {
      setSelectedAnswer(-1);
    }
  }, [currentQuestion, answers]);

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === -1) {
      alert('Please select an answer before continuing');
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < exam.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.includes(-1)) {
      alert('Please answer all questions before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const result = await submitExam(userId, exam.moduleId, exam.lessonId, exam.courseId, {
        answers,
        timeSpent
      });

      onComplete(result);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    setShowConfirmExit(true);
  };

  const confirmExit = () => {
    onClose();
  };

  if (!canTake) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-md text-center"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.18)'
          }}
        >
          <Clock className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Cooldown Period</h2>
          <p className="text-white/80 mb-6">
            You need to wait before retrying this exam. Please try again after the cooldown period.
          </p>
          {retryTime && (
            <p className="text-orange-400 font-semibold mb-6">
              Available at: {new Date(retryTime).toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition backdrop-blur-sm"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / exam.questions.length) * 100;
  const question = exam.questions[currentQuestion];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div
          className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 1px 0 rgba(255, 255, 255, 0.18)'
          }}
        >
          <div className="bg-gradient-to-r from-[#D71920]/90 to-[#B91518]/90 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{exam.examTitle}</h2>
              <button
                onClick={handleExit}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center justify-between text-white/90 text-sm">
              <span>Question {currentQuestion + 1} of {exam.questions.length}</span>
              <span>Passing Score: {exam.passingScore}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="bg-white h-full rounded-full"
              />
            </div>
          </div>

          <div className="p-8">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                {question.questionText}
              </h3>

              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectAnswer(index)}
                    className={`w-full p-5 rounded-2xl text-left transition-all duration-300 border-2 ${
                      selectedAnswer === index
                        ? 'bg-white/25 border-white/50 shadow-lg backdrop-blur-xl'
                        : 'bg-white/10 border-white/20 hover:bg-white/15 backdrop-blur-xl'
                    }`}
                    style={{
                      boxShadow:
                        selectedAnswer === index
                          ? '0 8px 32px 0 rgba(255, 255, 255, 0.2), inset 0 1px 1px 0 rgba(255, 255, 255, 0.3)'
                          : 'none'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedAnswer === index
                            ? 'bg-white border-white'
                            : 'border-white/50'
                        }`}
                      >
                        {selectedAnswer === index && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 rounded-full bg-[#D71920]"
                          />
                        )}
                      </div>
                      <span className="text-white text-lg flex-1">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm p-6 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {exam.questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    answers[index] !== -1
                      ? 'bg-green-400'
                      : index === currentQuestion
                      ? 'bg-white'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {currentQuestion === exam.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || selectedAnswer === -1}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={selectedAnswer === -1}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showConfirmExit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowConfirmExit(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl p-8 max-w-md"
            >
              <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3 text-center">
                Exit Exam?
              </h3>
              <p className="text-white/80 text-center mb-6">
                Your progress will be lost. Are you sure you want to exit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmExit(false)}
                  className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition backdrop-blur-sm"
                >
                  Continue Exam
                </button>
                <button
                  onClick={confirmExit}
                  className="flex-1 px-6 py-3 bg-red-500/80 hover:bg-red-600/80 text-white rounded-xl font-semibold transition backdrop-blur-sm"
                >
                  Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
