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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center p-4 py-8"
    >
      <div className="max-w-xl w-full">
        <div className={`rounded-2xl shadow-xl overflow-hidden ${
          requiredPlan === 'vip'
            ? 'bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#FFD700]'
            : 'bg-gradient-to-br from-[#D71921] via-[#B91518] to-[#D71921]'
        }`}>
          <div className="p-6 md:p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full mb-4 ${
                requiredPlan === 'vip' ? 'bg-white' : 'bg-white bg-opacity-20'
              }`}
            >
              <Lock className={`w-8 h-8 md:w-10 md:h-10 ${requiredPlan === 'vip' ? 'text-[#FFD700]' : 'text-white'}`} />
            </motion.div>

            <h1 className={`text-2xl md:text-3xl font-bold mb-3 ${requiredPlan === 'vip' ? 'text-[#000000]' : 'text-white'}`}>
              {featureName} is Locked
            </h1>

            <p className={`text-base md:text-lg mb-6 ${requiredPlan === 'vip' ? 'text-[#000000] text-opacity-80' : 'text-white text-opacity-90'}`}>
              {description}
            </p>

            <div className="bg-white rounded-xl p-4 md:p-6 mb-6 text-left">
              <div className="flex items-center gap-2 mb-4">
                {requiredPlan === 'vip' ? (
                  <Crown className="w-6 h-6 text-[#FFD700]" />
                ) : (
                  <Zap className="w-6 h-6 text-[#D71921]" />
                )}
                <h2 className="text-lg md:text-xl font-bold text-gray-800">
                  {requiredPlan.toUpperCase()} Plan Features
                </h2>
              </div>

              <ul className="space-y-3">
                {requiredPlan === 'vip' ? (
                  <>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">AI Trainer Access</p>
                        <p className="text-gray-600 text-xs">Personalized coaching from AI</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Open Day Simulator</p>
                        <p className="text-gray-600 text-xs">Realistic assessment scenarios</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Priority Support</p>
                        <p className="text-gray-600 text-xs">Dedicated VIP support</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">All Pro Features</p>
                        <p className="text-gray-600 text-xs">Recruiter access, messaging & more</p>
                      </div>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Recruiter Profiles</p>
                        <p className="text-gray-600 text-xs">Connect with airline recruiters</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Open Days Access</p>
                        <p className="text-gray-600 text-xs">View recruitment events</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Private Messaging</p>
                        <p className="text-gray-600 text-xs">Chat with mentors & students</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Premium Courses</p>
                        <p className="text-gray-600 text-xs">Exclusive training materials</p>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <button
              onClick={() => navigate('/upgrade')}
              className="w-full px-6 py-3 bg-white text-gray-800 rounded-xl font-bold text-base md:text-lg hover:shadow-2xl transition transform hover:scale-105"
            >
              Upgrade to {requiredPlan.toUpperCase()} Now
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className={`mt-3 text-xs md:text-sm ${requiredPlan === 'vip' ? 'text-[#000000]' : 'text-white'} hover:underline`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
