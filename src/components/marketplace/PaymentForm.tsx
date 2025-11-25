import { useState, useEffect, FormEvent } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, CreditCard, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrencySymbol, formatCurrencyAmount } from '../../utils/currencyDetection';

interface PaymentFormProps {
  amount: number;
  currency: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  clientSecret: string;
}

export default function PaymentForm({
  amount,
  currency,
  onSuccess,
  onError,
  clientSecret
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [processing3DSecure, setProcessing3DSecure] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/marketplace/orders`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent) {
        if (paymentIntent.status === 'requires_action') {
          setProcessing3DSecure(true);
        }

        if (paymentIntent.status === 'succeeded') {
          onSuccess(paymentIntent.id);
        } else if (paymentIntent.status === 'processing') {
          onSuccess(paymentIntent.id);
        } else {
          throw new Error('Payment was not successful');
        }
      } else {
        throw new Error('Payment intent not found');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
      setProcessing3DSecure(false);
    }
  };

  const formatAmount = () => {
    return formatCurrencyAmount(amount / 100, currency);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm opacity-90">Total Amount</div>
          <div className="flex items-center gap-2 text-xs opacity-75">
            <Globe className="w-3 h-3" />
            <span>{currency.toUpperCase()}</span>
          </div>
        </div>
        <div className="text-4xl font-bold mb-2">{formatAmount()}</div>
        <div className="text-sm opacity-75 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>Secure payment with 3D Secure protection</span>
        </div>
      </div>

      <AnimatePresence>
        {processing3DSecure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Verifying Payment</h3>
              <p className="text-gray-600 mb-6">
                Please complete the verification with your card issuer. This may open in a new window or popup.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-xs text-gray-500 mt-4">Secured by 3D Secure</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="relative z-20">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Details
        </label>
        <div id="payment-element" className="relative p-4 border-2 border-gray-300/50 rounded-lg bg-white/50 backdrop-blur-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 transition-all min-h-[200px] z-30">
          <PaymentElement
            onReady={() => setPaymentElementReady(true)}
            options={{
              layout: 'tabs',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-700 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Encrypted & Secure
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading || !paymentElementReady}
        className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pay {formatAmount()}
          </>
        )}
      </button>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>PCI-DSS Compliant Payment Processing</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Apple Pay & Google Pay Supported</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>3D Secure Authentication Available</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Multi-Currency Support</span>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center border-t border-gray-200 pt-2">
          Powered by Stripe • Your card information is never stored on our servers
        </p>
      </div>
    </form>
  );
}
