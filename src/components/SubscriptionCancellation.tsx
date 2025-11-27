import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';
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
  const [action, setAction] = useState<'cancel' | 'downgrade'>('cancel');

  // Only show for paid plans (not free or vip)
  if (currentPlan === 'free') {
    return null;
  }

  const canDowngrade = currentPlan === 'vip';
  const downgradeTarget = 'pro';

  const handleAction = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason');
      return;
    }

    const confirmMessage = action === 'cancel'
      ? 'Are you sure you want to cancel your subscription? You will be downgraded to the free plan and lose access to premium features.'
      : `Are you sure you want to downgrade from ${currentPlan.toUpperCase()} to ${downgradeTarget.toUpperCase()}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      const newPlan = action === 'cancel' ? 'free' : downgradeTarget;

      await updateDoc(userRef, {
        plan: newPlan,
        previousPlan: currentPlan,
        [action === 'cancel' ? 'cancelledAt' : 'downgradedAt']: new Date(),
        [action === 'cancel' ? 'cancellationReason' : 'downgradeReason']: reason
      });

      const message = action === 'cancel'
        ? 'Your subscription has been cancelled. You are now on the free plan.'
        : `You have been downgraded to the ${downgradeTarget.toUpperCase()} plan.`;

      alert(message);
      onCancel();
      window.location.reload();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription. Please try again or contact support.');
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
          <span className="font-semibold text-gray-900">Manage Subscription</span>
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
              <h3 className="font-bold text-gray-900 mb-2">
                {action === 'cancel' ? "We're sorry to see you go!" : 'Downgrade your plan'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please let us know why. Your feedback helps us improve.
              </p>

              {canDowngrade && (
                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => setAction('cancel')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      action === 'cancel'
                        ? 'bg-red-600 text-white'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    Cancel to Free
                  </button>
                  <button
                    onClick={() => setAction('downgrade')}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      action === 'downgrade'
                        ? 'bg-orange-600 text-white'
                        : 'bg-white/60 text-gray-700 hover:bg-white/80'
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                    Downgrade to Pro
                  </button>
                </div>
              )}

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Tell us why you're ${action === 'cancel' ? 'cancelling' : 'downgrading'}...`}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                rows={4}
              />

              <div className={`mt-4 p-4 border rounded-lg ${
                action === 'cancel' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-sm font-semibold mb-2 ${
                  action === 'cancel' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  ⚠️ {action === 'cancel' ? 'Warning:' : 'Changes:'}
                </p>
                <ul className={`text-sm space-y-1 ${
                  action === 'cancel' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {action === 'cancel' ? (
                    <>
                      <li>• Immediate downgrade to free plan</li>
                      <li>• Loss of access to marketplace</li>
                      <li>• Loss of file management features</li>
                      <li>• Loss of login activity tracking</li>
                      <li>• Read-only access to community feed</li>
                    </>
                  ) : (
                    <>
                      <li>• Downgrade from {currentPlan.toUpperCase()} to {downgradeTarget.toUpperCase()}</li>
                      <li>• Some VIP-exclusive features will be unavailable</li>
                      <li>• You will retain Pro plan benefits</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAction}
                  disabled={loading || !reason.trim()}
                  className={`flex-1 px-4 py-2 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all ${
                    action === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {loading
                    ? (action === 'cancel' ? 'Cancelling...' : 'Downgrading...')
                    : (action === 'cancel' ? 'Confirm Cancellation' : 'Confirm Downgrade')
                  }
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-all"
                >
                  Keep {currentPlan.toUpperCase()}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
