import { useState } from 'react';
import { Bug, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { createBugReport, BugPriority } from '../services/bugReportService';

export default function BugReportButton() {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState<BugPriority>('medium');
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'general', label: 'General Issue' },
    { value: 'chat', label: 'Chat System' },
    { value: 'courses', label: 'Courses' },
    { value: 'ai-assistant', label: 'AI Assistant' },
    { value: 'cv-optimizer', label: 'CV Optimizer' },
    { value: 'open-days', label: 'Open Days' },
    { value: 'profile', label: 'Profile' },
    { value: 'authentication', label: 'Login/Registration' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !title.trim() || !description.trim()) return;

    setLoading(true);
    try {
      await createBugReport({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        reportedBy: currentUser.uid,
        reportedByName: currentUser.name,
        reportedByRole: currentUser.role
      });

      alert('Bug report submitted successfully! Our team will review it shortly.');
      setTitle('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      alert('Failed to submit bug report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center gap-2"
        title="Report a Bug"
      >
        <Bug className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999]"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                position: 'fixed',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none" style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="sticky top-0 chat-header flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Bug className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🔥 Report a Bug - BLUR ACTIVE</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Bug Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="w-full chat-input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full chat-input-field"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['low', 'medium', 'high', 'critical'] as BugPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition ${
                          priority === p
                            ? p === 'critical' ? 'bg-red-600 text-white' :
                              p === 'high' ? 'bg-orange-600 text-white' :
                              p === 'medium' ? 'bg-yellow-600 text-white' :
                              'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe the bug in detail. Include steps to reproduce if possible..."
                    rows={6}
                    className="w-full chat-input-field resize-none"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={loading || !title.trim() || !description.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm sm:text-base">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span className="text-sm sm:text-base">Submit Report</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-3 chat-input-field font-semibold text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
