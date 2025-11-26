import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const processModerationQueue = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '1GB',
    maxInstances: 20,
    minInstances: 1,
  })
  .pubsub.schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      const batchSize = 10;

      const snapshot = await db
        .collection('moderationQueue')
        .where('status', '==', 'pending')
        .orderBy('priority', 'desc')
        .orderBy('timestamp', 'asc')
        .limit(batchSize)
        .get();

      if (snapshot.empty) {
        console.log('No pending items in moderation queue');
        return null;
      }

      const batch = db.batch();
      const items: any[] = [];

      snapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() };
        items.push(item);
        batch.update(doc.ref, { status: 'processing' });
      });

      await batch.commit();

      const updateBatch = db.batch();

      for (const item of items) {
        try {
          const result = await moderateContent(item.content);

          updateBatch.update(db.collection('moderationQueue').doc(item.id), {
            status: result.allowed ? 'approved' : 'rejected',
            result,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          if (item.contentType === 'chat') {
            const messageQuery = await db
              .collectionGroup('messages')
              .where('messageId', '==', item.contentId)
              .limit(1)
              .get();

            if (!messageQuery.empty) {
              const messageRef = messageQuery.docs[0].ref;
              updateBatch.update(messageRef, {
                moderationStatus: result.allowed ? 'approved' : 'hidden',
                moderationReason: result.reason,
              });
            }
          } else if (item.contentType === 'post') {
            updateBatch.update(db.collection('communityPosts').doc(item.contentId), {
              moderationStatus: result.allowed ? 'approved' : 'hidden',
              moderationReason: result.reason,
            });
          }

          if (!result.allowed) {
            await db.collection('moderationLogs').add({
              userId: item.userId,
              userName: item.userName,
              contentType: item.contentType,
              contentId: item.contentId,
              content: item.content,
              action: result.action,
              reason: result.reason,
              severity: result.severity,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              status: 'flagged',
            });

            if (result.action === 'ban' || result.action === 'block') {
              await db.collection('users').doc(item.userId).update({
                suspended: true,
                suspensionReason: result.reason,
                suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error);
          updateBatch.update(db.collection('moderationQueue').doc(item.id), {
            status: 'pending',
            retryCount: admin.firestore.FieldValue.increment(1),
          });
        }
      }

      await updateBatch.commit();

      console.log(`Processed ${items.length} items from moderation queue`);
      return null;
    } catch (error) {
      console.error('Error in moderation queue processor:', error);
      return null;
    }
  });

async function moderateContent(content: string): Promise<any> {
  const badWords = ['spam', 'scam', 'fraud', 'fuck', 'shit', 'bitch'];

  for (const word of badWords) {
    if (content.toLowerCase().includes(word)) {
      return {
        allowed: false,
        action: 'block',
        reason: 'Contains inappropriate language',
        severity: 'HIGH',
        confidence: 1.0,
        categories: ['harassment'],
      };
    }
  }

  const urlCount = (content.match(/https?:\/\//g) || []).length;
  if (urlCount > 5) {
    return {
      allowed: false,
      action: 'block',
      reason: 'Too many URLs (possible spam)',
      severity: 'MEDIUM',
      confidence: 0.9,
      categories: ['spam'],
    };
  }

  return {
    allowed: true,
    action: 'allow',
    reason: 'Content is appropriate',
    severity: 'LOW',
    confidence: 0.95,
    categories: [],
  };
}

export const processModerationQueueHttp = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB',
  })
  .https.onRequest(async (req, res) => {
    try {
      await processModerationQueue.run();
      res.status(200).send({ success: true, message: 'Queue processed' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send({ success: false, error: String(error) });
    }
  });
