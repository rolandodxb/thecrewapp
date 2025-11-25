import { useState } from 'react';
import { Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { declareVerifiedCrew } from '../services/rewardsService';

interface DeclareCrewButtonProps {
  userId: string;
  isVerifiedCrew: boolean;
  onSuccess: () => void;
}

export default function DeclareCrewButton({ userId, isVerifiedCrew, onSuccess }: DeclareCrewButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleDeclare = async () => {
    setProcessing(true);
    try {
      await declareVerifiedCrew(userId);
      alert('Congratulations! You are now a Verified Cabin Crew member!');
      onSuccess();
      setShowModal(false);
    } catch (error) {
      console.error('Error declaring crew status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (isVerifiedCrew) {
    return (
      <div className="bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl p-6 flex items-center gap-4">
        <CheckCircle className="w-12 h-12 flex-shrink-0" />
        <div>
          <h3 className="text-xl font-bold">Verified Cabin Crew</h3>
          <p className="text-white/90 mt-1">You have graduated from the academy!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-[#D71920] to-[#B91518] text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-xl transition flex items-center justify-center gap-3"
      >
        <Award className="w-6 h-6" />
        I am now Cabin Crew
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Confirm Your Status</h2>
                <p className="text-gray-600 mt-2">
                  Are you sure you're now a cabin crew member?
                </p>
              </div>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-red-800 mb-2">Important:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>✓ You'll receive a "Verified Cabin Crew" badge</li>
                <li>⚠️ All courses will be permanently locked</li>
                <li>⚠️ Point progression will be frozen</li>
                <li>⚠️ This action cannot be undone</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclare}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
