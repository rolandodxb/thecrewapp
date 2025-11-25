import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface GenerateDownloadLinkData {
  orderId: string;
}

export const generateDownloadLink = functions.https.onCall(
  async (data: GenerateDownloadLinkData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { orderId } = data;

    if (!orderId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Order ID is required'
      );
    }

    try {
      const db = admin.firestore();
      const orderRef = db.collection('marketplace_orders').doc(orderId);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Order not found'
        );
      }

      const orderData = orderDoc.data()!;

      if (orderData.buyer_id !== context.auth.uid) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You do not have permission to access this order'
        );
      }

      if (orderData.payment_status !== 'completed') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Payment must be completed before downloading'
        );
      }

      if (orderData.download_count >= orderData.max_downloads) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Download limit reached'
        );
      }

      const now = admin.firestore.Timestamp.now();
      if (orderData.digital_download_expires && orderData.digital_download_expires < now) {
        throw new functions.https.HttpsError(
          'deadline-exceeded',
          'Download link has expired'
        );
      }

      if (!orderData.digital_download_url) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Download URL not available'
        );
      }

      return {
        downloadUrl: orderData.digital_download_url,
        expiresAt: orderData.digital_download_expires.toDate().toISOString(),
      };
    } catch (error: any) {
      console.error('Error generating download link:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        `Failed to generate download link: ${error.message}`
      );
    }
  }
);
