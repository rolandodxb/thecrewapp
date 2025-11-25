import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ChevronRight, BookOpen } from 'lucide-react';
import { englishQuestions } from '../../data/openDayData';

interface EnglishTestProps {
  onComplete: (score: number, answers: Record<string, { selected: string; correct: boolean }>) => void;
}

export default function EnglishTest({ onComplete }: EnglishTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [answers, setAnswers] = useState<Record<string, { selected: string; correct: boolean }>>({});

  const question = englishQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / englishQuestions.length) * 100;
  const isLastQuestion = currentQuestion === englishQuestions.length - 1;

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'grammar':
        return 'Grammar';
      case 'vocabulary':
        return 'Vocabulary';
      case 'reading':
        return 'Reading Comprehension';
      default:
        return section;
    }
  };

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
      const score = Math.round((correctCount / englishQuestions.length) * 100);
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
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Phase 3: English B2 Test</h2>
            <p className="text-sm text-[#CBA135] font-semibold mt-1">
              {getSectionLabel(question.section)}
            </p>
          </div>
          <div className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {englishQuestions.length}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#CBA135] to-[#D71920]"
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
            className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-[#CBA135]"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[#CBA135]" />
              <span className="text-sm font-semibold text-gray-600">
                {getSectionLabel(question.section)}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-6">{question.question}</h3>

            <div className="space-y-3 mb-6">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${
                    selectedAnswer === option
                      ? 'border-[#CBA135] bg-amber-50'
                      : 'border-gray-200 hover:border-[#CBA135] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedAnswer === option
                          ? 'border-[#CBA135] bg-[#CBA135]'
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
              className="w-full px-6 py-3 bg-gradient-to-r from-[#CBA135] to-[#B8941E] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="w-full px-6 py-3 bg-gradient-to-r from-[#CBA135] to-[#B8941E] text-white rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              {isLastQuestion ? 'See Results' : 'Next Question'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
