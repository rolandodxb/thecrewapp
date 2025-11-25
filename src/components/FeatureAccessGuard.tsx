import { useState, useEffect, ReactNode } from 'react';
import {
  FeatureKey,
  FeatureShutdown,
  subscribeToFeatureShutdowns,
  checkAndAutoRestoreFeatures
} from '../services/featureShutdownService';
import GlassMaintenanceBanner from './GlassMaintenanceBanner';

interface FeatureAccessGuardProps {
  featureKey: FeatureKey;
  children: ReactNode;
}

export default function FeatureAccessGuard({ featureKey, children }: FeatureAccessGuardProps) {
  const [shutdown, setShutdown] = useState<FeatureShutdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndAutoRestoreFeatures();

    const unsubscribe = subscribeToFeatureShutdowns((shutdowns) => {
      const featureShutdown = shutdowns[featureKey];

      if (featureShutdown && featureShutdown.isShutdown) {
        setShutdown(featureShutdown);
      } else {
        setShutdown(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [featureKey]);

  const handleRefresh = async () => {
    setLoading(true);
    await checkAndAutoRestoreFeatures();

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D71920] border-t-transparent"></div>
      </div>
    );
  }

  if (shutdown && shutdown.isShutdown) {
    return <GlassMaintenanceBanner shutdown={shutdown} onRefresh={handleRefresh} />;
  }

  return <>{children}</>;
}
