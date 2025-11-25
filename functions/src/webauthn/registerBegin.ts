import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { webauthnConfig } from './config';

export const registerBegin = functions.https.onRequest(async (req, res) => {
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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userData = userDoc.data();
    const userEmail = userData?.email || decodedToken.email || '';
    const userName = userData?.name || 'User';

    const devicesSnapshot = await userRef.collection('devices').where('revoked', '==', false).get();
    const existingDevices = devicesSnapshot.docs.map(doc => ({
      id: Buffer.from(doc.data().credentialId, 'base64url'),
      type: 'public-key' as const,
      transports: doc.data().transports || [],
    }));

    const options = await generateRegistrationOptions({
      rpName: webauthnConfig.rpName,
      rpID: webauthnConfig.rpID,
      userID: userId,
      userName: userEmail,
      userDisplayName: userName,
      timeout: webauthnConfig.timeout,
      attestationType: 'none',
      excludeCredentials: existingDevices,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    await db.collection('webauthn_challenges').doc(userId).set({
      challenge: options.challenge,
      type: 'register',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + webauthnConfig.challengeTTL),
    });

    res.status(200).json(options);
  } catch (error: any) {
    console.error('Registration begin error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});
