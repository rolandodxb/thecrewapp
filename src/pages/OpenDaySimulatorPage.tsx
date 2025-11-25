import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import OpenDayPresentation from '../components/simulation/OpenDayPresentation';
import OpenDayQuiz from '../components/simulation/OpenDayQuiz';
import EnglishTest from '../components/simulation/EnglishTest';
import SimulationResults from '../components/simulation/SimulationResults';
import {
  getOrCreateSimulation,
  updateSimulation,
  saveAnswers,
  deleteSimulation,
  SimulationData,
} from '../services/simulationService';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';

type Phase = 'welcome' | 'presentation' | 'quiz' | 'english' | 'results';

export default function OpenDaySimulatorPage() {
  const { currentUser } = useApp();

  // Check feature access
  if (!currentUser) return null;

  const simulatorAccess = checkFeatureAccess(currentUser, 'simulator');
  if (!simulatorAccess.allowed) {
    return (
      <FeatureLock
        requiredPlan={simulatorAccess.requiresPlan || 'vip'}
        featureName="Open Day Simulator"
        description={simulatorAccess.message}
      />
    );
  }

  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('welcome');
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [englishScore, setEnglishScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadSimulation();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadSimulation = async () => {
    if (!currentUser) return;

    console.log('Loading simulation for user:', currentUser.uid);
    const sim = await getOrCreateSimulation(currentUser.uid);
    console.log('Simulation loaded:', sim);
    if (sim) {
      setSimulation(sim);
      if (sim.completed) {
        setQuizScore(sim.quiz_score);
        setEnglishScore(sim.english_score);
        setPhase('results');
      }
    }
    setLoading(false);
  };

  const startSimulation = async () => {
    if (!currentUser || isStarting) return;

    setIsStarting(true);
    try {
      console.log('Starting simulation for user:', currentUser.uid);
      let sim = simulation;
      if (!sim) {
        console.log('Creating new simulation...');
        sim = await getOrCreateSimulation(currentUser.uid);
        console.log('Simulation created:', sim);
        setSimulation(sim);
      }

      if (sim && sim.id) {
        console.log('Updating simulation phase...');
        const updated = await updateSimulation(sim.id, { current_phase: 1 });
        console.log('Simulation updated:', updated);
        if (updated) {
          setPhase('presentation');
        } else {
          alert('Failed to start simulation. Please try again.');
        }
      } else {
        console.error('No simulation available');
        alert('Failed to create simulation. Please try again.');
      }
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('An error occurred while starting the simulation. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handlePresentationComplete = async () => {
    if (!simulation || !simulation.id) {
      console.error('No simulation available');
      return;
    }

    console.log('Completing presentation, updating to phase 2');
    const updated = await updateSimulation(simulation.id, { current_phase: 2 });
    if (updated) {
      setPhase('quiz');
    } else {
      console.error('Failed to update simulation phase');
      alert('Failed to proceed. Please try again.');
    }
  };

  const handleQuizComplete = async (
    score: number,
    answers: Record<string, { selected: string; correct: boolean }>
  ) => {
    if (!simulation || !currentUser) return;

    setQuizScore(score);

    const answerData = Object.entries(answers).map(([questionId, answer]) => ({
      simulation_id: simulation.id!,
      user_id: currentUser.uid,
      phase: 2,
      question_id: questionId,
      selected_answer: answer.selected,
      correct: answer.correct,
    }));

    await saveAnswers(answerData);
    await updateSimulation(simulation.id!, {
      current_phase: 3,
      quiz_score: score,
    });

    setPhase('english');
  };

  const handleEnglishComplete = async (
    score: number,
    answers: Record<string, { selected: string; correct: boolean }>
  ) => {
    if (!simulation || !currentUser) return;

    setEnglishScore(score);

    const answerData = Object.entries(answers).map(([questionId, answer]) => ({
      simulation_id: simulation.id!,
      user_id: currentUser.uid,
      phase: 3,
      question_id: questionId,
      selected_answer: answer.selected,
      correct: answer.correct,
    }));

    await saveAnswers(answerData);
    await updateSimulation(simulation.id!, {
      english_score: score,
      completed: true,
    });

    setPhase('results');
  };

  const handleRetake = async () => {
    if (!currentUser) return;

    await deleteSimulation(currentUser.uid);
    setQuizScore(0);
    setEnglishScore(0);

    const newSim = await getOrCreateSimulation(currentUser.uid);
    setSimulation(newSim);
    setPhase('welcome');
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading simulation...</p>
        </div>
      </div>
    );
  }

  const getBackgroundClass = () => {
    switch (phase) {
      case 'quiz':
        return 'bg-gradient-to-br from-[#D71920] to-[#B91518]';
      case 'english':
        return 'bg-gradient-to-br from-[#CBA135] to-[#B8941E]';
      default:
        return '';
    }
  };

  return (
    <div className={`p-4 md:p-8 min-h-screen transition-colors duration-500 ${getBackgroundClass()}`}>
      {phase === 'welcome' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-openday p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Emirates Open Day Simulation
              </h1>
              <p className="text-lg text-gray-600">
                Complete 3-phase training to prepare for your Emirates cabin crew recruitment
              </p>
            </div>

            <div className="glass-frosted p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What to Expect:</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 glass-card rounded-full flex items-center justify-center font-bold text-[#D71920]">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Presentation Module</h3>
                    <p className="text-sm text-gray-700">
                      Learn about dress code, conduct, and Open Day expectations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center font-bold text-white">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Assessment Quiz</h3>
                    <p className="text-sm text-gray-700">
                      Test your knowledge with scenario-based questions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#CBA135] to-[#B8941E] rounded-full flex items-center justify-center font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">English B2 Test</h3>
                    <p className="text-sm text-gray-700">
                      Demonstrate your English proficiency across grammar, vocabulary, and reading
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This simulation takes approximately 15-20 minutes. You'll
                receive instant feedback and a detailed performance report at the end.
              </p>
            </div>

            <button
              onClick={startSimulation}
              disabled={isStarting}
              className="w-full px-8 py-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  {simulation?.completed ? 'Start New Simulation' : 'Begin Simulation'}
                  <Sparkles className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'presentation' && <OpenDayPresentation onComplete={handlePresentationComplete} />}

      {phase === 'quiz' && <OpenDayQuiz onComplete={handleQuizComplete} />}

      {phase === 'english' && <EnglishTest onComplete={handleEnglishComplete} />}

      {phase === 'results' && (
        <SimulationResults
          quizScore={quizScore}
          englishScore={englishScore}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
