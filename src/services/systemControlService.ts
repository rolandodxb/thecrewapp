import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, Unsubscribe } from 'firebase/firestore';

export type FeatureSeverity = 'info' | 'low' | 'urgent' | 'critical';

export interface FeatureRestriction {
  enabled: boolean;
  severity?: FeatureSeverity;
  reason?: string;
  disabledAt?: string;
  availableAt?: string;
  estimatedDuration?: string;
}

export interface SystemFeatures {
  chat: FeatureRestriction;
  quiz: FeatureRestriction;
  englishTest: FeatureRestriction;
  profileEdit: FeatureRestriction;
  openDayModule: FeatureRestriction;
  courses: FeatureRestriction;
  aiTrainer: FeatureRestriction;
  recruiters: FeatureRestriction;
  openDays: FeatureRestriction;
  simulator: FeatureRestriction;
  messages: FeatureRestriction;
  leaderboard: FeatureRestriction;
  community: FeatureRestriction;
}

export interface SystemAnnouncement {
  active: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string | null;
}

export interface SystemControl {
  features: SystemFeatures;
  announcement: SystemAnnouncement;
  updatedBy?: string;
  updatedAt?: any;
}

const SYSTEM_CONTROL_DOC_ID = 'status';

export const getSystemControl = async (): Promise<SystemControl | null> => {
  try {
    const docRef = doc(db, 'systemControl', SYSTEM_CONTROL_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log('No system control entry found, creating default...');
      return await createDefaultSystemControl();
    }

    return docSnap.data() as SystemControl;
  } catch (error) {
    console.error('Error fetching system control:', error);
    return null;
  }
};

const createDefaultSystemControl = async (): Promise<SystemControl | null> => {
  try {
    const defaultFeature: FeatureRestriction = { enabled: true };

    const defaultControl: SystemControl = {
      features: {
        chat: defaultFeature,
        quiz: defaultFeature,
        englishTest: defaultFeature,
        profileEdit: defaultFeature,
        openDayModule: defaultFeature,
        courses: defaultFeature,
        aiTrainer: defaultFeature,
        recruiters: defaultFeature,
        openDays: defaultFeature,
        simulator: defaultFeature,
        messages: defaultFeature,
        leaderboard: defaultFeature,
        community: defaultFeature,
      },
      announcement: {
        active: false,
        message: '',
        type: 'info',
        timestamp: null,
      },
      updatedBy: 'system',
      updatedAt: serverTimestamp(),
    };

    const docRef = doc(db, 'systemControl', SYSTEM_CONTROL_DOC_ID);
    await setDoc(docRef, defaultControl);
    console.log('Default system control created successfully');
    return defaultControl;
  } catch (error) {
    console.error('Error creating default system control:', error);
    return null;
  }
};

export const updateSystemControl = async (
  updates: Partial<SystemControl>,
  userId: string
): Promise<SystemControl | null> => {
  try {
    const docRef = doc(db, 'systemControl', SYSTEM_CONTROL_DOC_ID);
    const updateData = {
      ...updates,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(docRef, updateData);

    const docSnap = await getDoc(docRef);
    return docSnap.data() as SystemControl;
  } catch (error) {
    console.error('Error updating system control:', error);
    throw error;
  }
};

export const updateAnnouncement = async (
  announcement: Partial<SystemAnnouncement>,
  userId: string
): Promise<void> => {
  try {
    const systemControl = await getSystemControl();
    if (!systemControl) throw new Error('System control not found');

    const updatedAnnouncement = {
      ...systemControl.announcement,
      ...announcement,
    };

    await updateSystemControl({ announcement: updatedAnnouncement }, userId);
  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

export const subscribeToSystemControl = (
  callback: (control: SystemControl | null) => void
): Unsubscribe => {
  const docRef = doc(db, 'systemControl', SYSTEM_CONTROL_DOC_ID);

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as SystemControl);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error subscribing to system control:', error);
      callback(null);
    }
  );

  return unsubscribe;
};

export const updateFeatureStatus = async (
  featureName: keyof SystemFeatures,
  restriction: FeatureRestriction,
  userId: string
): Promise<void> => {
  try {
    const systemControl = await getSystemControl();
    if (!systemControl) throw new Error('System control not found');

    const updatedFeatures = {
      ...systemControl.features,
      [featureName]: restriction,
    };

    await updateSystemControl({ features: updatedFeatures }, userId);
    console.log(`Feature ${featureName} updated:`, restriction);
  } catch (error) {
    console.error(`Error updating feature ${featureName}:`, error);
    throw error;
  }
};

export const isFeatureEnabled = (features: SystemFeatures, featureName: keyof SystemFeatures): boolean => {
  const feature = features[featureName];
  if (!feature) return true;
  return feature.enabled;
};

export const getFeatureRestriction = (features: SystemFeatures, featureName: keyof SystemFeatures): FeatureRestriction | null => {
  const feature = features[featureName];
  if (!feature || feature.enabled) return null;
  return feature;
};
