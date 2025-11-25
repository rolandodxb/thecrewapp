import { Lock, Crown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface FeatureLockProps {
  requiredPlan: 'pro' | 'vip';
  featureName: string;
  description: string;
}

export default function FeatureLock({ requiredPlan, featureName, description }: FeatureLockProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className={`rounded-xl shadow-lg overflow-hidden ${
          requiredPlan === 'vip'
            ? 'bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#FFD700]'
            : 'bg-gradient-to-br from-[#D71921] via-[#B91518] to-[#D71921]'
        }`}>
          <div className="p-4 sm:p-5 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full mb-3 ${
                requiredPlan === 'vip' ? 'bg-white' : 'bg-white bg-opacity-20'
              }`}
            >
              <Lock className={`w-6 h-6 sm:w-7 sm:h-7 ${requiredPlan === 'vip' ? 'text-[#FFD700]' : 'text-white'}`} />
            </motion.div>

            <h1 className={`text-lg sm:text-xl font-bold mb-2 ${requiredPlan === 'vip' ? 'text-[#000000]' : 'text-white'}`}>
              {featureName} is Locked
            </h1>

            <p className={`text-xs sm:text-sm mb-4 ${requiredPlan === 'vip' ? 'text-[#000000] text-opacity-80' : 'text-white text-opacity-90'}`}>
              {description}
            </p>

            <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 text-left">
              <div className="flex items-center gap-2 mb-3">
                {requiredPlan === 'vip' ? (
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD700]" />
                ) : (
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#D71921]" />
                )}
                <h2 className="text-sm sm:text-base font-bold text-gray-800">
                  {requiredPlan.toUpperCase()} Features
                </h2>
              </div>

              <ul className="space-y-2">
                {requiredPlan === 'vip' ? (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#000000] text-[10px] font-bold">✓</span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">AI Trainer & Simulator</p>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#000000] text-[10px] font-bold">✓</span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">Priority Support</p>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#000000] text-[10px] font-bold">✓</span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">All Pro Features</p>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">Recruiter Profiles</p>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">Open Days Access</p>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">Private Messaging</p>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">✓</span>
                      </div>
                      <p className="font-medium text-gray-800 text-xs sm:text-sm">Premium Courses</p>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <button
              onClick={() => navigate('/upgrade')}
              className="w-full px-4 py-2.5 bg-white text-gray-800 rounded-lg font-bold text-sm sm:text-base hover:shadow-xl transition transform hover:scale-105"
            >
              Upgrade to {requiredPlan.toUpperCase()}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className={`mt-2 text-[11px] sm:text-xs ${requiredPlan === 'vip' ? 'text-[#000000]' : 'text-white'} hover:underline opacity-80`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
