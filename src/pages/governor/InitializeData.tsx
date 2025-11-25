import { useState } from 'react';
import { Database, RefreshCw, CheckCircle, XCircle, FileCheck, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { initializeDefaultCourses } from '../../utils/initializeCourses';
import { initializeDefaultModules } from '../../utils/initializeModules';
import { initializeExams } from '../../utils/initializeExams';
import { initializeTestConversations } from '../../utils/initializeConversations';

export default function InitializeData() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    courses?: 'success' | 'error';
    modules?: 'success' | 'error';
    exams?: 'success' | 'error';
    conversations?: 'success' | 'error';
    message?: string;
  }>({});

  const handleInitializeCourses = async () => {
    setLoading(true);
    setStatus({});
    try {
      await initializeDefaultCourses();
      setStatus({ courses: 'success', message: 'Courses initialized successfully!' });
    } catch (error: any) {
      console.error('Error:', error);
      setStatus({ courses: 'error', message: error.message || 'Failed to initialize courses' });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeModules = async () => {
    setLoading(true);
    setStatus({});
    try {
      await initializeDefaultModules();
      setStatus({ modules: 'success', message: 'Modules initialized successfully!' });
    } catch (error: any) {
      console.error('Error:', error);
      setStatus({ modules: 'error', message: error.message || 'Failed to initialize modules' });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeExams = async () => {
    setLoading(true);
    setStatus({});
    try {
      await initializeExams();
      setStatus({ exams: 'success', message: 'Exams initialized successfully!' });
    } catch (error: any) {
      console.error('Error:', error);
      setStatus({ exams: 'error', message: error.message || 'Failed to initialize exams' });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeConversations = async () => {
    setLoading(true);
    setStatus({});
    try {
      await initializeTestConversations();
      setStatus({ conversations: 'success', message: 'Conversations initialized successfully!' });
    } catch (error: any) {
      console.error('Error:', error);
      setStatus({ conversations: 'error', message: error.message || 'Failed to initialize conversations' });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeAll = async () => {
    setLoading(true);
    setStatus({});
    try {
      await initializeDefaultCourses();
      await initializeDefaultModules();
      await initializeExams();
      await initializeTestConversations();
      setStatus({
        courses: 'success',
        modules: 'success',
        exams: 'success',
        conversations: 'success',
        message: 'All data initialized successfully!'
      });
    } catch (error: any) {
      console.error('Error:', error);
      setStatus({
        courses: 'error',
        modules: 'error',
        exams: 'error',
        conversations: 'error',
        message: error.message || 'Failed to initialize data'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Initialize Database</h1>
        <p className="text-gray-600">
          Populate the database with default courses and modules
        </p>
      </div>

      <div className="glass-light rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-[#D71920]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Data Initialization</h2>
            <p className="text-sm text-gray-600">
              This will create sample courses and modules in Firebase
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 glass-light rounded-xl">
            <h3 className="font-bold text-gray-900 mb-2">Sample Courses</h3>
            <p className="text-sm text-gray-600 mb-3">
              9 pre-configured courses covering interview prep, grooming, safety, customer
              service, and language training
            </p>
            <button
              onClick={handleInitializeCourses}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#D71920] text-white rounded-lg font-bold hover:bg-[#B91518] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Initialize Courses
            </button>
            {status.courses && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${
                status.courses === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.courses === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>

          <div className="p-4 glass-light rounded-xl">
            <h3 className="font-bold text-gray-900 mb-2">Training Modules</h3>
            <p className="text-sm text-gray-600 mb-3">
              10 modules organized by category with progression levels
            </p>
            <button
              onClick={handleInitializeModules}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#D71920] text-white rounded-lg font-bold hover:bg-[#B91518] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Initialize Modules
            </button>
            {status.modules && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${
                status.modules === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.modules === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>

          <div className="p-4 glass-light rounded-xl">
            <h3 className="font-bold text-gray-900 mb-2">Course Exams</h3>
            <p className="text-sm text-gray-600 mb-3">
              4 exams for Open Day courses (10 questions each, 70% passing score)
            </p>
            <button
              onClick={handleInitializeExams}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#D71920] text-white rounded-lg font-bold hover:bg-[#B91518] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileCheck className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Initialize Exams
            </button>
            {status.exams && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${
                status.exams === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.exams === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>

          <div className="p-4 glass-light rounded-xl">
            <h3 className="font-bold text-gray-900 mb-2">Test Conversations</h3>
            <p className="text-sm text-gray-600 mb-3">
              Sample conversations for testing the community chat system
            </p>
            <button
              onClick={handleInitializeConversations}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#D71920] text-white rounded-lg font-bold hover:bg-[#B91518] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Initialize Conversations
            </button>
            {status.conversations && (
              <div className={`mt-3 flex items-center gap-2 text-sm ${
                status.conversations === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {status.conversations === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={handleInitializeAll}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Initializing...' : 'Initialize All Data'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This will only add data if the database is empty. Existing data
            will not be affected.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
