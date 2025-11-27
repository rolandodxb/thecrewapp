import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, AlertTriangle, Download, RefreshCw, CreditCard } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  created: number;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  plan: {
    amount: number;
    interval: string;
  };
}

interface StripeInvoice {
  id: string;
  customer: string;
  amount_paid: number;
  status: string;
  created: number;
}

export default function FinancePanel() {
  const [customers, setCustomers] = useState<StripeCustomer[]>([]);
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [invoices, setInvoices] = useState<StripeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'subscriptions' | 'invoices' | 'dashboard'>('overview');

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    const customersQuery = query(
      collection(db, 'stripe', 'customers', 'list'),
      orderBy('created', 'desc'),
      limit(50)
    );

    const subscriptionsQuery = query(
      collection(db, 'stripe', 'subscriptions', 'list'),
      where('status', '==', 'active'),
      orderBy('created', 'desc'),
      limit(50)
    );

    const invoicesQuery = query(
      collection(db, 'stripe', 'invoices', 'list'),
      orderBy('created', 'desc'),
      limit(50)
    );

    unsubscribers.push(
      onSnapshot(customersQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as StripeCustomer);
        setCustomers(data);
        setLoading(false);
      }, (error) => {
        console.error('Error loading customers:', error);
        setLoading(false);
      })
    );

    unsubscribers.push(
      onSnapshot(subscriptionsQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as StripeSubscription);
        setSubscriptions(data);
      }, (error) => {
        console.error('Error loading subscriptions:', error);
      })
    );

    unsubscribers.push(
      onSnapshot(invoicesQuery, (snapshot) => {
        const data = snapshot.docs.map(doc => doc.data() as StripeInvoice);
        setInvoices(data);
      }, (error) => {
        console.error('Error loading invoices:', error);
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const calculateMRR = () => {
    return subscriptions.reduce((total, sub) => {
      if (sub.status === 'active' && sub.plan) {
        const monthlyAmount = sub.plan.interval === 'year'
          ? sub.plan.amount / 12
          : sub.plan.amount;
        return total + monthlyAmount;
      }
      return total;
    }, 0) / 100;
  };

  const calculateTodayRevenue = () => {
    const today = new Date().setHours(0, 0, 0, 0) / 1000;
    return invoices
      .filter(inv => inv.status === 'paid' && inv.created >= today)
      .reduce((total, inv) => total + inv.amount_paid, 0) / 100;
  };

  const getFailedPayments = () => {
    return invoices.filter(inv => inv.status === 'failed').length;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-light border border-gray-200 rounded-xl p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading financial data...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light border border-gray-200 rounded-xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Finance & Billing</h2>
              <p className="text-xs text-gray-600">Revenue, subscriptions, and payments</p>
            </div>
          </div>
          <button className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold transition flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-4 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'customers'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-700'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'subscriptions'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-700'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'invoices'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-700'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'dashboard'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-700'
            }`}
          >
            Stripe Dashboard
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-light/50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-gray-600">MRR</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">${calculateMRR().toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Monthly Recurring</p>
              </div>

              <div className="glass-light/50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-gray-600">Today</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">${calculateTodayRevenue().toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Revenue Today</p>
              </div>

              <div className="glass-light/50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#5A6B75]" />
                  <span className="text-xs font-semibold text-gray-600">Active</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                <p className="text-xs text-gray-500 mt-1">Subscriptions</p>
              </div>

              <div className="glass-light/50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-gray-600">Failed</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{getFailedPayments()}</p>
                <p className="text-xs text-gray-500 mt-1">Payments</p>
              </div>
            </div>

            {customers.length === 0 && subscriptions.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">No financial data yet</p>
                <p className="text-xs text-gray-500">Stripe data will appear here once webhook is configured</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {customers.length === 0 ? (
              <p className="text-center py-8 text-gray-600">No customers found</p>
            ) : (
              customers.map((customer) => (
                <div key={customer.id} className="glass-light/50 rounded-xl p-3 border border-gray-200 hover:border-gray-300 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{customer.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-600">{customer.email}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(customer.created * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {subscriptions.length === 0 ? (
              <p className="text-center py-8 text-gray-600">No active subscriptions</p>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="glass-light/50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {sub.status}
                    </span>
                    <p className="text-sm font-bold text-gray-800">
                      ${(sub.plan?.amount || 0) / 100}/{sub.plan?.interval || 'mo'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Renews: {new Date(sub.current_period_end * 1000).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {invoices.length === 0 ? (
              <p className="text-center py-8 text-gray-600">No invoices found</p>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="glass-light/50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : invoice.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {invoice.status}
                      </span>
                      <p className="text-xs text-gray-500">
                        {new Date(invoice.created * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      ${(invoice.amount_paid / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Stripe Dashboard</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Access your full Stripe dashboard to manage payments, customers, and billing.
                  </p>
                  <a
                    href="https://dashboard.stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Open Stripe Dashboard
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="glass-light rounded-xl border border-gray-200 p-12 text-center" style={{ height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div>
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Stripe Dashboard</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Stripe prevents embedding their dashboard in iframes for security reasons.
                  Click the button above to access your full Stripe dashboard in a new tab.
                </p>
                <a
                  href="https://dashboard.stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-base font-semibold transition shadow-lg"
                >
                  Open Stripe Dashboard
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
