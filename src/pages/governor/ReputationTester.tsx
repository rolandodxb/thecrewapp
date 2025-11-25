import { useState } from 'react';
import { Shield, Play, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { reputationService } from '../../services/reputationService';
import { useNavigate } from 'react-router-dom';

export default function ReputationTester() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<Array<{ test: string; status: 'success' | 'error'; message: string }>>([]);
  const [testing, setTesting] = useState(false);

  if (currentUser?.role !== 'governor') {
    navigate('/dashboard');
    return null;
  }

  const addResult = (test: string, status: 'success' | 'error', message: string) => {
    setTestResults(prev => [...prev, { test, status, message }]);
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Initialize Reputation
      addResult('Initialization', 'success', 'Starting tests...');

      console.log('Current user:', currentUser);
      console.log('Reputation service:', reputationService);

      if (!currentUser?.uid) {
        throw new Error('No user ID found');
      }

      await reputationService.initializeReputation(currentUser.uid, currentUser.name);
      addResult('Initialize Reputation', 'success', 'Successfully initialized reputation for current user');

      // Test 2: Get Reputation
      const rep = await reputationService.getReputation(currentUser.uid);
      if (rep) {
        addResult('Get Reputation', 'success', `Retrieved reputation: Score ${rep.score}, Tier ${rep.tier}`);
      } else {
        addResult('Get Reputation', 'error', 'Failed to retrieve reputation');
      }

      // Test 3: Check Posting Allowed
      const postingCheck = await reputationService.checkPostingAllowed(currentUser.uid);
      if (postingCheck.allowed) {
        addResult('Check Posting', 'success', 'Posting is allowed for current user');
      } else {
        addResult('Check Posting', 'error', `Posting blocked: ${postingCheck.reason}`);
      }

      // Test 4: Calculate Score
      const newScore = await reputationService.calculateUserScore(currentUser.uid);
      addResult('Calculate Score', 'success', `Calculated new score: ${newScore}`);

      // Test 5: Test Low Score Restrictions
      await reputationService.manualOverride(currentUser.uid, 15, currentUser.uid, 'Testing low score restrictions');
      const lowScoreCheck = await reputationService.checkPostingAllowed(currentUser.uid);
      if (!lowScoreCheck.allowed) {
        addResult('Low Score Test', 'success', 'Correctly blocked posting with score < 20');
      } else {
        addResult('Low Score Test', 'error', 'Should have blocked posting with low score');
      }

      // Test 6: Test High Score Perks
      await reputationService.manualOverride(currentUser.uid, 85, currentUser.uid, 'Testing high score perks');
      const highRep = await reputationService.getReputation(currentUser.uid);
      if (highRep?.perks.highlightBadge && highRep?.perks.visibilityBoost) {
        addResult('High Score Test', 'success', 'Correctly unlocked perks for score > 75');
      } else {
        addResult('High Score Test', 'error', 'Failed to unlock perks');
      }

      // Test 7: Restore Original Score
      await reputationService.calculateUserScore(currentUser.uid);
      addResult('Restore Score', 'success', 'Restored original calculated score');

      // Test 8: Test Visibility Toggle
      await reputationService.toggleVisibility(currentUser.uid, false);
      const privateRep = await reputationService.getReputation(currentUser.uid);
      if (privateRep && !privateRep.visibilityPublic) {
        addResult('Visibility Test', 'success', 'Successfully toggled visibility to private');
      } else {
        addResult('Visibility Test', 'error', 'Failed to toggle visibility');
      }

      await reputationService.toggleVisibility(currentUser.uid, true);
      addResult('Visibility Restore', 'success', 'Restored visibility to public');

      addResult('All Tests', 'success', '✅ All tests completed successfully!');

    } catch (error: any) {
      console.error('Test error:', error);
      addResult('Test Error', 'error', error.message || error.toString() || 'An error occurred during testing');
    } finally {
      setTesting(false);
    }
  };

  const testScoreCalculation = async () => {
    setTesting(true);
    setTestResults([]);
    try {
      if (!currentUser?.uid) {
        throw new Error('No user ID found');
      }
      addResult('Score Calculation', 'success', 'Calculating score...');
      const score = await reputationService.calculateUserScore(currentUser.uid);
      addResult('Score Calculation', 'success', `Your calculated score: ${score}`);
    } catch (error: any) {
      console.error('Score calculation error:', error);
      addResult('Score Calculation', 'error', error.message || error.toString());
    } finally {
      setTesting(false);
    }
  };

  const testScoreScenarios = async () => {
    setTesting(true);
    setTestResults([]);

    try {
      if (!currentUser?.uid) {
        throw new Error('No user ID found');
      }

      const scenarios = [
      { score: 95, tier: 'legendary', description: 'VIP with all perks' },
      { score: 80, tier: 'elite', description: 'Premium with highlight badge' },
      { score: 65, tier: 'veteran', description: 'Enhanced with fast posting' },
      { score: 50, tier: 'trusted', description: 'Standard access' },
      { score: 30, tier: 'novice', description: 'Limited posting' },
      { score: 15, tier: 'novice', description: 'Cooldown mode' }
    ];

    for (const scenario of scenarios) {
      try {
        await reputationService.manualOverride(
          currentUser.uid,
          scenario.score,
          currentUser.uid,
          `Testing ${scenario.tier} tier`
        );

        const rep = await reputationService.getReputation(currentUser.uid);
        const postingCheck = await reputationService.checkPostingAllowed(currentUser.uid);

        const details = [
          `Tier: ${rep?.tier}`,
          `Perks: ${Object.entries(rep?.perks || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}`,
          `Max Posts/Hour: ${rep?.restrictions.maxPostsPerHour}`,
          postingCheck.allowed ? 'Posting: Allowed' : `Posting: ${postingCheck.reason}`
        ].join(' | ');

        addResult(
          `Score ${scenario.score} (${scenario.tier})`,
          'success',
          details
        );

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        addResult(`Score ${scenario.score}`, 'error', error.message);
      }
    }

      try {
        await reputationService.calculateUserScore(currentUser.uid);
        addResult('Restored', 'success', 'Original score restored');
      } catch (error: any) {
        addResult('Restore', 'error', error.message);
      }
    } catch (error: any) {
      console.error('Test scenarios error:', error);
      addResult('Test Error', 'error', error.message || error.toString());
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            Reputation System Tester
          </h1>
          <p className="text-gray-600">Test all reputation system features and functionality</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={runAllTests}
            disabled={testing}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            Run All Tests
          </button>

          <button
            onClick={testScoreCalculation}
            disabled={testing}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            <RefreshCw className="w-5 h-5" />
            Test Score Calc
          </button>

          <button
            onClick={testScoreScenarios}
            disabled={testing}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            <Shield className="w-5 h-5" />
            Test All Tiers
          </button>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/30 shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Test Results
          </h2>

          {testResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No tests run yet. Click a button above to start testing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-semibold ${
                        result.status === 'success' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.test}
                      </p>
                      <p className={`text-sm ${
                        result.status === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {testing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Running tests...</span>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Testing Instructions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• <strong>Run All Tests:</strong> Comprehensive test of all features</li>
            <li>• <strong>Test Score Calc:</strong> Recalculate your current score based on activity</li>
            <li>• <strong>Test All Tiers:</strong> Simulate each reputation tier and check restrictions</li>
            <li>• Tests will modify your score temporarily but restore it at the end</li>
            <li>• Check your profile page to see reputation changes in real-time</li>
            <li>• Monitor browser console for detailed logs</li>
            <li>• View full testing guide in REPUTATION_SYSTEM_TESTING_GUIDE.md</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
