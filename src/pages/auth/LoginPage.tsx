import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plane, Lock, Mail, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth, supabase } from '../../lib/auth';
import { recordLoginActivity } from '../../services/loginActivityService';
import { totpService } from '../../services/totpService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      sessionStorage.setItem('pending2FA', 'true');

      const { user: tempUser } = await auth.signInWithEmailAndPassword(email, password);
      if (!tempUser) throw new Error('Login failed');

      const has2FA = await totpService.check2FAStatus(tempUser.uid);

      if (has2FA) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', tempUser.uid)
          .maybeSingle();

        setPendingUserId(tempUser.uid);
        setPendingUserData({
          uid: tempUser.uid,
          email: userData?.email || tempUser.email,
          name: userData?.name || 'User',
          role: (userData?.role || 'student') as 'student' | 'mentor' | 'governor',
          plan: (userData?.plan || 'free') as 'free' | 'pro' | 'vip',
          country: userData?.country || '',
          bio: userData?.bio || '',
          expectations: userData?.metadata?.expectations || '',
          photoURL: userData?.photo_url || '',
          hasCompletedOnboarding: userData?.metadata?.hasCompletedOnboarding || false,
          hasSeenWelcomeBanner: userData?.metadata?.hasSeenWelcomeBanner || false,
          onboardingCompletedAt: userData?.metadata?.onboardingCompletedAt,
          welcomeBannerSeenAt: userData?.metadata?.welcomeBannerSeenAt,
          createdAt: userData?.created_at || new Date().toISOString(),
          updatedAt: userData?.updated_at || new Date().toISOString(),
        });

        setShow2FA(true);
        setLoading(false);
        return;
      }

      sessionStorage.removeItem('pending2FA');

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', tempUser.uid)
        .maybeSingle();

      if (!userData) {
        throw new Error('User profile not found. Please contact support.');
      }

      const currentUser = {
        uid: tempUser.uid,
        email: userData.email || tempUser.email || '',
        name: userData.name || 'User',
        role: (userData.role || 'student') as 'student' | 'mentor' | 'governor',
        plan: (userData.plan || 'free') as 'free' | 'pro' | 'vip',
        country: userData.country || '',
        bio: userData.bio || '',
        expectations: userData.metadata?.expectations || '',
        photoURL: userData.photo_url || '',
        hasCompletedOnboarding: userData.metadata?.hasCompletedOnboarding || false,
        hasSeenWelcomeBanner: userData.metadata?.hasSeenWelcomeBanner || false,
        onboardingCompletedAt: userData.metadata?.onboardingCompletedAt,
        welcomeBannerSeenAt: userData.metadata?.welcomeBannerSeenAt,
        createdAt: userData.created_at || new Date().toISOString(),
        updatedAt: userData.updated_at || new Date().toISOString(),
      };

      setCurrentUser(currentUser);

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', tempUser.uid);

      await recordLoginActivity(tempUser.uid, true);

      if (currentUser.hasCompletedOnboarding) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
      sessionStorage.removeItem('pending2FA');
      await recordLoginActivity(email, false);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId || !twoFactorCode) return;

    setLoading(true);
    setError('');

    try {
      const isValid = useBackupCode
        ? await totpService.verifyBackupCode(pendingUserId, twoFactorCode)
        : await totpService.verifyTOTP(pendingUserId, twoFactorCode);

      if (!isValid) {
        setError(useBackupCode ? 'Invalid backup code' : 'Invalid verification code');
        setLoading(false);
        return;
      }

      sessionStorage.removeItem('pending2FA');
      setCurrentUser(pendingUserData);

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', pendingUserId);

      await recordLoginActivity(pendingUserId, true);

      if (pendingUserData.hasCompletedOnboarding) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error('2FA verification error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (show2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-gray-600 mt-2">
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={useBackupCode ? 'Backup code' : '000000'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                maxLength={useBackupCode ? 12 : 6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || twoFactorCode.length < 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setTwoFactorCode('');
                setError('');
              }}
              className="w-full text-blue-600 hover:text-blue-700 text-sm"
            >
              {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full grid md:grid-cols-2"
      >
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white flex flex-col justify-center">
          <Plane className="w-16 h-16 mb-6" />
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-blue-100 text-lg">
            Sign in to continue your journey with Emirates Academy
          </p>
        </div>

        <div className="p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
          <p className="text-gray-600 mb-8">Enter your credentials to access your account</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
                </Link>
              </p>
              <p className="text-sm">
                <Link to="/reset-password" className="text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
