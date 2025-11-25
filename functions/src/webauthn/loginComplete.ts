import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { webauthnConfig, getOrigins } from './config';
import type { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';

export const loginComplete = functions.https.onRequest(async (req, res) => {
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
    const { response, userId } = req.body as {
      response: AuthenticationResponseJSON;
      userId: string;
    };

    if (!response || !userId) {
      res.status(400).json({ error: 'Missing response or userId' });
      return;
    }

    const db = admin.firestore();
    const challengeDoc = await db.collection('webauthn_challenges').doc(userId).get();

    if (!challengeDoc.exists) {
      res.status(400).json({ error: 'Challenge not found' });
      return;
    }

    const challengeData = challengeDoc.data();
    if (challengeData?.type !== 'login') {
      res.status(400).json({ error: 'Invalid challenge type' });
      return;
    }

    if (challengeData.expiresAt.toMillis() < Date.now()) {
      await challengeDoc.ref.delete();
      res.status(400).json({ error: 'Challenge expired' });
      return;
    }

    const expectedChallenge = challengeData.challenge;
    const credentialIdBase64 = response.id;

    const deviceDoc = await db
      .collection('users')
      .doc(userId)
      .collection('devices')
      .doc(Buffer.from(response.rawId, 'base64url').toString('base64url'))
      .get();

    if (!deviceDoc.exists) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const deviceData = deviceDoc.data();
    if (deviceData?.revoked) {
      res.status(403).json({ error: 'Device has been revoked' });
      return;
    }

    const authenticator = {
      credentialID: Buffer.from(deviceData!.credentialId, 'base64url'),
      credentialPublicKey: Buffer.from(deviceData!.publicKey, 'base64'),
      counter: deviceData!.signCount,
      transports: deviceData!.transports || [],
    };

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOrigins(),
      expectedRPID: webauthnConfig.rpID,
      authenticator,
      requireUserVerification: false,
    });

    if (!verification.verified) {
      await db.collection('audit_logs').add({
        userId,
        action: 'device_login_failed',
        deviceId: deviceDoc.id,
        ip: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: false,
        reason: 'Verification failed',
      });

      res.status(400).json({ error: 'Verification failed' });
      return;
    }

    await deviceDoc.ref.update({
      signCount: verification.authenticationInfo.newCounter,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    });

    const customToken = await admin.auth().createCustomToken(userId);

    await db.collection('audit_logs').add({
      userId,
      action: 'device_login',
      deviceId: deviceDoc.id,
      deviceName: deviceData!.deviceName,
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true,
    });

    await challengeDoc.ref.delete();

    res.status(200).json({
      verified: true,
      customToken,
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login complete error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});
