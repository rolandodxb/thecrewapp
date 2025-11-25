import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, User, CheckCircle, Loader } from 'lucide-react';
import { waitlistService } from '../services/waitlistService';

export default function WaitlistPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await waitlistService.addToWaitlist(name, email);

    if (result.success) {
      setSuccess(true);
      setName('');
      setEmail('');
    } else {
      setError(result.error || 'An unexpected error occurred. Please try again.');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="liquid-crystal-panel p-8 text-center">
            <div className="flex justify-center mb-6">
              <img
                src="/Crews (2).png"
                alt="The Crew Academy"
                className="h-24 w-auto"
              />
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You're on the List!
            </h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Thank you for your interest in The Crew Academy. We'll notify you via email when your access is approved.
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full liquid-button-primary text-white py-3.5 font-bold"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
            Join the Waitlist
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Be the first to access The Crew Academy
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 liquid-input"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 liquid-input"
                  placeholder="your.email@example.com"
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
                  Joining...
                </>
              ) : (
                'Join Waitlist'
              )}
            </button>
          </form>

          {/* Back to Landing Page Button */}
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full liquid-button-secondary text-gray-700 py-3.5 font-bold hover:bg-gray-100 transition"
          >
            Back to Landing Page
          </button>
        </div>
      </motion.div>
    </div>
  );
}
