import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import OpenAI from 'openai';

admin.initializeApp();

const db = admin.firestore();

const openai = new OpenAI({
  apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY,
});

interface GovernorCommandRequest {
  command: string;
  args?: Record<string, any>;
}

interface GovernorCommandResult {
  success: boolean;
  message: string;
  details?: any;
}

async function logAuditEvent(
  eventType: string,
  actorId: string,
  actorRole: string,
  details: any
): Promise<void> {
  await db.collection('audit').add({
    eventType,
    actorId,
    actorRole,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    details,
  });
}

async function logGovernorCommand(
  command: string,
  args: Record<string, any> | undefined,
  issuedBy: string,
  result: GovernorCommandResult
): Promise<void> {
  await db.collection('governorCommands').add({
    command,
    args,
    issuedBy,
    issuedAt: admin.firestore.FieldValue.serverTimestamp(),
    result,
  });
}

async function hasPermission(uid: string, permission: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) return false;

  const userData = userDoc.data();
  if (!userData) return false;

  if (userData.role === 'governor') return true;

  const roleDoc = await db.collection('governorRoles').doc(userData.role).get();
  if (!roleDoc.exists) return false;

  const roleData = roleDoc.data();
  return roleData?.permissions?.[permission] === true;
}

export const runGovernorCommand = functions.https.onCall(async (data: GovernorCommandRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const { command, args } = data;

  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'User not found');
  }

  const userData = userDoc.data();
  if (!userData) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid user data');
  }

  const canManageSystem = await hasPermission(uid, 'manageSystem');
  if (!canManageSystem && userData.role !== 'governor') {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  let result: GovernorCommandResult;

  try {
    const [action, ...params] = command.split(' ');

    switch (action) {
      case 'disable':
      case 'enable': {
        const featureName = params[0];
        const enabled = action === 'enable';

        const systemControlRef = db.collection('systemControl').doc('status');
        const systemControl = await systemControlRef.get();

        if (!systemControl.exists) {
          throw new Error('System control not found');
        }

        const features = systemControl.data()?.features || {};
        features[featureName] = enabled;

        await systemControlRef.update({
          features,
          updatedBy: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: `Feature '${featureName}' ${enabled ? 'enabled' : 'disabled'} successfully`,
          details: { feature: featureName, enabled },
        };

        await logAuditEvent('feature_toggle', uid, userData.role, {
          feature: featureName,
          enabled,
        });
        break;
      }

      case 'announce': {
        if (!args) throw new Error('Announcement args required');

        const { message, type, expiresAt } = args;

        await db.collection('systemControl').doc('status').update({
          announcement: {
            active: true,
            message,
            type: type || 'info',
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: expiresAt || null,
          },
          updatedBy: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: 'Announcement published successfully',
          details: { message, type },
        };

        await logAuditEvent('announcement_created', uid, userData.role, { message, type });
        break;
      }

      case 'maintenance': {
        const mode = params[0];
        const maintenanceMessage = params.slice(1).join(' ') || 'System maintenance in progress';

        await db.collection('systemControl').doc('status').update({
          maintenance: {
            active: mode === 'on',
            message: maintenanceMessage,
            startedAt: mode === 'on' ? admin.firestore.FieldValue.serverTimestamp() : null,
          },
          updatedBy: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: `Maintenance mode ${mode === 'on' ? 'enabled' : 'disabled'}`,
          details: { active: mode === 'on', message: maintenanceMessage },
        };

        await logAuditEvent('maintenance_toggle', uid, userData.role, { active: mode === 'on' });
        break;
      }

      case 'downgradeUser': {
        if (!args || !args.uid || !args.toPlan) {
          throw new Error('downgradeUser requires {uid, toPlan}');
        }

        const targetUserRef = db.collection('users').doc(args.uid);
        await targetUserRef.update({
          plan: args.toPlan,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: `User downgraded to ${args.toPlan}`,
          details: { targetUid: args.uid, newPlan: args.toPlan },
        };

        await logAuditEvent('user_downgraded', uid, userData.role, {
          targetUid: args.uid,
          newPlan: args.toPlan,
        });
        break;
      }

      case 'lockContent':
      case 'unlockContent': {
        if (!args || !args.courseId) {
          throw new Error(`${action} requires {courseId}`);
        }

        const locked = action === 'lockContent';
        await db.collection('courses').doc(args.courseId).update({
          locked,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: `Course ${locked ? 'locked' : 'unlocked'} successfully`,
          details: { courseId: args.courseId, locked },
        };

        await logAuditEvent('course_lock_toggle', uid, userData.role, {
          courseId: args.courseId,
          locked,
        });
        break;
      }

      case 'revokeDownloads': {
        const revoked = args?.revoked === true;

        await db.collection('systemControl').doc('status').update({
          'features.downloads': !revoked,
          updatedBy: uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: `Downloads ${revoked ? 'revoked' : 'enabled'}`,
          details: { downloadsEnabled: !revoked },
        };

        await logAuditEvent('downloads_toggle', uid, userData.role, { enabled: !revoked });
        break;
      }

      case 'suspendUser': {
        if (!args || !args.uid) {
          throw new Error('suspendUser requires {uid}');
        }

        await db.collection('users').doc(args.uid).update({
          status: 'suspended',
          suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
          suspendedBy: uid,
        });

        result = {
          success: true,
          message: 'User suspended successfully',
          details: { targetUid: args.uid },
        };

        await logAuditEvent('user_suspended', uid, userData.role, { targetUid: args.uid });
        break;
      }

      case 'forceLogout': {
        if (!args || !args.uid) {
          throw new Error('forceLogout requires {uid}');
        }

        await db.collection('users').doc(args.uid).update({
          forceLogout: admin.firestore.FieldValue.serverTimestamp(),
        });

        result = {
          success: true,
          message: 'User will be forced to logout',
          details: { targetUid: args.uid },
        };

        await logAuditEvent('force_logout', uid, userData.role, { targetUid: args.uid });
        break;
      }

      default:
        result = {
          success: false,
          message: `Unknown command: ${action}`,
        };
    }

    await logGovernorCommand(command, args, uid, result);
    return result;
  } catch (error: any) {
    result = {
      success: false,
      message: error.message || 'Command execution failed',
      details: { error: error.toString() },
    };

    await logGovernorCommand(command, args, uid, result);
    throw new functions.https.HttpsError('internal', result.message);
  }
});

export const triggerManualBackup = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;

  const canManageSystem = await hasPermission(uid, 'manageSystem');
  if (!canManageSystem) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  try {
    const backupId = `backup_${Date.now()}`;

    await db.collection('backups').doc(backupId).set({
      triggeredBy: uid,
      triggeredAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      location: null,
      notes: 'Manual backup triggered',
    });

    await logAuditEvent('backup_triggered', uid, 'governor', { backupId });

    return {
      success: true,
      message: 'Backup initiated successfully',
      backupId,
      note: 'Firestore exports require GCS configuration. Set up Firebase CLI with: firebase firestore:export gs://your-bucket',
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const aiAssistantProxy = functions.https.onCall(async (data: { prompt: string; context?: any }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;

  const aiControlDoc = await db.collection('systemControl').doc('ai').get();
  const aiEnabled = aiControlDoc.exists ? aiControlDoc.data()?.enabled !== false : true;

  if (!aiEnabled) {
    throw new functions.https.HttpsError('failed-precondition', 'AI features are currently disabled by system administrator');
  }

  try {
    const { prompt, context: userContext } = data;

    if (!prompt || prompt.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Prompt cannot be empty');
    }

    const systemPrompt = `You are an operations assistant for Crews Academy, a flight crew training platform.
You help governors manage the system, analyze data, and make informed decisions.
Provide concise, actionable insights. Current context: ${JSON.stringify(userContext || {})}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content || 'No response generated';

    await db.collection('aiUsageLogs').add({
      userId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      promptLength: prompt.length,
      modelUsed: completion.model,
      tokensUsed: completion.usage?.total_tokens || 0,
      success: true,
    });

    await logAuditEvent('ai_assistant_query', uid, 'user', { promptLength: prompt.length, tokensUsed: completion.usage?.total_tokens });

    return {
      success: true,
      reply,
      tokensUsed: completion.usage?.total_tokens || 0,
    };
  } catch (error: any) {
    console.error('AI Assistant Error:', error);

    await db.collection('aiUsageLogs').add({
      userId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      promptLength: data.prompt?.length || 0,
      modelUsed: 'gpt-4-turbo-preview',
      tokensUsed: 0,
      success: false,
      error: error.message,
    });

    throw new functions.https.HttpsError('internal', 'AI request failed: ' + error.message);
  }
});

export const fetchLargeMetrics = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;

  const canViewAudit = await hasPermission(uid, 'viewAudit');
  if (!canViewAudit) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  try {
    const [usersSnapshot, coursesSnapshot, conversationsSnapshot, supportTicketsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('courses').get(),
      db.collection('conversations').get(),
      db.collection('supportTickets').get(),
    ]);

    const usersByRole: Record<string, number> = {};
    const usersByPlan: Record<string, number> = {};

    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      usersByRole[data.role] = (usersByRole[data.role] || 0) + 1;
      usersByPlan[data.plan] = (usersByPlan[data.plan] || 0) + 1;
    });

    const metrics = {
      totalUsers: usersSnapshot.size,
      totalCourses: coursesSnapshot.size,
      totalConversations: conversationsSnapshot.size,
      totalSupportTickets: supportTicketsSnapshot.size,
      usersByRole,
      usersByPlan,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('metrics').doc('summary').set(metrics);

    return { success: true, metrics };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

const stripe = new Stripe(functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export const stripeWebhookHandler = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    res.status(500).send('Webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        await db.collection('stripe').doc('customers').collection('list').doc(customer.id).set({
          ...customer,
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await db.collection('stripe').doc('invoices').collection('list').doc(invoice.id).set({
          ...invoice,
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await logAuditEvent('payment_succeeded', 'system', 'stripe', {
          invoiceId: invoice.id,
          amount: invoice.amount_paid,
          customer: invoice.customer,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await db.collection('stripe').doc('invoices').collection('list').doc(invoice.id).set({
          ...invoice,
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await logAuditEvent('payment_failed', 'system', 'stripe', {
          invoiceId: invoice.id,
          customer: invoice.customer,
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await db.collection('stripe').doc('payments').collection('list').doc(charge.id).set({
          ...charge,
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await logAuditEvent('charge_refunded', 'system', 'stripe', {
          chargeId: charge.id,
          amount: charge.amount_refunded,
        });
        break;
      }

      case 'subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await db.collection('stripe').doc('subscriptions').collection('list').doc(subscription.id).set({
          ...subscription,
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await logAuditEvent('dispute_created', 'system', 'stripe', {
          disputeId: dispute.id,
          amount: dispute.amount,
          reason: dispute.reason,
        });
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

export const syncStripeToFirestore = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const canManageBilling = await hasPermission(context.auth.uid, 'manageBilling');
  if (!canManageBilling) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  try {
    const customers = await stripe.customers.list({ limit: 100 });

    for (const customer of customers.data) {
      await db.collection('stripe').doc('customers').collection('list').doc(customer.id).set({
        ...customer,
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, message: `Synced ${customers.data.length} customers` };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

///////////////////////////////////////////////////////////////////////////
// SOCIAL COMMUNITY CLOUD FUNCTIONS
///////////////////////////////////////////////////////////////////////////

interface PointsRateLimits {
  messageSent: { count: number; lastReset: number };
  attachmentUpload: { count: number; lastReset: number };
}

const POINTS_RULES = {
  MESSAGE_SENT: 2,
  MESSAGE_SENT_DAILY_CAP: 20,
  MESSAGE_LIKED: 3,
  EMOJI_REACTION: 2,
  ATTACHMENT_UPLOAD: 4,
  ATTACHMENT_UPLOAD_DAILY_CAP: 5,
};

async function getRateLimits(userId: string): Promise<PointsRateLimits> {
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();

  const now = Date.now();
  const oneDayAgo = now - 86400000;

  const limits = userData?.pointsRateLimits || {
    messageSent: { count: 0, lastReset: now },
    attachmentUpload: { count: 0, lastReset: now },
  };

  if (limits.messageSent.lastReset < oneDayAgo) {
    limits.messageSent = { count: 0, lastReset: now };
  }

  if (limits.attachmentUpload.lastReset < oneDayAgo) {
    limits.attachmentUpload = { count: 0, lastReset: now };
  }

  return limits;
}

async function updateRateLimits(userId: string, limits: PointsRateLimits): Promise<void> {
  await db.collection('users').doc(userId).set({
    pointsRateLimits: limits,
  }, { merge: true });
}

async function awardPoints(userId: string, points: number, reason: string, metadata: any): Promise<void> {
  const userRef = db.collection('users').doc(userId);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const currentPoints = userDoc.data()?.points || 0;

    transaction.set(userRef, {
      points: currentPoints + points,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await db.collection('point_events').add({
    user_id: userId,
    points,
    reason,
    metadata,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export const awardMessageSent = functions.https.onCall(async (data: { conversationId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const { conversationId } = data;

  try {
    const limits = await getRateLimits(uid);

    if (limits.messageSent.count >= POINTS_RULES.MESSAGE_SENT_DAILY_CAP) {
      return {
        success: false,
        message: 'Daily message points cap reached',
        points: 0,
      };
    }

    limits.messageSent.count += 1;
    await updateRateLimits(uid, limits);

    await awardPoints(uid, POINTS_RULES.MESSAGE_SENT, 'message_sent', { conversationId });

    return {
      success: true,
      message: 'Points awarded for message',
      points: POINTS_RULES.MESSAGE_SENT,
      remaining: POINTS_RULES.MESSAGE_SENT_DAILY_CAP - limits.messageSent.count,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const awardMessageLike = functions.https.onCall(async (data: { messageId: string; conversationId: string; recipientId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { messageId, conversationId, recipientId } = data;

  try {
    await awardPoints(recipientId, POINTS_RULES.MESSAGE_LIKED, 'message_liked', {
      messageId,
      conversationId,
      likedBy: context.auth.uid,
    });

    return {
      success: true,
      message: 'Points awarded for like',
      points: POINTS_RULES.MESSAGE_LIKED,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const awardEmojiReaction = functions.https.onCall(async (data: { messageId: string; conversationId: string; recipientId: string; emoji: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { messageId, conversationId, recipientId, emoji } = data;

  try {
    await awardPoints(recipientId, POINTS_RULES.EMOJI_REACTION, 'emoji_reaction', {
      messageId,
      conversationId,
      emoji,
      reactedBy: context.auth.uid,
    });

    return {
      success: true,
      message: 'Points awarded for reaction',
      points: POINTS_RULES.EMOJI_REACTION,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const awardAttachmentUpload = functions.https.onCall(async (data: { conversationId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const { conversationId } = data;

  try {
    const limits = await getRateLimits(uid);

    if (limits.attachmentUpload.count >= POINTS_RULES.ATTACHMENT_UPLOAD_DAILY_CAP) {
      return {
        success: false,
        message: 'Daily attachment points cap reached',
        points: 0,
      };
    }

    limits.attachmentUpload.count += 1;
    await updateRateLimits(uid, limits);

    await awardPoints(uid, POINTS_RULES.ATTACHMENT_UPLOAD, 'attachment_upload', { conversationId });

    return {
      success: true,
      message: 'Points awarded for attachment',
      points: POINTS_RULES.ATTACHMENT_UPLOAD,
      remaining: POINTS_RULES.ATTACHMENT_UPLOAD_DAILY_CAP - limits.attachmentUpload.count,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const reportMessage = functions.https.onCall(async (data: { messageId: string; conversationId: string; reason: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const { messageId, conversationId, reason } = data;

  try {
    const reportRef = await db.collection('messageReports').add({
      reporterId: uid,
      messageRef: `conversations/${conversationId}/messages/${messageId}`,
      conversationId,
      messageId,
      reason,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      handledBy: null,
      handledAt: null,
    });

    await logAuditEvent('message_reported', uid, 'user', {
      reportId: reportRef.id,
      messageId,
      conversationId,
      reason,
    });

    return {
      success: true,
      message: 'Message reported successfully',
      reportId: reportRef.id,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const moderateMessage = functions.https.onCall(async (data: { messageId: string; conversationId: string; action: 'delete' | 'restore' }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (userData?.role !== 'governor' && !(await hasPermission(uid, 'moderateContent'))) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  const { messageId, conversationId, action } = data;

  try {
    const messageRef = db.collection('conversations').doc(conversationId).collection('messages').doc(messageId);

    await messageRef.update({
      deleted: action === 'delete',
      moderatedBy: uid,
      moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('moderationAudit').add({
      action,
      targetType: 'message',
      targetId: messageId,
      conversationId,
      moderatorId: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAuditEvent('message_moderated', uid, userData?.role || 'moderator', {
      action,
      messageId,
      conversationId,
    });

    return {
      success: true,
      message: `Message ${action === 'delete' ? 'deleted' : 'restored'} successfully`,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const muteUser = functions.https.onCall(async (data: { targetUserId: string; conversationId?: string; duration?: number }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (userData?.role !== 'governor' && !(await hasPermission(uid, 'moderateContent'))) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  const { targetUserId, conversationId, duration } = data;

  try {
    const targetUserRef = db.collection('users').doc(targetUserId);

    const muteUntil = duration ? Date.now() + duration : null;

    if (conversationId) {
      await targetUserRef.update({
        [`mutedConversations.${conversationId}`]: muteUntil || 'permanent',
      });
    } else {
      await targetUserRef.update({
        isMuted: true,
        mutedUntil: muteUntil,
        mutedBy: uid,
        mutedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await db.collection('moderationAudit').add({
      action: 'mute_user',
      targetType: 'user',
      targetId: targetUserId,
      conversationId: conversationId || null,
      moderatorId: uid,
      duration,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAuditEvent('user_muted', uid, userData?.role || 'moderator', {
      targetUserId,
      conversationId,
      duration,
    });

    return {
      success: true,
      message: `User muted ${conversationId ? 'in conversation' : 'globally'}`,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const banUser = functions.https.onCall(async (data: { targetUserId: string; reason: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { uid } = context.auth;
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (userData?.role !== 'governor' && !(await hasPermission(uid, 'moderateContent'))) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  const { targetUserId, reason } = data;

  try {
    await db.collection('users').doc(targetUserId).update({
      isBanned: true,
      bannedBy: uid,
      bannedAt: admin.firestore.FieldValue.serverTimestamp(),
      banReason: reason,
    });

    await db.collection('moderationAudit').add({
      action: 'ban_user',
      targetType: 'user',
      targetId: targetUserId,
      moderatorId: uid,
      reason,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await logAuditEvent('user_banned', uid, userData?.role || 'moderator', {
      targetUserId,
      reason,
    });

    return {
      success: true,
      message: 'User banned successfully',
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

export const updateLeaderboard = functions.pubsub.schedule('every 15 minutes').onRun(async () => {
  try {
    const usersSnapshot = await db.collection('users')
      .orderBy('points', 'desc')
      .limit(100)
      .get();

    const globalLeaderboard = usersSnapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        userId: doc.id,
        name: data.name,
        points: data.points || 0,
        badge: data.badge || 'bronze',
        country: data.country,
        rank: index + 1,
      };
    });

    await db.collection('leaderboard').doc('global').set({
      entries: globalLeaderboard,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const countryCounts: Record<string, any[]> = {};
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const country = data.country || 'Unknown';
      if (!countryCounts[country]) {
        countryCounts[country] = [];
      }
      countryCounts[country].push({
        userId: doc.id,
        name: data.name,
        points: data.points || 0,
        badge: data.badge || 'bronze',
      });
    });

    for (const [country, entries] of Object.entries(countryCounts)) {
      const sortedEntries = entries.sort((a, b) => b.points - a.points).slice(0, 50);
      sortedEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      await db.collection('leaderboard').doc(`country_${country}`).set({
        country,
        entries: sortedEntries,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const weekAgo = Date.now() - 7 * 86400000;
    const recentPointsSnapshot = await db.collection('point_events')
      .where('timestamp', '>=', new Date(weekAgo))
      .get();

    const weeklyPoints: Record<string, number> = {};
    recentPointsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.user_id;
      weeklyPoints[userId] = (weeklyPoints[userId] || 0) + data.points;
    });

    const weeklyLeaderboard = Object.entries(weeklyPoints)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50)
      .map(([userId, points], index) => ({ userId, points, rank: index + 1 }));

    await db.collection('leaderboard').doc('weekly').set({
      entries: weeklyLeaderboard,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Leaderboard updated successfully');
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
});

export const weeklyReputationUpdate = functions.pubsub.schedule('every sunday 00:00').onRun(async (context) => {
  console.log('Starting weekly reputation score update...');

  try {
    const usersSnapshot = await db.collection('users').get();
    let updatedCount = 0;
    let errorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.data().uid;
      const userName = userDoc.data().name || 'Unknown';

      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const postsSnapshot = await db.collection('community_posts')
          .where('userId', '==', userId)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(weekAgo))
          .get();

        const totalPosts = postsSnapshot.size;
        let helpfulPosts = 0;

        postsSnapshot.forEach((doc) => {
          const post = doc.data();
          if ((post.likes || 0) >= 5 || (post.commentsCount || 0) >= 3) {
            helpfulPosts++;
          }
        });

        const moderationSnapshot = await db.collection('moderation_logs')
          .where('userId', '==', userId)
          .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(weekAgo))
          .get();

        let violations = 0;
        let warnings = 0;

        moderationSnapshot.forEach((doc) => {
          const log = doc.data();
          if (log.action === 'block' || log.action === 'ban') violations++;
          else if (log.action === 'warn') warnings++;
        });

        const messagesSnapshot = await db.collection('groupChats').doc('publicRoom')
          .collection('messages')
          .where('senderId', '==', userId)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(weekAgo))
          .get();

        const messageCount = messagesSnapshot.size;

        const productsSnapshot = await db.collection('marketplace_products')
          .where('sellerId', '==', userId)
          .get();

        let totalRatings = 0;
        let ratingSum = 0;

        productsSnapshot.forEach((doc) => {
          const product = doc.data();
          if (product.rating && product.ratingCount) {
            ratingSum += product.rating * product.ratingCount;
            totalRatings += product.ratingCount;
          }
        });

        const marketplaceRating = totalRatings > 0 ? ratingSum / totalRatings : 0;
        const consistency = totalPosts >= 3 ? Math.min(totalPosts / 7 * 10, 15) : 0;
        const engagement = Math.min((messageCount + totalPosts) / 20 * 15, 20);

        let score = 50;
        score += helpfulPosts * 3;
        score += consistency;
        score += engagement;
        score += marketplaceRating * 5;
        score -= violations * 15;
        score -= warnings * 5;
        score = Math.max(0, Math.min(100, score));

        const calculateTier = (s: number) => {
          if (s >= 90) return 'legendary';
          if (s >= 75) return 'elite';
          if (s >= 60) return 'veteran';
          if (s >= 40) return 'trusted';
          return 'novice';
        };

        const calculatePerks = (s: number) => ({
          fastPosting: s >= 60,
          highlightBadge: s >= 75,
          visibilityBoost: s >= 75,
          prioritySupport: s >= 90
        });

        const calculateRestrictions = (s: number) => {
          if (s < 20) {
            return {
              cooldownUntil: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
              postingLimited: true,
              maxPostsPerHour: 2
            };
          } else if (s < 40) {
            return {
              cooldownUntil: null,
              postingLimited: true,
              maxPostsPerHour: 5
            };
          } else {
            return {
              cooldownUntil: null,
              postingLimited: false,
              maxPostsPerHour: s >= 75 ? 50 : 20
            };
          }
        };

        const reputationRef = db.collection('user_reputation').doc(userId);
        const currentRep = await reputationRef.get();

        if (!currentRep.exists()) {
          await reputationRef.set({
            userId,
            userName,
            score,
            tier: calculateTier(score),
            lastCalculated: admin.firestore.FieldValue.serverTimestamp(),
            metrics: {
              helpfulPosts,
              totalPosts,
              violations,
              warnings,
              consistency,
              engagement,
              marketplaceRating
            },
            perks: calculatePerks(score),
            restrictions: calculateRestrictions(score),
            history: [],
            visibilityPublic: true,
            manualOverride: {
              active: false,
              by: null,
              reason: null,
              date: null
            }
          });
        } else {
          await reputationRef.update({
            score,
            tier: calculateTier(score),
            perks: calculatePerks(score),
            restrictions: calculateRestrictions(score),
            'metrics.helpfulPosts': helpfulPosts,
            'metrics.totalPosts': totalPosts,
            'metrics.violations': violations,
            'metrics.warnings': warnings,
            'metrics.consistency': consistency,
            'metrics.engagement': engagement,
            'metrics.marketplaceRating': marketplaceRating,
            lastCalculated: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        updatedCount++;
      } catch (error) {
        console.error(`Error updating reputation for user ${userId}:`, error);
        errorCount++;
      }
    }

    console.log(`Reputation update complete. Updated: ${updatedCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error in weekly reputation update:', error);
  }
});

export { createPaymentIntent } from './stripe/createPaymentIntent';
export { stripeWebhook } from './stripe/handleWebhook';
export { generateDownloadLink } from './stripe/generateDownloadLink';

// WebAuthn / Biometric Authentication Functions
export { registerBegin } from './webauthn/registerBegin';
export { registerComplete } from './webauthn/registerComplete';
export { loginBegin } from './webauthn/loginBegin';
export { loginComplete } from './webauthn/loginComplete';
export { revokeDevice } from './devices/revokeDevice';
export { generateBackupCodes } from './backup/generateCodes';
