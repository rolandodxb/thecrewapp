import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { webauthnConfig } from './config';

export const loginBegin = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { email, userId } = req.body;

    if (!email && !userId) {
      res.status(400).json({ error: 'Email or userId required' });
      return;
    }

    const db = admin.firestore();
    let uid = userId;

    if (!uid && email) {
      const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (usersSnapshot.empty) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      uid = usersSnapshot.docs[0].id;
    }

    const devicesSnapshot = await db
      .collection('users')
      .doc(uid)
      .collection('devices')
      .where('revoked', '==', false)
      .get();

    if (devicesSnapshot.empty) {
      res.status(404).json({ error: 'No registered devices found' });
      return;
    }

    const allowCredentials = devicesSnapshot.docs.map(doc => ({
      id: Buffer.from(doc.data().credentialId, 'base64url'),
      type: 'public-key' as const,
      transports: doc.data().transports || [],
    }));

    const options = await generateAuthenticationOptions({
      rpID: webauthnConfig.rpID,
      timeout: webauthnConfig.timeout,
      allowCredentials,
      userVerification: 'preferred',
    });

    await db.collection('webauthn_challenges').doc(uid).set({
      challenge: options.challenge,
      type: 'login',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + webauthnConfig.challengeTTL),
    });

    res.status(200).json({ ...options, userId: uid });
  } catch (error: any) {
    console.error('Login begin error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});
