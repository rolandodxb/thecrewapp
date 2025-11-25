import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, RefreshCw, Award, AlertCircle } from 'lucide-react';
import { Quiz, QuizQuestion, shuffleOptions } from '../data/quizData';
import { saveQuizResult } from '../services/quizService';
import { useApp } from '../context/AppContext';

interface CourseQuizProps {
  quiz?: Quiz;
  moduleId?: string;
  onComplete: (score: number, passed: boolean) => void;
  onBack?: () => void;
}

interface QuizResult {
  quizStatus: 'PASS' | 'FAIL';
  score: number;
}

export default function CourseQuiz({ quiz, moduleId, onComplete, onBack }: CourseQuizProps) {
  const { currentUser } = useApp();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);

  const defaultQuiz: Quiz = {
    courseId: moduleId || 'default',
    title: 'Module Quiz',
    passingScore: 70,
    questions: [
      {
        questionText: 'What is the minimum watch time required to complete a video?',
        options: ['50%', '60%', '70%', '80%'],
        correctAnswer: '80%'
      },
      {
        questionText: 'How many videos must you complete before taking the quiz?',
        options: ['1 video', '2 videos', '3 videos', 'No videos required'],
        correctAnswer: '2 videos'
      },
      {
        questionText: 'What score do you need to unlock submodules?',
        options: ['50%', '60%', '70%', '80%'],
        correctAnswer: '70%'
      }
    ]
  };

  const activeQuiz = quiz || defaultQuiz;

  useEffect(() => {
    const shuffled = activeQuiz.questions.map(q => shuffleOptions(q));
    setShuffledQuestions(shuffled);
  }, [activeQuiz]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const totalQuestions = activeQuiz.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...userAnswers, selectedAnswer];
    setUserAnswers(newAnswers);

    if (isLastQuestion) {
      evaluateQuiz(newAnswers);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    }
  };

  const evaluateQuiz = async (answers: number[]) => {
    let correctCount = 0;

    shuffledQuestions.forEach((question, index) => {
      if (answers[index] === question.correctAnswerIndex) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= activeQuiz.passingScore;

    const result: QuizResult = {
      quizStatus: passed ? 'PASS' : 'FAIL',
      score: scorePercentage
    };

    setQuizResult(result);
    setShowResult(true);
    onComplete(scorePercentage, passed);

    if (currentUser) {
      await saveQuizResult({
        user_id: currentUser.uid,
        course_id: activeQuiz.courseId,
        score: scorePercentage,
        passed: passed,
        answers: answers,
        completed_at: new Date().toISOString()
      });
    }
  };

  const handleRetry = () => {
    const shuffled = activeQuiz.questions.map(q => shuffleOptions(q));
    setShuffledQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizResult(null);
  };

  if (shuffledQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D71921]"></div>
      </div>
    );
  }

  if (showResult && quizResult) {
    const correctAnswers = userAnswers.filter((answer, index) => answer === shuffledQuestions[index].correctAnswerIndex).length;
    const incorrectAnswers = totalQuestions - correctAnswers;

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getStatusBadge = () => {
      if (quizResult.score >= 80) {
        return {
          text: 'EXCELLENT',
          color: 'bg-green-500',
          message: 'Outstanding performance!'
        };
      } else if (quizResult.score >= activeQuiz.passingScore) {
        return {
          text: 'PASSED',
          color: 'bg-yellow-500',
          message: 'You passed the quiz!'
        };
      } else {
        return {
          text: 'NEEDS IMPROVEMENT',
          color: 'bg-red-500',
          message: `You need ${activeQuiz.passingScore}% or higher to pass.`
        };
      }
    };

    const status = getStatusBadge();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <div className={`w-24 h-24 ${status.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {quizResult.quizStatus === 'PASS' ? (
                <Award className="w-12 h-12 text-white" />
              ) : (
                <AlertCircle className="w-12 h-12 text-white" />
              )}
            </div>
            <div className={`inline-block px-6 py-2 ${status.color} text-white rounded-full font-bold text-lg mb-4`}>
              {status.text}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {quizResult.quizStatus === 'PASS' ? 'Congratulations!' : 'Not Quite There'}
            </h1>
            <p className="text-lg text-gray-600">{status.message}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 text-center">
              <div className="text-sm font-semibold text-blue-700 mb-2">Your Score</div>
              <div className={`text-4xl font-bold ${getScoreColor(quizResult.score)}`}>{quizResult.score}%</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 text-center">
              <div className="text-sm font-semibold text-green-700 mb-2">Correct Answers</div>
              <div className="text-4xl font-bold text-green-600">{correctAnswers}</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 text-center">
              <div className="text-sm font-semibold text-red-700 mb-2">Incorrect Answers</div>
              <div className="text-4xl font-bold text-red-600">{incorrectAnswers}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-[#D71920]" />
              Review Your Answers:
            </h3>
            <div className="space-y-3">
              {shuffledQuestions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === question.correctAnswerIndex;

                return (
                  <div key={question.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex items-start gap-3 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">Q{index + 1}: {question.question}</p>
                        <p className="text-sm text-gray-700 mb-1">
                          Your answer: <span className={`font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {question.options[userAnswer]}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-green-700">
                            Correct answer: <span className="font-semibold">{question.options[question.correctAnswerIndex]}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            {quizResult.quizStatus === 'FAIL' && (
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Quiz
              </button>
            )}
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
              >
                {quizResult.quizStatus === 'PASS' ? 'Continue Learning' : 'Back to Course'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[#000000]">{quiz.courseName} Quiz</h2>
            <span className="text-sm font-semibold text-gray-600">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#D71921] to-[#B91518] h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {currentQuestion.question}
              </h3>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition ${
                      selectedAnswer === index
                        ? 'border-[#D71921] bg-[#EADBC8] shadow-md'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedAnswer === index
                          ? 'border-[#D71921] bg-[#D71921]'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
                          <div className="w-3 h-3 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-gray-800">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="w-full px-6 py-3 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastQuestion ? 'Submit Quiz' : 'Next Question'}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        You need {quiz.passingScore}% or higher to pass this quiz
      </div>
    </div>
  );
}
