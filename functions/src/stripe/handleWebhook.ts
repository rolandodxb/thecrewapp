import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import * as admin from 'firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  const db = admin.firestore();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;
        const productId = paymentIntent.metadata.productId;

        if (orderId) {
          const orderRef = db.collection('marketplace_orders').doc(orderId);
          const orderDoc = await orderRef.get();

          if (orderDoc.exists()) {
            const orderData = orderDoc.data()!;

            await orderRef.update({
              payment_status: 'completed',
              completed_at: admin.firestore.Timestamp.now(),
              payment_method: paymentIntent.payment_method_types[0],
            });

            const productRef = db.collection('marketplace_products').doc(productId);
            await productRef.update({
              sales_count: admin.firestore.FieldValue.increment(1),
            });

            if (orderData.product_type === 'physical') {
              await productRef.update({
                stock_quantity: admin.firestore.FieldValue.increment(-orderData.quantity),
              });
            }

            if (orderData.product_type === 'digital' && orderData.digital_file_url) {
              const expiresAt = new Date();
              expiresAt.setHours(expiresAt.getHours() + 72);

              await orderRef.update({
                delivery_status: 'delivered',
                digital_download_url: orderData.digital_file_url,
                digital_download_expires: admin.firestore.Timestamp.fromDate(expiresAt),
              });
            }

            console.log('Payment succeeded for order:', orderId);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (orderId) {
          await db.collection('marketplace_orders').doc(orderId).update({
            payment_status: 'failed',
          });

          console.log('Payment failed for order:', orderId);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        const ordersQuery = await db
          .collection('marketplace_orders')
          .where('payment_intent_id', '==', paymentIntentId)
          .limit(1)
          .get();

        if (!ordersQuery.empty) {
          const orderDoc = ordersQuery.docs[0];
          await orderDoc.ref.update({
            payment_status: 'refunded',
          });

          console.log('Order refunded:', orderDoc.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(500).send(`Webhook handler failed: ${error.message}`);
  }
});
