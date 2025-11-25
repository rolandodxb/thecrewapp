import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, Shield, Sparkles, Brain, BookOpen, MessageCircle, Check, ChevronRight, Award, Users, Target, TrendingUp, Star, Globe } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const features = [
    {
      icon: <BookOpen className="w-10 h-10" />,
      title: 'Expert-Designed Courses',
      description: 'Structured learning paths covering grooming, service excellence, safety protocols, and interview mastery'
    },
    {
      icon: <Brain className="w-10 h-10" />,
      title: 'AI-Powered Coaching',
      description: 'Get instant feedback on your CV, practice interviews with AI, and receive personalized improvement recommendations'
    },
    {
      icon: <Sparkles className="w-10 h-10" />,
      title: 'Realistic Simulations',
      description: 'Experience authentic Open Day scenarios, English assessments, and group exercises in our immersive simulator'
    },
    {
      icon: <MessageCircle className="w-10 h-10" />,
      title: 'Mentor Community',
      description: 'Connect with experienced cabin crew professionals and get guidance from those who have been through the journey'
    },
    {
      icon: <Award className="w-10 h-10" />,
      title: 'Track Your Progress',
      description: 'Monitor your learning journey with detailed analytics, certificates, and milestone achievements'
    },
    {
      icon: <Target className="w-10 h-10" />,
      title: 'Personalized Roadmap',
      description: 'Receive a customized training plan based on your goals, experience level, and target airlines'
    }
  ];

  const stats = [
    { number: '95%', label: 'Success Rate' },
    { number: '24/7', label: 'Support Available' }
  ];

  const testimonials = [
    {
      name: 'Sarah Ahmed',
      role: 'Cabin Crew Professional',
      image: 'https://images.pexels.com/photos/3228213/pexels-photo-3228213.jpeg?auto=compress&cs=tinysrgb&w=200',
      quote: 'The Crew Academy helped me prepare for every stage of the assessment. The AI trainer was a game-changer!'
    },
    {
      name: 'Maria Santos',
      role: 'Emirates crew',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200',
      quote: 'I went from zero confidence to landing my dream job. The mentorship program is invaluable.'
    },
    {
      name: 'Aisha Khan',
      role: 'Emirates crew',
      image: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=200',
      quote: 'The simulation module gave me the confidence I needed. I knew exactly what to expect on the day!'
    }
  ];

  const handlePlanSelection = async (planName: string, priceId: string) => {
    setProcessingPlan(planName);

    if (planName === 'Free') {
      navigate('/register');
      return;
    }

    try {
      const checkoutUrl = `${window.location.origin}/register?plan=${planName.toLowerCase()}&priceId=${priceId}`;
      navigate(`/register?plan=${planName.toLowerCase()}&priceId=${priceId}`);
    } catch (error) {
      console.error('Plan selection error:', error);
      navigate('/register');
    } finally {
      setProcessingPlan(null);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      priceId: 'price_1SUxdh02SYry0M3gRlX4gFwt',
      features: [
        'Access to basic courses',
        'Community chat access',
        'Course progress tracking',
        'Mobile-friendly platform',
        'Email support'
      ],
      cta: 'Start Free',
      highlighted: false,
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      priceId: 'price_1SUxeo02SYry0M3gdhJU01Xr',
      features: [
        'Everything in Free',
        'AI Trainer & CV optimizer',
        'Open Day Simulator access',
        'Advanced interview prep',
        'Priority support',
        'Downloadable resources',
        'Certificate of completion'
      ],
      cta: 'Go Pro',
      highlighted: true,
      popular: true
    },
    {
      name: 'VIP',
      price: '$55',
      period: 'per month',
      priceId: 'price_1SUxfV02SYry0M3gjVKsRY8l',
      features: [
        'Everything in Pro',
        '1-on-1 mentor sessions (monthly)',
        'Personalized career roadmap',
        'Direct recruiter connections',
        'Lifetime course access',
        'VIP community & events',
        'Interview guarantee support'
      ],
      cta: 'Go VIP',
      highlighted: false,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EADBC8] via-[#F5E6D3] to-[#E8D5C4]">
      <nav className="glass-nav sticky top-0 z-50 border-b border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img src="/Crews (2) copy.png" alt="The Crew Academy" className="h-14 w-auto" />
            </div>
            <div className="flex flex-row items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/staff-code')}
                className="px-4 sm:px-6 py-2.5 text-gray-700 font-semibold hover:text-[#D71920] transition rounded-lg hover:bg-white/50 text-sm sm:text-base"
              >
                Staff Login
              </button>
              <button
                onClick={() => navigate('/waitlist')}
                className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition text-sm sm:text-base whitespace-nowrap"
              >
                Join Waitlist
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/436413/pexels-photo-436413.jpeg?auto=compress&cs=tinysrgb&w=1920')] opacity-5 bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#D71920]/10 to-[#CBA135]/10 border border-[#D71920]/20 rounded-full mb-8"
            >
              <Sparkles className="w-4 h-4 text-[#D71920]" />
              <span className="text-sm font-semibold text-gray-700">Trusted by aspiring cabin crew worldwide</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight px-4">
              Your Dream Career
              <span className="block mt-2 bg-gradient-to-r from-[#D71920] via-[#E63946] to-[#CBA135] bg-clip-text text-transparent">
                Starts Here
              </span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10 leading-relaxed px-4">
              Join The Crew Academy and master every skill needed to become elite cabin crew.
              From AI-powered training to real recruiter connections - we have got you covered.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 px-4">
              <button
                onClick={() => navigate('/waitlist')}
                className="group px-10 py-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold text-lg hover:shadow-2xl transform hover:-translate-y-1 transition flex items-center gap-2"
              >
                Join Waitlist
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/staff-code')}
                className="px-10 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:border-[#D71920] hover:text-[#D71920] hover:shadow-lg transition"
              >
                Staff Login
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#D71920] to-[#CBA135] bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 bg-[#D71920]/10 rounded-full mb-4"
            >
              <span className="text-sm font-semibold text-[#D71920]">COMPREHENSIVE TRAINING</span>
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Industry-leading tools and resources designed by cabin crew professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group glass-card p-6 sm:p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 bg-white rounded-full shadow-sm mb-4"
            >
              <span className="text-sm font-semibold text-[#D71920]">SUCCESS STORIES</span>
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Join Thousands of Successful Graduates
            </h2>
            <p className="text-xl text-gray-600">
              Real people, real results, real cabin crew careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 sm:p-8 hover:shadow-2xl transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#CBA135] text-[#CBA135]" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 bg-[#CBA135]/10 rounded-full mb-4"
            >
              <span className="text-sm font-semibold text-[#CBA135]">FLEXIBLE PRICING</span>
            </motion.div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade anytime. No hidden fees, cancel whenever you want.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative glass-card rounded-3xl p-6 sm:p-8 border-2 transition-all hover:shadow-2xl ${
                  plan.highlighted
                    ? 'border-[#D71920] shadow-xl md:scale-105'
                    : 'border-white/30 hover:border-[#D71920]/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white text-sm font-bold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelection(plan.name, plan.priceId)}
                  disabled={processingPlan === plan.name}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white hover:shadow-xl transform hover:-translate-y-1'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {processingPlan === plan.name ? 'Processing...' : plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-20 h-20 mx-auto mb-6 text-[#CBA135]" />
            <h2 className="text-4xl font-bold mb-6">Your Data is Safe & Secure</h2>
            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              We take your privacy seriously. All personal information, CVs, and training data are encrypted
              end-to-end and stored securely. We never share your data with third parties without your explicit consent.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Shield className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className="font-bold text-lg">256-bit Encryption</p>
                <p className="text-sm text-gray-400 mt-2">Bank-level security</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Globe className="w-10 h-10 mx-auto mb-3 text-blue-400" />
                <p className="font-bold text-lg">GDPR Compliant</p>
                <p className="text-sm text-gray-400 mt-2">EU data protection</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <Check className="w-10 h-10 mx-auto mb-3 text-green-400" />
                <p className="font-bold text-lg">Secure Cloud</p>
                <p className="text-sm text-gray-400 mt-2">99.9% uptime SLA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="The Crew Academy" className="h-12 w-auto" />
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">&copy; 2024 The Crew Academy. All rights reserved.</p>
              <div className="flex items-center justify-center md:justify-end gap-4 text-sm text-gray-500">
                <button onClick={() => navigate('/privacy')} className="hover:text-white transition">Privacy Policy</button>
                <span>•</span>
                <button onClick={() => navigate('/terms')} className="hover:text-white transition">Terms of Service</button>
                <span>•</span>
                <button onClick={() => navigate('/contact')} className="hover:text-white transition">Contact Us</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
