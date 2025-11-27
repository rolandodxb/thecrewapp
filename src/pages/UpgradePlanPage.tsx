import { Check, Crown, Shield, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';

export default function UpgradePlanPage() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Hide upgrade page for VIP users - they're already at max tier
  if (currentUser && currentUser.plan === 'vip') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're a VIP!</h2>
          <p className="text-gray-600 mb-6">
            You're already on the highest tier plan with access to all features. Enjoy your VIP benefits!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all shadow-lg font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleUpgrade = async (planName: string, priceId: string) => {
    if (!currentUser) {
      alert('Please log in to upgrade your plan');
      navigate('/login');
      return;
    }

    setLoading(planName);
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        alert('Please log in to upgrade your plan');
        navigate('/login');
        return;
      }

      const idToken = await firebaseUser.getIdToken();

      const successUrl = `${window.location.origin}/dashboard?upgrade=success`;
      const cancelUrl = `${window.location.origin}/upgrade-plan?upgrade=cancelled`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          price_id: priceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
          mode: 'subscription',
          firebase_uid: currentUser.uid
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (!data?.url) {
        throw new Error('No checkout URL returned');
      }

      window.location.href = data.url;
    } catch (error) {
      console.error('Upgrade error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate upgrade';
      alert(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      plan: 'free' as const,
      icon: Circle,
      price: '0',
      priceId: 'price_1SUxdh02SYry0M3gRlX4gFwt',
      color: 'gray',
      features: [
        'Access to dashboard',
        'Basic profile management',
        'Free courses',
        'Support chat',
        'Community access',
      ],
      disabled: ['AI Trainer', 'Open Day Simulator', 'Recruiter Intelligence', 'E2E Encrypted Chat'],
    },
    {
      name: 'Pro',
      plan: 'pro' as const,
      icon: Shield,
      price: '29',
      priceId: 'price_1SUxeo02SYry0M3gdhJU01Xr',
      color: 'blue',
      popular: true,
      features: [
        'Everything in Free',
        'AI CV Optimization',
        'Open Day Simulator',
        'English B2 Test',
        'Priority support',
        'Progress tracking',
      ],
      disabled: ['AI Chat Coach', 'Recruiter Intelligence', 'E2E Encrypted Chat'],
    },
    {
      name: 'VIP',
      plan: 'vip' as const,
      icon: Crown,
      price: '55',
      priceId: 'price_1SUxfV02SYry0M3gjVKsRY8l',
      color: 'gold',
      features: [
        'Everything in Pro',
        'AI Chat Coach',
        'Recruiter Intelligence',
        'E2E Encrypted Chat',
        'Past open day data',
        'Success candidate profiles',
        '1-on-1 mentor sessions',
        'VIP badge',
      ],
      disabled: [],
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-[#000000] mb-3">Choose Your Plan</h1>
        <p className="text-gray-600 text-lg">
          Select the perfect plan for your cabin crew journey
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {plans.map((planItem, index) => {
          const Icon = planItem.icon;
          const isCurrentPlan = currentUser?.plan === planItem.plan;

          return (
            <motion.div
              key={planItem.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-xl p-6 border-4 ${
                planItem.popular ? 'border-[#D71921]' : 'border-transparent'
              }`}
            >
              {planItem.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#D71921] to-[#B91518] text-white text-sm font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                    planItem.color === 'gray'
                      ? 'bg-gray-500'
                      : planItem.color === 'blue'
                      ? 'bg-blue-600'
                      : 'bg-gradient-to-br from-[#FFD700] to-[#D4AF37]'
                  }`}
                >
                  <Icon className={`w-8 h-8 ${planItem.color === 'gold' ? 'text-[#000000]' : 'text-white'}`} />
                </div>
                <h3 className="text-2xl font-bold text-[#000000] mb-2">{planItem.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span className="text-4xl font-bold text-[#000000]">${planItem.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>

                {isCurrentPlan ? (
                  <div className="px-6 py-3 bg-gray-200 text-gray-600 rounded-xl font-bold">
                    Current Plan
                  </div>
                ) : planItem.plan === 'free' ? (
                  <div className="px-6 py-3 bg-gray-200 text-gray-600 rounded-xl font-bold">
                    Free Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(planItem.name, planItem.priceId)}
                    disabled={loading === planItem.name}
                    className={`w-full px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                      planItem.color === 'blue'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gradient-to-r from-[#FFD700] to-[#D4AF37] hover:shadow-lg text-[#000000]'
                    }`}
                  >
                    {loading === planItem.name ? 'Processing...' : 'Upgrade Now'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="font-bold text-sm text-gray-700 mb-2">Includes:</div>
                {planItem.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-[#EADBC8] to-[#F5E6D3] rounded-2xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-[#000000] mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-[#000000] mb-2">Can I change plans later?</h3>
            <p className="text-sm text-gray-700">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[#000000] mb-2">Is there a refund policy?</h3>
            <p className="text-sm text-gray-700">
              We offer a 7-day money-back guarantee on all paid plans. No questions asked.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[#000000] mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-gray-700">
              We accept all major credit cards, PayPal, and Apple Pay for your convenience.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-[#000000] mb-2">Can I cancel anytime?</h3>
            <p className="text-sm text-gray-700">
              Absolutely! Cancel your subscription anytime with no penalties or fees.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
