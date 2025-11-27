import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, MessageCircle, Brain, FileQuestion, AlertCircle, Calendar, Users } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useApp } from '../../../context/AppContext';
import { getSystemControl, SystemFeatures } from '../../../services/systemControlService';

export default function SystemFlags() {
  const { currentUser } = useApp();
  const [features, setFeatures] = useState<SystemFeatures>({
    chat: true,
    quiz: true,
    englishTest: true,
    profileEdit: true,
    openDayModule: true
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const isGovernor = currentUser?.role === 'governor';

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const control = await getSystemControl();
      if (control && control.features) {
        setFeatures(control.features);
      }
    } catch (error) {
      console.error('Error loading system features:', error);
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (flagName: string, newValue: boolean) => {
    try {
      await addDoc(collection(db, 'auditEvents'), {
        eventType: 'systemFlag',
        userId: currentUser?.uid,
        userName: currentUser?.name,
        details: `${flagName} ${newValue ? 'enabled' : 'disabled'}`,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleToggle = async (featureName: keyof SystemFeatures) => {
    if (!isGovernor || !currentUser) return;

    setUpdating(featureName);
    const newValue = !features[featureName];

    try {
      const control = await getSystemControl();
      if (control) {
        const updatedFeatures = {
          ...control.features,
          [featureName]: newValue
        };

        await updateDoc(doc(db, 'systemControl', 'status'), {
          features: updatedFeatures,
          updatedBy: currentUser.uid,
          updatedAt: new Date()
        });

        setFeatures(updatedFeatures);
        await logAction(featureName, newValue);
      }
    } catch (error) {
      console.error(`Error toggling ${featureName}:`, error);
      alert(`Failed to update ${featureName}`);
    } finally {
      setUpdating(null);
    }
  };

  const flagConfig = [
    {
      key: 'chat' as keyof SystemFeatures,
      label: 'Chat System',
      icon: MessageCircle,
      color: 'blue',
      description: 'Enable/disable platform chat functionality',
    },
    {
      key: 'quiz' as keyof SystemFeatures,
      label: 'Quiz System',
      icon: FileQuestion,
      color: 'green',
      description: 'Enable/disable quiz and assessment features',
    },
    {
      key: 'englishTest' as keyof SystemFeatures,
      label: 'English Test',
      icon: Brain,
      color: 'charcoal',
      description: 'Enable/disable English test functionality',
    },
    {
      key: 'profileEdit' as keyof SystemFeatures,
      label: 'Profile Editing',
      icon: Users,
      color: 'orange',
      description: 'Enable/disable profile editing',
    },
    {
      key: 'openDayModule' as keyof SystemFeatures,
      label: 'Open Day Module',
      icon: Calendar,
      color: 'red',
      description: 'Enable/disable Open Day simulator',
    },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg glass-light/80 rounded-xl shadow-lg border border-gray-200/50 p-6"
      >
        <div className="text-center py-8 text-gray-500">Loading system flags...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light border border-gray-200 rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900">System Feature Flags</h2>
      </div>

      {!isGovernor && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            View only mode. System flag control requires governor access.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {flagConfig.map((flag, index) => {
          const Icon = flag.icon;
          const isEnabled = features[flag.key];
          const isUpdating = updating === flag.key;

          return (
            <motion.div
              key={flag.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 glass-light rounded-xl border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    flag.color === 'blue' ? 'bg-blue-100' :
                    flag.color === 'green' ? 'bg-green-100' :
                    flag.color === 'charcoal' ? 'bg-gray-200' :
                    flag.color === 'orange' ? 'bg-orange-100' :
                    'bg-red-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      flag.color === 'blue' ? 'text-blue-600' :
                      flag.color === 'green' ? 'text-green-600' :
                      flag.color === 'charcoal' ? 'text-gray-700' :
                      flag.color === 'orange' ? 'text-orange-600' :
                      'text-[#D71920]'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{flag.label}</h3>
                    <p className="text-xs text-gray-600">{flag.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(flag.key)}
                  disabled={!isGovernor || isUpdating}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#D71920] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEnabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {isEnabled && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Active across platform
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Changes to system flags are instantly reflected across the entire platform.
        </p>
      </div>
    </motion.div>
  );
}
