import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { webauthnConfig, getOrigins } from './config';
import type { RegistrationResponseJSON } from '@simplewebauthn/typescript-types';

export const registerComplete = functions.https.onRequest(async (req, res) => {
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

    const { response, deviceName } = req.body as {
      response: RegistrationResponseJSON;
      deviceName?: string;
    };

    if (!response) {
      res.status(400).json({ error: 'Missing response' });
      return;
    }

    const db = admin.firestore();
    const challengeDoc = await db.collection('webauthn_challenges').doc(userId).get();

    if (!challengeDoc.exists) {
      res.status(400).json({ error: 'Challenge not found' });
      return;
    }

    const challengeData = challengeDoc.data();
    if (challengeData?.type !== 'register') {
      res.status(400).json({ error: 'Invalid challenge type' });
      return;
    }

    if (challengeData.expiresAt.toMillis() < Date.now()) {
      await challengeDoc.ref.delete();
      res.status(400).json({ error: 'Challenge expired' });
      return;
    }

    const expectedChallenge = challengeData.challenge;

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOrigins(),
      expectedRPID: webauthnConfig.rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'Verification failed' });
      return;
    }

    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;

    const deviceId = Buffer.from(credentialID).toString('base64url');
    const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64');
    const credentialIdBase64 = Buffer.from(credentialID).toString('base64url');

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';

    await db.collection('users').doc(userId).collection('devices').doc(deviceId).set({
      credentialId: credentialIdBase64,
      publicKey: publicKeyBase64,
      signCount: counter,
      deviceName: deviceName || `Device ${new Date().toLocaleDateString()}`,
      userAgent,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      revoked: false,
      transports: response.response.transports || [],
    });

    await db.collection('audit_logs').add({
      userId,
      action: 'device_register',
      deviceId,
      deviceName: deviceName || 'Unknown Device',
      ip,
      userAgent,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true,
    });

    await challengeDoc.ref.delete();

    res.status(200).json({
      verified: true,
      deviceId,
      message: 'Device registered successfully',
    });
  } catch (error: any) {
    console.error('Registration complete error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});
