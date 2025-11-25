import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

function generateBackupCode(): string {
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export const generateBackupCodes = functions.https.onRequest(async (req, res) => {
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

    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = generateBackupCode();
      codes.push(code);
      hashedCodes.push(hashCode(code));
    }

    const db = admin.firestore();
    await db.collection('users').doc(userId).collection('security').doc('backup_codes').set({
      codes: hashedCodes,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: [],
    });

    await db.collection('audit_logs').add({
      userId,
      action: 'backup_codes_generated',
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true,
    });

    res.status(200).json({
      codes,
      message: 'Backup codes generated. Save these codes securely.',
    });
  } catch (error: any) {
    console.error('Generate backup codes error:', error);
    res.status(500).json({ error: 'Generation failed', details: error.message });
  }
});

export const verifyBackupCode = functions.https.onRequest(async (req, res) => {
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
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ error: 'Email and code required' });
      return;
    }

    const db = admin.firestore();
    const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();

    if (usersSnapshot.empty) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = usersSnapshot.docs[0].id;
    const backupCodesDoc = await db
      .collection('users')
      .doc(userId)
      .collection('security')
      .doc('backup_codes')
      .get();

    if (!backupCodesDoc.exists) {
      res.status(404).json({ error: 'No backup codes found' });
      return;
    }

    const backupData = backupCodesDoc.data();
    const hashedCode = hashCode(code);

    if (!backupData?.codes.includes(hashedCode)) {
      await db.collection('audit_logs').add({
        userId,
        action: 'backup_code_verify_failed',
        ip: req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: false,
      });

      res.status(400).json({ error: 'Invalid backup code' });
      return;
    }

    if (backupData.used.includes(hashedCode)) {
      res.status(400).json({ error: 'Backup code already used' });
      return;
    }

    const customToken = await admin.auth().createCustomToken(userId);

    await backupCodesDoc.ref.update({
      used: admin.firestore.FieldValue.arrayUnion(hashedCode),
    });

    await db.collection('audit_logs').add({
      userId,
      action: 'backup_code_login',
      ip: req.ip || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true,
    });

    res.status(200).json({
      verified: true,
      customToken,
      message: 'Backup code verified',
    });
  } catch (error: any) {
    console.error('Verify backup code error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});
