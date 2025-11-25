import { useState, useEffect } from 'react';
import { Calendar, DollarSign, ChevronDown, ChevronUp, QrCode as QrCodeIcon, Wallet as WalletIcon, CheckCircle, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  getAllActivities,
  getMyActivities,
  joinFreeActivity,
  joinPaidActivity,
  Activity,
  ActivityRegistration
} from '../services/simpleActivityService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/marketplace/PaymentForm';
import { walletService } from '../services/walletService';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StudentEventsPage() {
  const { currentUser } = useApp();
  const [allEvents, setAllEvents] = useState<Activity[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<ActivityRegistration[]>([]);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stripe' | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadData();
      loadWallet();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [events, registrations] = await Promise.all([
        getAllActivities(),
        getMyActivities(currentUser.uid)
      ]);
      setAllEvents(events);
      setMyRegistrations(registrations);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWallet = async () => {
    if (!currentUser) return;

    try {
      const wallet = await walletService.getWallet(currentUser.uid);
      if (wallet) {
        setWalletBalance(wallet.balance);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const isRegistered = (activityId: string) => {
    return myRegistrations.some(reg => reg.activityId === activityId);
  };

  const getRegistration = (activityId: string) => {
    return myRegistrations.find(reg => reg.activityId === activityId);
  };

  const handleJoinFree = async (activity: Activity) => {
    if (!currentUser || processing) return;

    setProcessing(activity.id);
    try {
      const result = await joinFreeActivity(
        activity.id,
        currentUser.uid,
        currentUser.name,
        currentUser.email
      );

      if (result.success) {
        await loadData();
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to join activity');
    } finally {
      setProcessing(null);
    }
  };

  const handleSelectPaymentMethod = (activityId: string, method: 'wallet' | 'stripe') => {
    setPaymentMethod(method);
    if (method === 'stripe') {
      setShowPaymentForm(activityId);
      initiateStripePayment(activityId);
    }
  };

  const initiateStripePayment = async (activityId: string) => {
    if (!currentUser) return;

    const activity = allEvents.find(a => a.id === activityId);
    if (!activity) return;

    setProcessing(activityId);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketplace-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          firebase_buyer_uid: currentUser.uid,
          firebase_seller_uid: activity.creatorId,
          firebase_order_id: `activity-${activityId}-${Date.now()}`,
          product_id: activityId,
          product_title: activity.name,
          product_type: 'service',
          quantity: 1,
          amount: activity.price,
          currency: 'usd',
          seller_email: activity.creatorEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to initialize payment');
      setShowPaymentForm(null);
    } finally {
      setProcessing(null);
    }
  };

  const handleStripePaymentSuccess = async (activityId: string) => {
    if (!currentUser) return;

    const activity = allEvents.find(a => a.id === activityId);
    if (!activity) return;

    const result = await joinPaidActivity(
      activityId,
      currentUser.uid,
      currentUser.name,
      currentUser.email,
      true
    );

    if (result.success) {
      await loadData();
      setShowPaymentForm(null);
      setClientSecret(null);
      setPaymentMethod(null);
      alert('Successfully joined activity!');
    }
  };

  const handleStripePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
    setShowPaymentForm(null);
    setClientSecret(null);
    setPaymentMethod(null);
  };

  const handleJoinPaidWallet = async (activity: Activity) => {
    if (!currentUser || processing) return;

    if (walletBalance < activity.price) {
      alert('Insufficient wallet balance. Please choose card payment or top up your wallet.');
      return;
    }

    if (!confirm(`This will deduct $${activity.price} from your wallet. Continue?`)) {
      return;
    }

    setProcessing(activity.id);
    try {
      await walletService.deductFromWallet(
        currentUser.uid,
        activity.price,
        'activity',
        `Joined activity: ${activity.name}`,
        activity.id
      );

      const result = await joinPaidActivity(
        activity.id,
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        true
      );

      if (result.success) {
        await loadData();
        await loadWallet();
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Failed to process payment: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessing(null);
    }
  };

  const toggleExpanded = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">Browse and join upcoming activities</p>
        </motion.div>

        {myRegistrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Registered Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRegistrations.map((reg, index) => {
                const activity = allEvents.find(a => a.id === reg.activityId);
                if (!activity) return null;

                return (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-lg"
                  >
                    {activity.imageBase64 && (
                      <img
                        src={activity.imageBase64}
                        alt={activity.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="font-bold text-gray-900 mb-2">{activity.name}</h3>
                    <div className="flex items-center justify-between">
                      {reg.checkedIn ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Checked In
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                          Registered
                        </span>
                      )}
                      <button
                        onClick={() => toggleExpanded(activity.id)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all"
                      >
                        View QR
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedEvent === activity.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-gray-200"
                        >
                          <div className="bg-white p-4 rounded-lg">
                            <img
                              src={reg.qrCode}
                              alt="QR Code"
                              className="w-full max-w-[200px] mx-auto"
                            />
                            <p className="text-center text-sm text-gray-600 mt-2">
                              Show this QR code to the event host
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Events</h2>

          {allEvents.filter(e => !isRegistered(e.id)).length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/30">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Events Available</h3>
              <p className="text-gray-600">Check back later for upcoming activities</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {allEvents.filter(e => !isRegistered(e.id)).map((event, index) => {
                const registered = isRegistered(event.id);
                const registration = getRegistration(event.id);

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/30 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex flex-col md:flex-row">
                      {event.imageBase64 && (
                        <div className="md:w-80 h-48 md:h-auto">
                          <img
                            src={event.imageBase64}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.name}</h3>
                            <p className="text-gray-600 mb-3">{event.description}</p>
                            <div className="flex items-center gap-3">
                              {event.price > 0 ? (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                  ${event.price}
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                  FREE
                                </span>
                              )}
                              {registered && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                                  Registered
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => toggleExpanded(event.id)}
                            className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all flex items-center gap-2"
                          >
                            {expandedEvent === event.id ? (
                              <>
                                Close <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                View More <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedEvent === event.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-200 p-6 bg-gray-50"
                        >
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 mb-4">Event Details</h4>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-5 h-5" />
                                  <span>
                                    Created {new Date(event.createdAt.toDate()).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <DollarSign className="w-5 h-5" />
                                  <span>
                                    {event.price > 0 ? `$${event.price} per person` : 'Free to join'}
                                  </span>
                                </div>
                              </div>

                              {event.price > 0 && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <WalletIcon className="w-5 h-5 text-blue-600" />
                                    <span className="font-semibold text-blue-900">Wallet Balance</span>
                                  </div>
                                  <p className="text-2xl font-bold text-blue-900">${walletBalance.toFixed(2)}</p>
                                  {walletBalance < event.price && (
                                    <p className="text-sm text-red-600 mt-2">
                                      Insufficient balance. Please top up your wallet.
                                    </p>
                                  )}
                                </div>
                              )}

                              {!registered && (
                                <div className="mt-6 space-y-4">
                                  {event.price === 0 ? (
                                    <button
                                      onClick={() => handleJoinFree(event)}
                                      disabled={processing === event.id}
                                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      {processing === event.id ? (
                                        <>
                                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                          Joining...
                                        </>
                                      ) : (
                                        'Join Free Event'
                                      )}
                                    </button>
                                  ) : showPaymentForm !== event.id ? (
                                    <div className="space-y-3">
                                      <p className="text-sm font-semibold text-gray-700">Choose Payment Method:</p>
                                      <button
                                        onClick={() => handleJoinPaidWallet(event)}
                                        disabled={processing === event.id || walletBalance < event.price}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                      >
                                        {processing === event.id ? (
                                          <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            <WalletIcon className="w-5 h-5" />
                                            Pay with Wallet (${walletBalance.toFixed(2)})
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => handleSelectPaymentMethod(event.id, 'stripe')}
                                        disabled={processing === event.id}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                      >
                                        <CreditCard className="w-5 h-5" />
                                        Pay with Card
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                                      <h5 className="text-lg font-bold text-gray-900 mb-4">Complete Payment</h5>
                                      {clientSecret ? (
                                        <Elements stripe={stripePromise}>
                                          <PaymentForm
                                            amount={Math.round(event.price * 100)}
                                            currency="usd"
                                            onSuccess={() => handleStripePaymentSuccess(event.id)}
                                            onError={handleStripePaymentError}
                                            clientSecret={clientSecret}
                                          />
                                        </Elements>
                                      ) : (
                                        <div className="flex items-center justify-center py-8">
                                          <div className="w-8 h-8 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin" />
                                        </div>
                                      )}
                                      <button
                                        onClick={() => {
                                          setShowPaymentForm(null);
                                          setClientSecret(null);
                                          setPaymentMethod(null);
                                        }}
                                        className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {registered && registration && (
                              <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Your QR Code</h4>
                                <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                                  <img
                                    src={registration.qrCode}
                                    alt="Your QR Code"
                                    className="w-full max-w-[250px] mx-auto mb-4"
                                  />
                                  <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">
                                      Show this QR code to the event host for check-in
                                    </p>
                                    {registration.checkedIn ? (
                                      <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                                        <CheckCircle className="w-5 h-5" />
                                        Already Checked In
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                                        <QrCodeIcon className="w-5 h-5" />
                                        Ready for Check-In
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
