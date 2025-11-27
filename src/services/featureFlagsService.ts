import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  enabledForRoles?: string[];
  enabledForPlans?: string[];
  enabledForUsers?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

const flagsCollection = 'featureFlags';

export async function getFeatureFlag(flagId: string): Promise<FeatureFlag | null> {
  const docRef = doc(db, flagsCollection, flagId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as FeatureFlag;
  }

  return null;
}

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  const snapshot = await getDocs(collection(db, flagsCollection));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FeatureFlag));
}

export function subscribeToFeatureFlags(callback: (flags: FeatureFlag[]) => void) {
  return onSnapshot(collection(db, flagsCollection), (snapshot) => {
    const flags = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FeatureFlag));
    callback(flags);
  });
}

export async function createFeatureFlag(
  flagId: string,
  data: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>
) {
  const docRef = doc(db, flagsCollection, flagId);
  await setDoc(docRef, {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>) {
  const docRef = doc(db, flagsCollection, flagId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function toggleFeatureFlag(flagId: string) {
  const flag = await getFeatureFlag(flagId);
  if (flag) {
    await updateFeatureFlag(flagId, { enabled: !flag.enabled });
  }
}

export async function isFeatureEnabled(
  flagId: string,
  userId?: string,
  userRole?: string,
  userPlan?: string
): Promise<boolean> {
  const flag = await getFeatureFlag(flagId);

  if (!flag) {
    return false;
  }

  if (!flag.enabled) {
    return false;
  }

  if (flag.enabledForUsers && userId) {
    if (!flag.enabledForUsers.includes(userId)) {
      return false;
    }
  }

  if (flag.enabledForRoles && userRole) {
    if (!flag.enabledForRoles.includes(userRole)) {
      return false;
    }
  }

  if (flag.enabledForPlans && userPlan) {
    if (!flag.enabledForPlans.includes(userPlan)) {
      return false;
    }
  }

  return true;
}

const flagCache: Record<string, FeatureFlag> = {};

export function initializeFeatureFlagCache() {
  return subscribeToFeatureFlags((flags) => {
    flags.forEach((flag) => {
      flagCache[flag.id] = flag;
    });
  });
}

export function isFeatureEnabledSync(
  flagId: string,
  userId?: string,
  userRole?: string,
  userPlan?: string
): boolean {
  const flag = flagCache[flagId];

  if (!flag || !flag.enabled) {
    return false;
  }

  if (flag.enabledForUsers && userId && !flag.enabledForUsers.includes(userId)) {
    return false;
  }

  if (flag.enabledForRoles && userRole && !flag.enabledForRoles.includes(userRole)) {
    return false;
  }

  if (flag.enabledForPlans && userPlan && !flag.enabledForPlans.includes(userPlan)) {
    return false;
  }

  return true;
}
