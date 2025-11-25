import { Briefcase, Calendar, MapPin, Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function RecruiterListPage() {
  const { currentUser } = useApp();
  const isVip = currentUser?.plan === 'vip';

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-[#000000]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#000000]">Recruiter Intelligence</h1>
            <p className="text-gray-600">Insights from Emirates recruitment</p>
          </div>
        </div>
      </motion.div>

      {!isVip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#D4AF37] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#000000]" />
            </div>
            <h3 className="text-lg font-bold text-amber-900">VIP Exclusive Feature</h3>
          </div>
          <p className="text-amber-700 mb-4">
            Upgrade to VIP to access recruiter insights, past open day data, and candidate success profiles.
          </p>
          <button className="px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#D4AF37] text-[#000000] rounded-xl font-bold hover:shadow-lg transition">
            Upgrade to VIP
          </button>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-white rounded-2xl shadow-lg p-6 ${!isVip && 'opacity-50 pointer-events-none'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-[#D71921]" />
            <h2 className="text-xl font-bold text-[#000000]">Upcoming Open Days</h2>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-gray-200 rounded-xl p-4 hover:border-[#D71921] transition">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-[#000000]">Dubai Assessment Center</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Open
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>March {15 + i}, 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Emirates Group Headquarters, Dubai</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>~150 candidates expected</span>
                  </div>
                </div>
                {isVip && (
                  <button className="mt-3 w-full py-2 bg-[#D71921] hover:bg-[#B91518] text-white rounded-lg font-semibold transition">
                    View Details
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-white rounded-2xl shadow-lg p-6 ${!isVip && 'opacity-50 pointer-events-none'}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-[#D71921]" />
            <h2 className="text-xl font-bold text-[#000000]">Success Profiles</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Learn from candidates who successfully joined Emirates
          </p>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-gray-200 rounded-xl p-4 hover:border-[#FFD700] transition">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={`https://images.pexels.com/photos/${733872 + i * 100}/pexels-photo-${733872 + i * 100}.jpeg?auto=compress&cs=tinysrgb&w=100`}
                    alt="Candidate"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-[#000000]">Anonymous Candidate #{i}</h3>
                    <p className="text-xs text-gray-500">Joined 202{3 + i}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    English: B2+
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                    No Experience
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    First Interview
                  </span>
                </div>
                {isVip && (
                  <button className="mt-3 text-sm text-[#D71921] font-semibold hover:underline">
                    Read Full Story →
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`bg-gradient-to-r from-[#EADBC8] to-[#F5E6D3] rounded-2xl shadow-lg p-6 ${!isVip && 'opacity-50'}`}
      >
        <h3 className="text-xl font-bold text-[#000000] mb-4">Recruiter Insights</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="text-3xl font-bold text-[#D71921] mb-1">72%</div>
            <div className="text-sm text-gray-600">Pass rate for well-prepared candidates</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-3xl font-bold text-[#D71921] mb-1">B2+</div>
            <div className="text-sm text-gray-600">Minimum English level required</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-3xl font-bold text-[#D71921] mb-1">3-5</div>
            <div className="text-sm text-gray-600">Average interview rounds</div>
          </div>
        </div>
      </motion.div>

      {isVip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-[#000000] mb-3">Coming Soon</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full"></div>
              Real-time open day availability notifications
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full"></div>
              Detailed recruiter profiles and what they look for
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full"></div>
              Historical data on acceptance rates by location
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D71921] rounded-full"></div>
              Anonymous candidate interview experiences
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}
