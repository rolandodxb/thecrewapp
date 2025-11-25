import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')!;
const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;
const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getFirebaseAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: firebaseClientEmail,
    sub: firebaseClientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email'
  };

  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadBase64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signatureInput = `${headerBase64}.${payloadBase64}`;

  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = firebasePrivateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(signatureInput)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signatureBase64}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function updateFirestoreOrder(orderId: string, paymentDetails: any): Promise<boolean> {
  try {
    const accessToken = await getFirebaseAccessToken();

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/marketplace_orders/${orderId}`;

    const response = await fetch(`${firestoreUrl}?updateMask.fieldPaths=payment_status&updateMask.fieldPaths=payment_intent_id&updateMask.fieldPaths=payment_method&updateMask.fieldPaths=completed_at&updateMask.fieldPaths=metadata`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          payment_status: { stringValue: paymentDetails.status },
          payment_intent_id: { stringValue: paymentDetails.payment_intent_id },
          payment_method: { stringValue: paymentDetails.payment_method || 'card' },
          completed_at: { timestampValue: new Date().toISOString() },
          metadata: {
            mapValue: {
              fields: {
                stripe_customer_id: { stringValue: paymentDetails.stripe_customer_id || '' },
                stripe_charge_id: { stringValue: paymentDetails.stripe_charge_id || '' }
              }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to update Firestore order:', error);
      return false;
    }

    console.log(`Successfully updated Firestore order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error updating Firestore:', error);
    return false;
  }
}

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    if (paymentIntent.metadata?.marketplace_order === 'true') {
      console.info('Processing marketplace payment intent');
      await handleMarketplacePayment(paymentIntent);
      return;
    }

    if (paymentIntent.invoice !== null) {
      return;
    }
  }

  if (!('customer' in stripeData)) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    const subscription = subscriptions.data[0];

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}

async function handleMarketplacePayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    const {
      id: payment_intent_id,
      amount,
      currency,
      customer,
      charges,
      metadata
    } = paymentIntent;

    const firebase_order_id = metadata.firebase_order_id;

    if (!firebase_order_id) {
      console.error('No firebase_order_id in payment intent metadata');
      return;
    }

    console.log(`Processing marketplace payment for order: ${firebase_order_id}`);

    const charge = charges.data[0];
    const paymentMethod = charge?.payment_method_details;

    const { error: updateError } = await supabase
      .from('marketplace_payment_intents')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('payment_intent_id', payment_intent_id);

    if (updateError) {
      console.error('Failed to update payment intent status:', updateError);
    }

    const paymentDetails = {
      status: 'completed',
      payment_intent_id,
      payment_method: paymentMethod?.type || 'card',
      stripe_customer_id: customer as string,
      stripe_charge_id: charge?.id || ''
    };

    const success = await updateFirestoreOrder(firebase_order_id, paymentDetails);

    if (success) {
      console.log(`Successfully processed marketplace payment for order ${firebase_order_id}`);
    } else {
      console.error(`Failed to update Firebase for order ${firebase_order_id}`);
    }

  } catch (error) {
    console.error('Error handling marketplace payment:', error);
  }
}