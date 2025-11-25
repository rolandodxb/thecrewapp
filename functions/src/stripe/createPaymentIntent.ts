import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

interface CreatePaymentIntentData {
  orderId: string;
  amount: number;
  currency: string;
  productId: string;
  productTitle: string;
}

export const createPaymentIntent = functions.https.onCall(
  async (data: CreatePaymentIntentData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create payment intent'
      );
    }

    const { orderId, amount, currency, productId, productTitle } = data;

    if (!orderId || !amount || !currency || !productId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required payment data'
      );
    }

    if (amount < 50) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Amount must be at least $0.50'
      );
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          productId,
          productTitle,
          userId: context.auth.uid,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const db = admin.firestore();
      await db.collection('marketplace_orders').doc(orderId).update({
        payment_intent_id: paymentIntent.id,
        payment_status: 'processing',
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to create payment intent: ${error.message}`
      );
    }
  }
);
