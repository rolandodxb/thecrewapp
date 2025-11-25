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
      className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full">
        <div className={`rounded-3xl shadow-2xl overflow-hidden ${
          requiredPlan === 'vip'
            ? 'bg-gradient-to-br from-[#FFD700] via-[#D4AF37] to-[#FFD700]'
            : 'bg-gradient-to-br from-[#D71921] via-[#B91518] to-[#D71921]'
        }`}>
          <div className="p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
                requiredPlan === 'vip' ? 'bg-white' : 'bg-white bg-opacity-20'
              }`}
            >
              <Lock className={`w-12 h-12 ${requiredPlan === 'vip' ? 'text-[#FFD700]' : 'text-white'}`} />
            </motion.div>

            <h1 className={`text-4xl font-bold mb-4 ${requiredPlan === 'vip' ? 'text-[#000000]' : 'text-white'}`}>
              {featureName} is Locked
            </h1>

            <p className={`text-xl mb-8 ${requiredPlan === 'vip' ? 'text-[#000000] text-opacity-80' : 'text-white text-opacity-90'}`}>
              {description}
            </p>

            <div className="bg-white rounded-2xl p-8 mb-8 text-left">
              <div className="flex items-center gap-3 mb-6">
                {requiredPlan === 'vip' ? (
                  <Crown className="w-8 h-8 text-[#FFD700]" />
                ) : (
                  <Zap className="w-8 h-8 text-[#D71921]" />
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  {requiredPlan.toUpperCase()} Plan Features
                </h2>
              </div>

              <ul className="space-y-4">
                {requiredPlan === 'vip' ? (
                  <>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">AI Trainer Access</p>
                        <p className="text-gray-600 text-sm">Get personalized coaching from our advanced AI system</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Open Day Simulator</p>
                        <p className="text-gray-600 text-sm">Practice with realistic airline assessment scenarios</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Priority Support</p>
                        <p className="text-gray-600 text-sm">Get help faster with dedicated VIP support</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#000000] text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">All Pro Features</p>
                        <p className="text-gray-600 text-sm">Includes recruiter access, messaging, and more</p>
                      </div>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Recruiter Profiles</p>
                        <p className="text-gray-600 text-sm">Connect with airline recruiters directly</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Open Days Access</p>
                        <p className="text-gray-600 text-sm">View and register for airline recruitment events</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Private Messaging</p>
                        <p className="text-gray-600 text-sm">Chat privately with mentors and students</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#D71921] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Premium Courses</p>
                        <p className="text-gray-600 text-sm">Access to exclusive training materials</p>
                      </div>
                    </li>
                  </>
                )}
              </ul>
            </div>

            <button
              onClick={() => navigate('/upgrade')}
              className="w-full max-w-md px-8 py-4 bg-white text-gray-800 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
            >
              Upgrade to {requiredPlan.toUpperCase()} Now
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className={`mt-4 text-sm ${requiredPlan === 'vip' ? 'text-[#000000]' : 'text-white'} hover:underline`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
