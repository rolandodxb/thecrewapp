import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { initializeDefaultCourses } from '../../../utils/initializeCourses';
import { initializeDefaultModules } from '../../../utils/initializeModules';
import { initializeTestConversations } from '../../../utils/initializeConversations';
import { initializeExams } from '../../../utils/initializeExams';

export default function DataInitializer() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    courses?: 'success' | 'error';
    modules?: 'success' | 'error';
    conversations?: 'success' | 'error';
    exams?: 'success' | 'error';
    message?: string;
  }>({});

  const handleInitializeAll = async () => {
    setLoading(true);
    setStatus({});

    console.log('===== STARTING DATA INITIALIZATION =====');

    try {
      console.log('Step 1: Initializing courses...');
      await initializeDefaultCourses();
      console.log('✅ Courses initialized successfully');

      console.log('Step 2: Initializing modules...');
      await initializeDefaultModules();
      console.log('✅ Modules initialized successfully');

      console.log('Step 3: Initializing exams...');
      await initializeExams();
      console.log('✅ Exams initialized successfully');

      console.log('Step 4: Initializing conversations...');
      await initializeTestConversations();
      console.log('✅ Conversations initialized successfully');

      setStatus({
        courses: 'success',
        modules: 'success',
        conversations: 'success',
        exams: 'success',
        message: 'Database initialized with sample courses, modules, exams, and conversations!'
      });
    } catch (error: any) {
      console.error('❌ INITIALIZATION ERROR:', error);
      console.error('Error name:', error.name);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));

      let errorMessage = error.message || 'Failed to initialize data';

      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Make sure you are logged in as Governor and Firestore rules are deployed.';
      }

      setStatus({
        courses: 'error',
        modules: 'error',
        conversations: 'error',
        exams: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
      console.log('===== INITIALIZATION COMPLETE =====');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light border border-gray-200 rounded-xl p-6 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-gray-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Database Initialization</h2>
          <p className="text-xs text-gray-600">Populate with sample data</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 glass-light rounded-xl border border-gray-200">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700">
              This will add 9 sample courses, 10 training modules, 4 exams, and test conversations to the database. Only runs if database is empty.
            </div>
          </div>
        </div>

        {status.message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-3 rounded-xl border flex items-center gap-2 ${
              status.courses === 'success'
                ? 'bg-green-900/20 border-green-700 text-green-300'
                : 'bg-red-900/20 border-red-700 text-red-300'
            }`}
          >
            {status.courses === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-sm">{status.message}</span>
          </motion.div>
        )}

        <button
          onClick={handleInitializeAll}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#3D4A52] to-[#2A3439] hover:from-[#2A3439] hover:to-[#1F2629] text-gray-900 rounded-xl font-semibold transition border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Initializing...' : 'Initialize Sample Data'}
        </button>
      </div>
    </motion.div>
  );
}
