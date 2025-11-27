import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plane, Lock, Mail, Shield, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
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

      const tempCredential = await signInWithEmailAndPassword(auth, email, password);
      const tempUser = tempCredential.user;

      const has2FA = await totpService.check2FAStatus(tempUser.uid);

      if (has2FA) {

        const userDocRef = doc(db, 'users', tempUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();


        setPendingUserId(tempUser.uid);
        setPendingUserData({
          uid: tempUser.uid,
          email: userData?.email || tempUser.email,
          name: userData?.name || 'User',
          role: (userData?.role || 'student') as 'student' | 'mentor' | 'governor',
          plan: (userData?.plan || 'free') as 'free' | 'pro' | 'vip',
          country: userData?.country || '',
          bio: userData?.bio || '',
          expectations: userData?.expectations || '',
          photoURL: userData?.photo_base64 || '',
          hasCompletedOnboarding: userData?.hasCompletedOnboarding || false,
          hasSeenWelcomeBanner: userData?.hasSeenWelcomeBanner || false,
          onboardingCompletedAt: userData?.onboardingCompletedAt,
          welcomeBannerSeenAt: userData?.welcomeBannerSeenAt,
          createdAt: userData?.createdAt || new Date().toISOString(),
          updatedAt: userData?.updatedAt || new Date().toISOString(),
        });

        setShow2FA(true);
        setLoading(false);
        return;
      }

      sessionStorage.removeItem('pending2FA');

      const userDocRef = doc(db, 'users', tempUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found. Please contact support.');
      }

      const userData = userDoc.data();
      const currentUser = {
        uid: tempUser.uid,
        email: userData.email || tempUser.email,
        name: userData.name || 'User',
        role: (userData.role || 'student') as 'student' | 'mentor' | 'governor',
        plan: (userData.plan || 'free') as 'free' | 'pro' | 'vip',
        country: userData.country || '',
        bio: userData.bio || '',
        expectations: userData.expectations || '',
        photoURL: userData.photo_base64 || '',
        hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
        hasSeenWelcomeBanner: userData.hasSeenWelcomeBanner || false,
        onboardingCompletedAt: userData.onboardingCompletedAt,
        welcomeBannerSeenAt: userData.welcomeBannerSeenAt,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };

      setCurrentUser(currentUser);

      await updateDoc(doc(db, 'users', tempUser.uid), {
        lastLogin: serverTimestamp()
      });

      await recordLoginActivity(tempUser.uid, true);

      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        return;
      }

      let errorMessage = 'Invalid email or password';

      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      let userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          photo_base64: user.photoURL || '',
          role: 'student',
          plan: 'free',
          country: '',
          bio: '',
          expectations: '',
          hasCompletedOnboarding: false,
          hasSeenWelcomeBanner: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        userDoc = await getDoc(doc(db, 'users', user.uid));
      }

      const userData = userDoc.data()!;

      const currentUser = {
        uid: user.uid,
        email: userData.email || user.email,
        name: userData.name || user.displayName || 'User',
        role: (userData.role || 'student') as 'student' | 'mentor' | 'governor',
        plan: (userData.plan || 'free') as 'free' | 'pro' | 'vip',
        country: userData.country || '',
        bio: userData.bio || '',
        expectations: userData.expectations || '',
        photoURL: userData.photo_base64 || user.photoURL || '',
        hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
        hasSeenWelcomeBanner: userData.hasSeenWelcomeBanner || false,
        onboardingCompletedAt: userData.onboardingCompletedAt,
        welcomeBannerSeenAt: userData.welcomeBannerSeenAt,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
      };

      const has2FA = await totpService.check2FAStatus(user.uid);

      if (has2FA) {
        setPendingUserId(user.uid);
        setPendingUserData(currentUser);
        setShow2FA(true);
        setLoading(false);
        await auth.signOut();
        return;
      }

      setCurrentUser(currentUser);

      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      });

      await recordLoginActivity(user.uid, true);
      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Failed to sign in with Google';

      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-api-key') {
        errorMessage = '🔧 Google Sign-In Coming Soon! This feature is currently being configured. Please use email/password login for now.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked! Please allow pop-ups for this site in your browser settings and try again.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain not authorized. Please contact support.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = '🔧 Google Sign-In Coming Soon! This sign-in method is being activated. Use email/password for now.';
      } else if (err.message && !err.message.includes('Firebase')) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // TODO: Re-enable 2FA with browser-compatible TOTP library
  // const handleVerify2FA = async () => {
  //   if (!twoFactorCode || twoFactorCode.length !== 6 || !pendingUserId) {
  //     setError('Please enter a 6-digit code');
  //     return;
  //   }

  //   setLoading(true);
  //   setError('');

  //   try {
  //     const valid = await twoFactorService.verifyToken(pendingUserId, twoFactorCode);

  //     if (valid) {
  //       const userDoc = await getDoc(doc(db, 'users', pendingUserId));
  //       const userData = userDoc.data()!;

  //       const currentUser = {
  //         uid: pendingUserId,
  //         email: userData.email,
  //         name: userData.name || 'User',
  //         role: (userData.role || 'student') as 'student' | 'mentor' | 'governor',
  //         plan: (userData.plan || 'free') as 'free' | 'pro' | 'vip',
  //         country: userData.country || '',
  //         bio: userData.bio || '',
  //         expectations: userData.expectations || '',
  //         photoURL: userData.photo_base64 || '',
  //         hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
  //         hasSeenWelcomeBanner: userData.hasSeenWelcomeBanner || false,
  //         onboardingCompletedAt: userData.onboardingCompletedAt,
  //         welcomeBannerSeenAt: userData.welcomeBannerSeenAt,
  //         createdAt: userData.createdAt || new Date().toISOString(),
  //         updatedAt: userData.updatedAt || new Date().toISOString(),
  //       };

  //       setCurrentUser(currentUser);
  //       await recordLoginActivity(pendingUserId, true);
  //       navigate('/dashboard');
  //     } else {
  //       setError('Invalid verification code. Please try again.');
  //     }
  //   } catch (err: any) {
  //     console.error('2FA verification error:', err);
  //     setError('Verification failed. Please try again.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handle2FAVerification = async () => {
    if (!pendingUserId || !twoFactorCode || !pendingUserData) return;

    setLoading(true);
    setError('');

    try {
      let isValid = false;

      if (useBackupCode) {
        isValid = await totpService.verifyBackupCode(pendingUserId, twoFactorCode);
        if (!isValid) {
          setError('Invalid backup code. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        isValid = await totpService.verifyUserToken(pendingUserId, twoFactorCode);
        if (!isValid) {
          setError('Invalid verification code. Please try again.');
          setLoading(false);
          return;
        }
      }

      sessionStorage.removeItem('pending2FA');

      await signInWithEmailAndPassword(auth, email, password);

      setCurrentUser(pendingUserData);

      await updateDoc(doc(db, 'users', pendingUserId), {
        lastLogin: serverTimestamp()
      });

      await recordLoginActivity(pendingUserId, true);

      sessionStorage.removeItem('pendingUserId');
      sessionStorage.removeItem('pendingUserData');
      setShow2FA(false);
      setPendingUserId(null);
      setPendingUserData(null);
      setTwoFactorCode('');

      navigate('/dashboard');
    } catch (err: any) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Welcome Back
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Sign in to The Crew Academy
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
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

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 liquid-input"
                  placeholder="Enter your password"
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

            {show2FA && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-2 border-[#D71920]/30 rounded-xl p-5 bg-gradient-to-br from-red-50 to-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  {useBackupCode ? (
                    <Key className="w-6 h-6 text-[#D71920]" />
                  ) : (
                    <Shield className="w-6 h-6 text-[#D71920]" />
                  )}
                  <div>
                    <h3 className="font-bold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-600">
                      {useBackupCode ? 'Enter a backup code' : 'Enter code from your authenticator app'}
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => {
                    if (useBackupCode) {
                      setTwoFactorCode(e.target.value.toUpperCase().slice(0, 8));
                    } else {
                      setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    }
                  }}
                  placeholder={useBackupCode ? 'ABC12345' : '000000'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-mono text-xl text-center tracking-widest focus:border-[#D71920] outline-none mb-3"
                  maxLength={useBackupCode ? 8 : 6}
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setTwoFactorCode('');
                    setError('');
                  }}
                  className="w-full text-xs text-[#D71920] hover:underline mb-3"
                >
                  {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem('pending2FA');
                      sessionStorage.removeItem('pending2FAEmail');
                      sessionStorage.removeItem('pending2FAPassword');
                      sessionStorage.removeItem('pendingUserId');
                      sessionStorage.removeItem('pendingUserData');
                      setShow2FA(false);
                      setPendingUserId(null);
                      setPendingUserData(null);
                      setTwoFactorCode('');
                      setError('');
                      setUseBackupCode(false);
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handle2FAVerification}
                    disabled={loading || (useBackupCode ? twoFactorCode.length !== 8 : twoFactorCode.length !== 6)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl text-sm font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || show2FA}
              className="w-full liquid-button-primary text-white py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[#D71920] font-bold hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
