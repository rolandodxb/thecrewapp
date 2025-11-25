import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionCancellationProps {
  userId: string;
  currentPlan: string;
  onCancel: () => void;
}

export default function SubscriptionCancellation({ userId, currentPlan, onCancel }: SubscriptionCancellationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (currentPlan === 'free' || currentPlan === 'vip') {
    return null;
  }

  const handleCancel = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!confirm('Are you sure you want to cancel your subscription? You will be immediately downgraded to the free plan and lose access to premium features.')) {
      return;
    }

    setLoading(true);
    try {
      // Update user plan to free
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        plan: 'free',
        previousPlan: currentPlan,
        cancelledAt: new Date(),
        cancellationReason: reason
      });

      alert('Your subscription has been cancelled. You are now on the free plan.');
      onCancel();
      window.location.reload(); // Reload to apply restrictions
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6 mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-lg border border-gray-200/50 hover:bg-white/60 transition-all"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <span className="font-semibold text-gray-900">Cancel Subscription</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-6 bg-orange-50/50 backdrop-blur-sm rounded-lg border border-orange-200/50">
              <h3 className="font-bold text-gray-900 mb-2">We're sorry to see you go!</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please let us know why you're cancelling. Your feedback helps us improve.
              </p>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us why you're cancelling..."
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                rows={4}
              />

              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Warning:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Immediate downgrade to free plan</li>
                  <li>• Loss of access to marketplace</li>
                  <li>• Loss of file management features</li>
                  <li>• Loss of login activity tracking</li>
                  <li>• Read-only access to community feed</li>
                </ul>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCancel}
                  disabled={loading || !reason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all"
                >
                  {loading ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
