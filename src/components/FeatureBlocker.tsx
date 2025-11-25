import { ReactNode } from 'react';
import { Lock, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SystemFeatures } from '../services/systemControlService';

interface FeatureBlockerProps {
  feature: keyof SystemFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export default function FeatureBlocker({
  feature,
  children,
  fallback,
  showMessage = true,
}: FeatureBlockerProps) {
  const { isFeatureEnabled } = useApp();

  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showMessage) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-gray-50 rounded-2xl border-2 border-gray-200">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <Wrench className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Feature Temporarily Unavailable</h3>
      <p className="text-gray-600 text-center max-w-md">
        This feature is currently under maintenance. Please check back later or contact support for more information.
      </p>
    </div>
  );
}

interface FeatureButtonBlockerProps {
  feature: keyof SystemFeatures;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabledClassName?: string;
}

export function FeatureButtonBlocker({
  feature,
  onClick,
  children,
  className = '',
  disabledClassName = 'opacity-50 cursor-not-allowed',
}: FeatureButtonBlockerProps) {
  const { isFeatureEnabled } = useApp();
  const enabled = isFeatureEnabled(feature);

  return (
    <button
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      className={`${className} ${!enabled ? disabledClassName : ''}`}
      title={!enabled ? 'This feature is temporarily unavailable' : ''}
    >
      {children}
      {!enabled && <Lock className="w-4 h-4 ml-2 inline" />}
    </button>
  );
}
