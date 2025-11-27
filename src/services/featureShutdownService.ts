import { doc, getDoc, setDoc, updateDoc, onSnapshot, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type FeatureKey =
  | 'chat'
  | 'modules'
  | 'submodules'
  | 'courses'
  | 'videos'
  | 'quizzes'
  | 'exams'
  | 'notifications'
  | 'certificateSystem'
  | 'communityChat'
  | 'pointsSystem'
  | 'fileUpload'
  | 'profileEdit';

export interface FeatureShutdown {
  featureKey: FeatureKey;
  isShutdown: boolean;
  shutdownReason: string;
  maintenanceMessage: string;
  maintenanceEndsAt: Date | null;
  updatedBy: string;
  updatedAt: Date;
}

export interface FeatureShutdownData {
  [key: string]: FeatureShutdown;
}

const FEATURES_SHUTDOWN_DOC = 'systemSettings/featuresShutdown';

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  chat: 'Private Chat',
  modules: 'Training Modules',
  submodules: 'Submodules',
  courses: 'Courses',
  videos: 'Video Player',
  quizzes: 'Quizzes',
  exams: 'Exams',
  notifications: 'Notifications',
  certificateSystem: 'Certificates',
  communityChat: 'Community Chat',
  pointsSystem: 'Points System',
  fileUpload: 'File Upload',
  profileEdit: 'Profile Editing'
};

async function addAuditLog(action: string, details: any, performedBy: string) {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      action,
      details,
      performedBy,
      timestamp: Timestamp.now(),
      category: 'FEATURE_SHUTDOWN'
    });
  } catch (error) {
    console.error('Failed to add audit log:', error);
  }
}

export async function getFeatureShutdownStatus(featureKey: FeatureKey): Promise<FeatureShutdown | null> {
  try {
    const docRef = doc(db, 'systemSettings', 'featuresShutdown');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    const featureData = data[featureKey];

    if (!featureData) {
      return null;
    }

    return {
      ...featureData,
      maintenanceEndsAt: featureData.maintenanceEndsAt?.toDate() || null,
      updatedAt: featureData.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting feature shutdown status:', error);
    return null;
  }
}

export async function getAllFeatureShutdowns(): Promise<FeatureShutdownData> {
  try {
    const docRef = doc(db, 'systemSettings', 'featuresShutdown');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {};
    }

    const data = docSnap.data();
    const result: FeatureShutdownData = {};

    Object.keys(data).forEach((key) => {
      const featureData = data[key];
      result[key] = {
        ...featureData,
        maintenanceEndsAt: featureData.maintenanceEndsAt?.toDate() || null,
        updatedAt: featureData.updatedAt?.toDate() || new Date()
      };
    });

    return result;
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      return {};
    }
    console.error('Error getting all feature shutdowns:', error);
    return {};
  }
}

export function subscribeToFeatureShutdowns(
  callback: (shutdowns: FeatureShutdownData) => void
): () => void {
  const docRef = doc(db, 'systemSettings', 'featuresShutdown');

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback({});
        return;
      }

      const data = docSnap.data();
      const result: FeatureShutdownData = {};

      Object.keys(data).forEach((key) => {
        const featureData = data[key];
        result[key] = {
          ...featureData,
          maintenanceEndsAt: featureData.maintenanceEndsAt?.toDate() || null,
          updatedAt: featureData.updatedAt?.toDate() || new Date()
        };
      });

      callback(result);
    },
    (error: any) => {
      if (error?.code === 'permission-denied') {
        callback({});
        return;
      }
      console.error('Error subscribing to feature shutdowns:', error);
      callback({});
    }
  );

  return unsubscribe;
}

export async function activateFeatureShutdown(
  featureKey: FeatureKey,
  shutdownReason: string,
  maintenanceMessage: string,
  maintenanceEndsAt: Date,
  performedBy: string
): Promise<void> {
  try {
    const docRef = doc(db, 'systemSettings', 'featuresShutdown');

    const safePerformedBy = performedBy || 'UNKNOWN';

    const shutdownData = {
      featureKey,
      isShutdown: true,
      shutdownReason,
      maintenanceMessage,
      maintenanceEndsAt: Timestamp.fromDate(maintenanceEndsAt),
      updatedBy: safePerformedBy,
      updatedAt: Timestamp.now()
    };

    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        [featureKey]: shutdownData
      });
    } else {
      await updateDoc(docRef, {
        [featureKey]: shutdownData
      });
    }

    await addAuditLog(
      'FEATURE_SHUTDOWN_ACTIVATED',
      {
        featureKey,
        shutdownReason,
        maintenanceMessage,
        maintenanceEndsAt: maintenanceEndsAt.toISOString()
      },
      safePerformedBy
    );
  } catch (error) {
    console.error('Error activating feature shutdown:', error);
    throw error;
  }
}

export async function deactivateFeatureShutdown(
  featureKey: FeatureKey,
  performedBy: string
): Promise<void> {
  try {
    const docRef = doc(db, 'systemSettings', 'featuresShutdown');

    const safePerformedBy = performedBy || 'UNKNOWN';

    await updateDoc(docRef, {
      [`${featureKey}.isShutdown`]: false,
      [`${featureKey}.updatedBy`]: safePerformedBy,
      [`${featureKey}.updatedAt`]: Timestamp.now()
    });

    await addAuditLog(
      'FEATURE_SHUTDOWN_DEACTIVATED',
      { featureKey },
      safePerformedBy
    );
  } catch (error) {
    console.error('Error deactivating feature shutdown:', error);
    throw error;
  }
}

export async function checkAndAutoRestoreFeatures(): Promise<void> {
  try {
    const shutdowns = await getAllFeatureShutdowns();
    const now = new Date();

    for (const [featureKey, shutdown] of Object.entries(shutdowns)) {
      if (
        shutdown.isShutdown &&
        shutdown.maintenanceEndsAt &&
        shutdown.maintenanceEndsAt < now
      ) {
        const docRef = doc(db, 'systemSettings', 'featuresShutdown');

        await updateDoc(docRef, {
          [`${featureKey}.isShutdown`]: false,
          [`${featureKey}.updatedBy`]: 'SYSTEM_AUTO_RESTORE',
          [`${featureKey}.updatedAt`]: Timestamp.now()
        });

        await addAuditLog(
          'FEATURE_SHUTDOWN_AUTO_RESTORED',
          {
            featureKey,
            scheduledEndTime: shutdown.maintenanceEndsAt.toISOString()
          },
          'SYSTEM_AUTO_RESTORE'
        );
      }
    }
  } catch (error) {
    console.error('Error in auto-restore check:', error);
  }
}

export function startAutoRestoreScheduler(): () => void {
  const intervalId = setInterval(() => {
    checkAndAutoRestoreFeatures();
  }, 60000);

  checkAndAutoRestoreFeatures();

  return () => clearInterval(intervalId);
}
