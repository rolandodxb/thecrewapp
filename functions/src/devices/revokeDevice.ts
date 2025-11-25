import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const revokeDevice = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
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

    const { deviceId } = req.body;

    if (!deviceId) {
      res.status(400).json({ error: 'Device ID required' });
      return;
    }

    const db = admin.firestore();
    const deviceRef = db.collection('users').doc(userId).collection('devices').doc(deviceId);
    const deviceDoc = await deviceRef.get();

    if (!deviceDoc.exists) {
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const deviceData = deviceDoc.data();

    await deviceRef.update({
      revoked: true,
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedBy: userId,
    });

    await db.collection('audit_logs').add({
      userId,
      action: 'device_revoke',
      deviceId,
      deviceName: deviceData?.deviceName || 'Unknown',
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true,
    });

    res.status(200).json({
      success: true,
      message: 'Device revoked successfully',
    });
  } catch (error: any) {
    console.error('Revoke device error:', error);
    res.status(500).json({ error: 'Revoke failed', details: error.message });
  }
});
