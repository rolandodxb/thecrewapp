import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { isFeatureEnabledSync, initializeFeatureFlagCache } from '../services/featureFlagsService';

let cacheInitialized = false;
let unsubscribe: (() => void) | null = null;

export function useFeatureFlag(flagId: string): boolean {
  const { currentUser } = useApp();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!cacheInitialized) {
      unsubscribe = initializeFeatureFlagCache();
      cacheInitialized = true;
    }

    const checkFlag = () => {
      const enabled = isFeatureEnabledSync(
        flagId,
        currentUser?.uid,
        currentUser?.role,
        currentUser?.subscription
      );
      setIsEnabled(enabled);
    };

    checkFlag();

    const interval = setInterval(checkFlag, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [flagId, currentUser]);

  return isEnabled;
}

export function useFeatureFlags(): Record<string, boolean> {
  const { currentUser } = useApp();
  const [flags, setFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!cacheInitialized) {
      unsubscribe = initializeFeatureFlagCache();
      cacheInitialized = true;
    }

    return () => {
      if (unsubscribe && cacheInitialized) {
        unsubscribe();
        cacheInitialized = false;
      }
    };
  }, []);

  return flags;
}
