import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { quizQuestions } from '../../data/openDayData';

interface OpenDayQuizProps {
  onComplete: (score: number, answers: Record<string, { selected: string; correct: boolean }>) => void;
}

export default function OpenDayQuiz({ onComplete }: OpenDayQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { selected: string; correct: boolean }>>({});

  const question = quizQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const isLastQuestion = currentQuestion === quizQuestions.length - 1;

  const handleSubmit = () => {
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);

    setAnswers({
      ...answers,
      [question.id]: {
        selected: selectedAnswer,
        correct
      }
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const finalAnswers = {
        ...answers,
        [question.id]: {
          selected: selectedAnswer,
          correct: isCorrect
        }
      };
      const correctCount = Object.values(finalAnswers).filter(a => a.correct).length;
      const score = Math.round((correctCount / quizQuestions.length) * 100);
      onComplete(score, finalAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer('');
      setShowFeedback(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-white">Phase 2: Assessment Quiz</h2>
          <div className="text-sm text-white/90">
            Question {currentQuestion + 1} of {quizQuestions.length}
          </div>
        </div>
        <div className="w-full bg-white/30 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-white to-[#CBA135]"
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showFeedback ? (
          <motion.div
            key="question"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h3>

            <div className="space-y-3 mb-6">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    selectedAnswer === option
                      ? 'border-[#D71920] bg-red-50'
                      : 'border-gray-200 hover:border-[#D71920] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedAnswer === option
                          ? 'border-[#D71920] bg-[#D71920]'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedAnswer === option && (
                        <div className="w-3 h-3 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-gray-700">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Submit Answer
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`rounded-2xl shadow-lg p-8 ${
              isCorrect
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300'
                : 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300'
            }`}
          >
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <XCircle className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    isCorrect ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                <p className={isCorrect ? 'text-green-800' : 'text-red-800'}>
                  {question.explanation}
                </p>
                {!isCorrect && (
                  <p className="mt-3 text-red-900 font-semibold">
                    Correct answer: {question.correctAnswer}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {isLastQuestion ? 'Continue to English Test' : 'Next Question'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
