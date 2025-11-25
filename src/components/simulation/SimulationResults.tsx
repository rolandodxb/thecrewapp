import { motion } from 'framer-motion';
import { Award, RotateCcw, Home, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SimulationResultsProps {
  quizScore: number;
  englishScore: number;
  onRetake: () => void;
}

export default function SimulationResults({ quizScore, englishScore, onRetake }: SimulationResultsProps) {
  const navigate = useNavigate();
  const totalScore = Math.round((quizScore + englishScore) / 2);
  const passed = totalScore >= 60;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = () => {
    if (totalScore >= 80) {
      return {
        text: 'EXCELLENT',
        color: 'bg-green-500',
        message: "You're well-prepared for the Emirates Open Day!"
      };
    } else if (totalScore >= 60) {
      return {
        text: 'PASSED',
        color: 'bg-yellow-500',
        message: "Good job! With some practice, you'll be even better prepared."
      };
    } else {
      return {
        text: 'NEEDS IMPROVEMENT',
        color: 'bg-red-500',
        message: "Don't worry - review the materials and try again!"
      };
    }
  };

  const status = getStatusBadge();

  const getFeedback = () => {
    if (totalScore >= 90) {
      return {
        title: 'Outstanding Performance!',
        recommendations: [
          'Practice your personal introduction and motivations',
          'Research Emirates latest routes and services',
          'Prepare thoughtful questions for recruiters',
          'Continue maintaining your professional grooming standards'
        ]
      };
    } else if (totalScore >= 75) {
      return {
        title: 'Strong Performance',
        recommendations: [
          'Review Emirates grooming standards in detail',
          'Practice English communication daily',
          'Study customer service scenarios',
          'Work on teamwork and conflict resolution'
        ]
      };
    } else if (totalScore >= 60) {
      return {
        title: 'Fair Performance',
        recommendations: [
          'Study Emirates brand values and expectations thoroughly',
          'Improve English proficiency to B2 level',
          'Practice group activity scenarios',
          'Review presentation materials carefully'
        ]
      };
    } else {
      return {
        title: 'Needs Improvement',
        recommendations: [
          'Take an English course to reach B2 level',
          'Research Emirates thoroughly (website, videos, forums)',
          'Practice with mock interviews and group exercises',
          'Review all presentation slides carefully',
          'Consider booking a session with the AI Trainer for guidance'
        ]
      };
    }
  };

  const feedback = getFeedback();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <div
            className={`w-24 h-24 ${status.color} rounded-full flex items-center justify-center mx-auto mb-6`}
          >
            {passed ? (
              <Award className="w-12 h-12 text-white" />
            ) : (
              <Sparkles className="w-12 h-12 text-white" />
            )}
          </div>
          <div className={`inline-block px-6 py-2 ${status.color} text-white rounded-full font-bold text-lg mb-4`}>
            {status.text}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{feedback.title}</h1>
          <p className="text-lg text-gray-600">{status.message}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 text-center">
            <div className="text-sm font-semibold text-red-700 mb-2">Open Day Quiz</div>
            <div className={`text-4xl font-bold ${getScoreColor(quizScore)}`}>{quizScore}%</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6 text-center">
            <div className="text-sm font-semibold text-amber-700 mb-2">English Test</div>
            <div className={`text-4xl font-bold ${getScoreColor(englishScore)}`}>{englishScore}%</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 text-center">
            <div className="text-sm font-semibold text-blue-700 mb-2">Total Score</div>
            <div className={`text-4xl font-bold ${getScoreColor(totalScore)}`}>{totalScore}%</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#EADBC8] to-[#F5E6D3] rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-[#D71920]" />
            Recommendations for Success:
          </h3>
          <ul className="space-y-3">
            {feedback.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#D71920] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-gray-800 pt-0.5">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {!passed && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-900 mb-2">Not Quite Ready</h4>
                <p className="text-blue-800 text-sm">
                  A score of 60% or higher is recommended before attending the real Open Day.
                  Take time to review the materials and retake the simulation.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onRetake}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Simulation
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            <Home className="w-5 h-5" />
            Return to Dashboard
          </button>
        </div>
      </div>
    </motion.div>
  );
}
