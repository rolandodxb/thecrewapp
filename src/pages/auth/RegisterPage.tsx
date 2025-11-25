import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plane, User, Mail, Lock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { countries } from '../../data/countries';
import { supabase } from '../../lib/supabase';
import { referralService } from '../../services/referralService';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  const priceId = searchParams.get('priceId');
  const referralCode = searchParams.get('ref');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [expectations, setExpectations] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentUser } = useApp();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        name,
        role: 'student',
        plan: 'free',
        country,
        bio,
        expectations,
        photo_base64: '',
        points: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const newUser = {
        uid: user.uid,
        email,
        name,
        role: 'student' as const,
        plan: 'free' as const,
        country,
        bio,
        photoURL: '',
      };

      setCurrentUser(newUser);

      if (referralCode) {
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json');
          const ipData = await ipResponse.json();
          await referralService.recordConversion(
            referralCode,
            user.uid,
            name,
            email,
            ipData.ip
          );
        } catch (error) {
          // Silent error handling for referral tracking
        }
      }

      if (selectedPlan && selectedPlan !== 'free' && priceId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token || user.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              price_id: priceId,
              success_url: `${window.location.origin}/dashboard?upgrade=success&plan=${selectedPlan}`,
              cancel_url: `${window.location.origin}/upgrade?upgrade=cancelled`,
              mode: 'subscription',
            }),
          });

          const data = await response.json();

          if (data.url) {
            window.location.href = data.url;
            return;
          }
        } catch (checkoutError) {
          // Silent error handling for checkout
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Registration failed. Please try again.';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.displayName || 'User',
          role: 'student',
          plan: selectedPlan || 'free',
          country: '',
          bio: '',
          expectations: '',
          photo_base64: user.photoURL || '',
          photoURL: user.photoURL || '',
          points: 0,
          verified: user.emailVerified,
          provider: 'google',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      const userData = userDoc.exists() ? userDoc.data() : await getDoc(userDocRef).then(d => d.data());

      setCurrentUser({
        uid: user.uid,
        email: userData?.email || user.email,
        name: userData?.name || user.displayName || 'User',
        role: (userData?.role || 'student') as 'student' | 'mentor' | 'governor',
        plan: (userData?.plan || 'free') as 'free' | 'pro' | 'vip',
        country: userData?.country || '',
        bio: userData?.bio || '',
        expectations: userData?.expectations || '',
        photoURL: userData?.photo_base64 || user.photoURL || '',
        hasCompletedOnboarding: userData?.hasCompletedOnboarding || false,
        hasSeenWelcomeBanner: userData?.hasSeenWelcomeBanner || false,
        onboardingCompletedAt: userData?.onboardingCompletedAt,
        welcomeBannerSeenAt: userData?.welcomeBannerSeenAt,
        createdAt: userData?.createdAt || new Date().toISOString(),
        updatedAt: userData?.updatedAt || new Date().toISOString(),
      });

      if (selectedPlan && selectedPlan !== 'free' && priceId) {
        navigate(`/upgrade?plan=${selectedPlan}&priceId=${priceId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to sign up with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="liquid-crystal-panel p-6 md:p-8">
          <div className="flex justify-center mb-6">
            <img
              src="/Crews (2).png"
              alt="The Crew Academy"
              className="h-16 w-auto"
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-2">
            Join The Crew Academy
          </h1>
          <p className="text-center text-sm md:text-base text-gray-600 mb-4">
            Start your cabin crew journey
          </p>

          {referralCode && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-3 mb-4">
              <p className="text-center text-sm font-semibold text-gray-900">
                🎉 Referral Code Applied!
              </p>
              <p className="text-center text-xs text-gray-600 mt-1">
                You and your friend will both earn rewards
              </p>
            </div>
          )}

          {selectedPlan && selectedPlan !== 'free' && (
            <div className="bg-gradient-to-r from-[#D71920]/10 to-[#CBA135]/10 border border-[#D71920]/20 rounded-xl p-3 mb-4">
              <p className="text-center text-sm font-semibold text-gray-900">
                Selected Plan: <span className="text-[#D71920] uppercase">{selectedPlan}</span>
              </p>
              <p className="text-center text-xs text-gray-600 mt-1">
                You'll be redirected to checkout after registration
              </p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 liquid-input"
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Email Address *
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
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 liquid-input"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Country *
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 liquid-input appearance-none bg-white"
                >
                  <option value="">Select your country</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Brief Description About Yourself
              </label>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 liquid-input resize-none"
                  placeholder="Tell us a bit about yourself..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                What I Expect From This Academy
              </label>
              <div className="relative">
                <textarea
                  value={expectations}
                  onChange={(e) => setExpectations(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 liquid-input resize-none"
                  placeholder="What are your goals and expectations?"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full liquid-button-primary text-gray-900 py-3.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
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
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#D71920] font-bold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
