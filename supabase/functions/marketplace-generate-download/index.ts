import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID')!;
const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')!;
const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')!.replace(/\\n/g, '\n');

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

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

async function updateFirestoreOrder(orderId: string, downloadUrl: string, expiresAt: string): Promise<boolean> {
  try {
    const accessToken = await getFirebaseAccessToken();

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/marketplace_orders/${orderId}`;

    const response = await fetch(`${firestoreUrl}?updateMask.fieldPaths=digital_download_url&updateMask.fieldPaths=digital_download_expires&updateMask.fieldPaths=download_count`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          digital_download_url: { stringValue: downloadUrl },
          digital_download_expires: { timestampValue: expiresAt },
          download_count: { integerValue: '0' }
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to update Firestore order:', error);
      return false;
    }

    console.log(`Successfully updated Firestore order ${orderId} with download URL`);
    return true;
  } catch (error) {
    console.error('Error updating Firestore:', error);
    return false;
  }
}

interface GenerateDownloadRequest {
  firebase_order_id: string;
  firebase_buyer_uid: string;
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const { firebase_order_id, firebase_buyer_uid }: GenerateDownloadRequest = await req.json();

    if (!firebase_order_id || !firebase_buyer_uid) {
      return corsResponse({ error: 'Missing required parameters' }, 400);
    }

    console.log(`Generating download link for order: ${firebase_order_id}`);

    const { data: paymentIntent, error: paymentError } = await supabase
      .from('marketplace_payment_intents')
      .select('*')
      .eq('firebase_order_id', firebase_order_id)
      .eq('firebase_buyer_uid', firebase_buyer_uid)
      .eq('status', 'succeeded')
      .maybeSingle();

    if (paymentError) {
      console.error('Failed to fetch payment intent:', paymentError);
      return corsResponse({ error: 'Failed to verify payment' }, 500);
    }

    if (!paymentIntent) {
      return corsResponse({ error: 'Payment not found or not completed' }, 404);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const downloadToken = crypto.randomUUID();
    const downloadUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/marketplace-download?token=${downloadToken}&order=${firebase_order_id}`;

    const success = await updateFirestoreOrder(
      firebase_order_id,
      downloadUrl,
      expiresAt.toISOString()
    );

    if (!success) {
      return corsResponse({ error: 'Failed to generate download link' }, 500);
    }

    return corsResponse({
      downloadUrl,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error: any) {
    console.error(`Download generation error: ${error.message}`, error);
    return corsResponse({ error: error.message }, 500);
  }
});
