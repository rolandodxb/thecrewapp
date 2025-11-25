import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Loader } from 'lucide-react';
import { waitlistService } from '../services/waitlistService';

export default function StaffCodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const isValid = await waitlistService.verifyStaffCode(code);

    if (isValid) {
      navigate('/login');
    } else {
      setError('Invalid or inactive staff code.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="liquid-crystal-panel p-8">
          <div className="flex justify-center mb-6">
            <img
              src="/Crews (2).png"
              alt="The Crew Academy"
              className="h-24 w-auto"
            />
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Staff Member Access
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter your staff code to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Staff Access Code
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 liquid-input"
                  placeholder="Enter staff code"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="liquid-card-overlay bg-red-500/20 border-red-400/40 text-gray-900 px-4 py-3 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full liquid-button-primary text-white py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Continue to Login'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have a staff code?{' '}
              <a
                href="/waitlist"
                className="text-[#D71920] font-bold hover:underline"
              >
                Join Waitlist
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
