import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Package, Wallet, CreditCard } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { getProduct, MarketplaceProduct } from '../services/marketplaceService';
import { createOrder, updateOrderPaymentStatus } from '../services/orderService';
import { getStripe, createMarketplacePaymentIntent, formatPrice } from '../services/stripeService';
import { walletService } from '../services/walletService';
import PaymentForm from '../components/marketplace/PaymentForm';

export default function MarketplaceCheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [product, setProduct] = useState<MarketplaceProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'mixed'>('card');
  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [processingWalletPayment, setProcessingWalletPayment] = useState(false);

  const stripePromise = getStripe();

  useEffect(() => {
    if (productId && currentUser) {
      loadProductAndCreateOrder();
    }
  }, [productId, currentUser]);

  const handlePaymentMethodChange = async (method: 'card' | 'wallet' | 'mixed') => {
    if (!product || !orderId || !currentUser) return;

    setPaymentMethod(method);

    const totalAmount = (product.price / 100) * quantity;

    if (method === 'wallet') {
      setWalletAmount(totalAmount);
      setCardAmount(0);
      setClientSecret('');
    } else if (method === 'card') {
      setWalletAmount(0);
      setCardAmount(totalAmount);

      if (!clientSecret) {
        try {
          console.log('🔄 Creating payment intent for card payment after method change');
          const paymentIntent = await createMarketplacePaymentIntent({
            firebase_buyer_uid: currentUser.uid,
            firebase_seller_uid: product.seller_id,
            firebase_order_id: orderId,
            product_id: product.id,
            product_title: product.title,
            product_type: product.product_type,
            quantity: quantity,
            amount: totalAmount,
            currency: product.currency,
            seller_email: product.seller_email
          });
          console.log('✅ Payment intent created:', paymentIntent.paymentIntentId);
          setClientSecret(paymentIntent.clientSecret);
        } catch (error) {
          console.error('❌ Failed to create payment intent:', error);
          alert('Failed to initialize payment. Please try again.');
        }
      }
    } else if (method === 'mixed') {
      setWalletAmount(walletBalance);
      setCardAmount(totalAmount - walletBalance);

      if (!clientSecret) {
        try {
          console.log('🔄 Creating payment intent for mixed payment after method change');
          const paymentIntent = await createMarketplacePaymentIntent({
            firebase_buyer_uid: currentUser.uid,
            firebase_seller_uid: product.seller_id,
            firebase_order_id: orderId,
            product_id: product.id,
            product_title: product.title,
            product_type: product.product_type,
            quantity: quantity,
            amount: totalAmount - walletBalance,
            currency: product.currency,
            seller_email: product.seller_email
          });
          console.log('✅ Payment intent created:', paymentIntent.paymentIntentId);
          setClientSecret(paymentIntent.clientSecret);
        } catch (error) {
          console.error('❌ Failed to create payment intent:', error);
          alert('Failed to initialize payment. Please try again.');
        }
      }
    }
  };

  const loadProductAndCreateOrder = async () => {
    if (!productId || !currentUser) return;

    setLoading(true);
    try {
      // Check if Stripe is configured
      const stripe = await stripePromise;
      if (!stripe) {
        alert('Payment system is not configured. Please contact support.');
        navigate('/marketplace');
        return;
      }

      console.log('🔍 Fetching product:', productId);
      const fetchedProduct = await getProduct(productId);

      if (!fetchedProduct) {
        console.error('❌ Product not found');
        alert('Product not found');
        navigate('/marketplace');
        return;
      }

      console.log('✅ Product loaded:', {
        id: fetchedProduct.id,
        title: fetchedProduct.title,
        price: fetchedProduct.price,
        currency: fetchedProduct.currency,
        type: fetchedProduct.product_type
      });

      if (fetchedProduct.status !== 'published') {
        alert('This product is not available for purchase');
        navigate('/marketplace');
        return;
      }

      if (fetchedProduct.product_type === 'physical' && fetchedProduct.stock_quantity === 0) {
        alert('This product is out of stock');
        navigate('/marketplace');
        return;
      }

      setProduct(fetchedProduct);

      // Load wallet balance
      console.log('💰 Loading wallet balance...');
      const wallet = await walletService.getWallet(currentUser.uid);
      if (wallet) {
        console.log('✅ Wallet balance:', wallet.balance);
        setWalletBalance(wallet.balance);
      } else {
        console.log('ℹ️ No wallet found, balance is 0');
      }

      console.log('📦 Creating order...');
      const newOrderId = await createOrder({
        buyer_id: currentUser.uid,
        buyer_name: currentUser.name || 'Anonymous',
        buyer_email: currentUser.email || '',
        seller_id: fetchedProduct.seller_id,
        seller_name: fetchedProduct.seller_name,
        seller_email: fetchedProduct.seller_email,
        product_id: fetchedProduct.id,
        product_title: fetchedProduct.title,
        product_type: fetchedProduct.product_type,
        product_image: fetchedProduct.images[0],
        quantity: quantity,
        price: fetchedProduct.price,
        currency: fetchedProduct.currency
      });

      console.log('✅ Order created:', newOrderId);
      setOrderId(newOrderId);

      // Price is already in cents from Firestore, so divide by 100 to get dollars
      const priceInDollars = fetchedProduct.price / 100;
      const totalAmount = priceInDollars * quantity;

      console.log('💵 Price calculation:', {
        priceInCents: fetchedProduct.price,
        priceInDollars,
        quantity,
        totalAmount,
        walletBalance: wallet?.balance || 0
      });

      // Determine default payment method based on wallet balance
      if (wallet && wallet.balance >= totalAmount) {
        console.log('💰 Full wallet payment selected');
        setPaymentMethod('wallet');
        setWalletAmount(totalAmount);
        setCardAmount(0);
      } else if (wallet && wallet.balance > 0) {
        console.log('💳 Mixed payment selected (wallet + card)');
        setPaymentMethod('mixed');
        setWalletAmount(wallet.balance);
        setCardAmount(totalAmount - wallet.balance);

        // Create payment intent for remaining amount
        console.log('🔄 Creating payment intent for mixed payment:', {
          amount: totalAmount - wallet.balance,
          currency: fetchedProduct.currency
        });
        const paymentIntent = await createMarketplacePaymentIntent({
          firebase_buyer_uid: currentUser.uid,
          firebase_seller_uid: fetchedProduct.seller_id,
          firebase_order_id: newOrderId,
          product_id: fetchedProduct.id,
          product_title: fetchedProduct.title,
          product_type: fetchedProduct.product_type,
          quantity: quantity,
          amount: totalAmount - wallet.balance,
          currency: fetchedProduct.currency,
          seller_email: fetchedProduct.seller_email
        });
        console.log('✅ Mixed payment intent created:', paymentIntent.paymentIntentId);
        setClientSecret(paymentIntent.clientSecret);
      } else {
        console.log('💳 Card payment selected');
        setPaymentMethod('card');
        setCardAmount(totalAmount);

        console.log('🔄 Creating payment intent for card payment:', {
          amount: totalAmount,
          currency: fetchedProduct.currency,
          productPrice: fetchedProduct.price,
          quantity
        });
        const paymentIntent = await createMarketplacePaymentIntent({
          firebase_buyer_uid: currentUser.uid,
          firebase_seller_uid: fetchedProduct.seller_id,
          firebase_order_id: newOrderId,
          product_id: fetchedProduct.id,
          product_title: fetchedProduct.title,
          product_type: fetchedProduct.product_type,
          quantity: quantity,
          amount: totalAmount,
          currency: fetchedProduct.currency,
          seller_email: fetchedProduct.seller_email
        });
        console.log('✅ Card payment intent created:', paymentIntent.paymentIntentId);
        setClientSecret(paymentIntent.clientSecret);
      }

      console.log('🎉 Checkout initialization complete!');
    } catch (error: any) {
      console.error('❌ Error loading checkout:', error);
      const errorMessage = error.message || 'Failed to load checkout';
      console.error('Full error details:', {
        error,
        errorMessage: error.message,
        errorStack: error.stack,
        productId,
        currentUserId: currentUser?.uid,
        hasProduct: !!product,
        paymentMethod,
        hasClientSecret: !!clientSecret
      });
      alert(`Unable to initialize checkout: ${errorMessage}\n\nPlease check console for details or contact support.`);
      // Don't navigate away, stay on page to show error details
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!currentUser || !product || !orderId) return;

    setProcessingWalletPayment(true);
    try {
      const totalAmount = (product.price / 100) * quantity;

      // Deduct from wallet
      await walletService.deductFunds(
        currentUser.uid,
        totalAmount,
        'purchase',
        `Purchase: ${product.title}`,
        { orderId, productId: product.id }
      );

      // Update order status
      await updateOrderPaymentStatus(orderId, 'completed');

      setPaymentSuccess(true);
      setTimeout(() => {
        navigate(`/marketplace/orders`);
      }, 3000);
    } catch (error: any) {
      console.error('Wallet payment error:', error);
      alert(`Payment failed: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingWalletPayment(false);
    }
  };

  const handleMixedPaymentSuccess = async (paymentIntentId: string) => {
    if (!currentUser || !product || !orderId) return;

    try {
      // Deduct wallet portion
      await walletService.deductFunds(
        currentUser.uid,
        walletAmount,
        'purchase',
        `Partial payment for: ${product.title}`,
        { orderId, productId: product.id, paymentIntentId }
      );

      setPaymentSuccess(true);
      setTimeout(() => {
        navigate(`/marketplace/orders`);
      }, 3000);
    } catch (error: any) {
      console.error('Mixed payment error:', error);
      alert(`Payment completed but wallet update failed: ${error.message}`);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment succeeded:', paymentIntentId);

    if (paymentMethod === 'mixed') {
      handleMixedPaymentSuccess(paymentIntentId);
    } else {
      setPaymentSuccess(true);
      setTimeout(() => {
        navigate(`/marketplace/orders`);
      }, 3000);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please login to complete your purchase</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load product details</p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = product.price * quantity;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/marketplace/product/${product.id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Product
        </button>

        {/* Success Overlay */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/90 backdrop-blur-xl rounded-xl p-8 max-w-md text-center border border-white/30 shadow-2xl"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-4">
                  Your order has been confirmed. Redirecting to orders page...
                </p>
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/30 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              {/* Product */}
              <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={product.images[0] || ''}
                  alt={product.title}
                  className="w-20 h-20 rounded-lg object-cover bg-gray-100"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 capitalize">{product.product_type}</p>
                </div>
              </div>

              {/* Quantity */}
              {product.product_type === 'physical' && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock_quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {product.stock_quantity && (
                    <p className="text-xs text-gray-500 mt-1">
                      {product.stock_quantity} available
                    </p>
                  )}
                </div>
              )}

              {/* Wallet Balance - Always Show */}
              <div className={`mb-4 p-4 rounded-lg border ${
                walletBalance > 0
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className={`w-5 h-5 ${walletBalance > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${walletBalance > 0 ? 'text-green-900' : 'text-gray-600'}`}>Wallet Balance</span>
                </div>
                <p className={`text-2xl font-bold ${walletBalance > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  ${walletBalance.toFixed(2)}
                </p>
                {walletBalance === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    <a href="/wallet" className="text-blue-600 hover:underline">Top up your wallet</a> to use it for payments
                  </p>
                )}
                {walletBalance > 0 && walletBalance < (totalAmount / 100) && (
                  <p className="text-xs text-green-600 mt-1">
                    Remaining: ${Math.max(0, (totalAmount / 100) - walletBalance).toFixed(2)} to pay
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Price</span>
                  <span>{formatPrice(product.price, product.currency)}</span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Quantity</span>
                    <span>× {quantity}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(totalAmount, product.currency)}</span>
                </div>
              </div>

              {/* Seller */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Sold by</p>
                <div className="flex items-center gap-2">
                  {product.seller_photo_url ? (
                    <img
                      src={product.seller_photo_url}
                      alt={product.seller_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                      {product.seller_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-gray-900">{product.seller_name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/20 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-6 lg:p-8 relative z-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>

              {/* Payment Method Selection */}
              {walletBalance > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Wallet Payment Option */}
                    {walletBalance >= (totalAmount / 100) && (
                      <button
                        type="button"
                        onClick={() => handlePaymentMethodChange('wallet')}
                        className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                          paymentMethod === 'wallet'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <Wallet className={`w-6 h-6 ${paymentMethod === 'wallet' ? 'text-green-600' : 'text-gray-600'}`} />
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">Pay with Wallet</div>
                          <div className="text-xs text-gray-600">Balance: ${walletBalance.toFixed(2)}</div>
                        </div>
                      </button>
                    )}

                    {/* Card Payment Option */}
                    <button
                      type="button"
                      onClick={() => handlePaymentMethodChange('card')}
                      className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">Pay with Card</div>
                        <div className="text-xs text-gray-600">Credit/Debit Card</div>
                      </div>
                    </button>

                    {/* Mixed Payment Option */}
                    {walletBalance < (totalAmount / 100) && walletBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => handlePaymentMethodChange('mixed')}
                        className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all md:col-span-2 ${
                          paymentMethod === 'mixed'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex gap-2">
                          <Wallet className={`w-6 h-6 ${paymentMethod === 'mixed' ? 'text-purple-600' : 'text-gray-600'}`} />
                          <CreditCard className={`w-6 h-6 ${paymentMethod === 'mixed' ? 'text-purple-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-gray-900">Wallet + Card</div>
                          <div className="text-xs text-gray-600">
                            ${walletBalance.toFixed(2)} from wallet + ${((totalAmount / 100) - walletBalance).toFixed(2)} from card
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Form or Wallet Confirmation */}
              {paymentMethod === 'wallet' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">Payment Summary</h3>
                    <div className="space-y-1 text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Amount to pay:</span>
                        <span className="font-semibold">${(totalAmount / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wallet balance:</span>
                        <span className="font-semibold">${walletBalance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-green-300">
                        <span>Remaining balance:</span>
                        <span className="font-semibold">${(walletBalance - (totalAmount / 100)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleWalletPayment}
                    disabled={processingWalletPayment}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processingWalletPayment ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Complete Purchase with Wallet
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  {paymentMethod === 'mixed' && (
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h3 className="font-semibold text-purple-900 mb-2">Split Payment</h3>
                      <div className="space-y-1 text-sm text-purple-800">
                        <div className="flex justify-between">
                          <span>From wallet:</span>
                          <span className="font-semibold">${walletBalance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>From card:</span>
                          <span className="font-semibold">${((totalAmount / 100) - walletBalance).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'stripe',
                        },
                      }}
                    >
                      <PaymentForm
                        amount={paymentMethod === 'mixed' ? Math.round((totalAmount - (walletBalance * 100))) : totalAmount}
                        currency={product.currency}
                        clientSecret={clientSecret}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Initializing payment...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
