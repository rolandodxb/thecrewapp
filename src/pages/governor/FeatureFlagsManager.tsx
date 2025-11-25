import { useState, useEffect, useRef } from 'react';
import { Flag, Plus, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FeatureFlag,
  getAllFeatureFlags,
  createFeatureFlag,
  toggleFeatureFlag,
  subscribeToFeatureFlags,
} from '../../services/featureFlagsService';
import { useApp } from '../../context/AppContext';

export default function FeatureFlagsManager() {
  const { currentUser } = useApp();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('FeatureFlagsManager mounted - NEW DROPDOWN VERSION');
    const unsubscribe = subscribeToFeatureFlags((newFlags) => {
      console.log('Feature flags loaded:', newFlags);
      setFlags(newFlags);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async (flagId: string) => {
    await toggleFeatureFlag(flagId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Feature Flags Manager</h1>
            <p className="text-gray-600">Control feature rollouts and access with dropdown menu</p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              Create Flag
              <ChevronDown className={`w-4 h-4 transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCreateDropdown && (
                <CreateFlagDropdown
                  onClose={() => setShowCreateDropdown(false)}
                  currentUser={currentUser}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {flags.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Feature Flags</h3>
              <p className="text-gray-600 mb-6">Create your first feature flag to get started</p>
              <button
                onClick={() => setShowCreateDropdown(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
              >
                Create First Flag
              </button>
            </div>
          ) : (
            flags.map((flag) => (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{flag.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          flag.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {flag.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{flag.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      {flag.enabledForRoles && flag.enabledForRoles.length > 0 && (
                        <div>
                          <span className="font-bold text-gray-700">Roles:</span>
                          <span className="ml-2 text-gray-600">
                            {flag.enabledForRoles.join(', ')}
                          </span>
                        </div>
                      )}
                      {flag.enabledForPlans && flag.enabledForPlans.length > 0 && (
                        <div>
                          <span className="font-bold text-gray-700">Plans:</span>
                          <span className="ml-2 text-gray-600">
                            {flag.enabledForPlans.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(flag.id)}
                      className={`p-2 rounded-lg transition ${
                        flag.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={flag.enabled ? 'Disable' : 'Enable'}
                    >
                      {flag.enabled ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface CreateFlagDropdownProps {
  onClose: () => void;
  currentUser: any;
}

function CreateFlagDropdown({ onClose, currentUser }: CreateFlagDropdownProps) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    enabled: false,
    enabledForRoles: [] as string[],
    enabledForPlans: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await createFeatureFlag(formData.id, {
      name: formData.name,
      description: formData.description,
      enabled: formData.enabled,
      enabledForRoles: formData.enabledForRoles.length > 0 ? formData.enabledForRoles : undefined,
      enabledForPlans: formData.enabledForPlans.length > 0 ? formData.enabledForPlans : undefined,
      createdBy: currentUser?.uid || 'unknown',
    });

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed inset-x-4 top-16 md:top-auto md:inset-x-auto md:absolute md:right-0 md:mt-2 md:w-[500px] glass-card shadow-2xl rounded-2xl z-[104] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 md:p-6 border-b-2 border-gray-200/50">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Create Feature Flag</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4 max-h-[calc(100vh-10rem)] md:max-h-[70vh] overflow-y-auto">
        <div>
          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">Flag ID</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg md:rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none text-sm"
            placeholder="ai-trainer-feature"
            required
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">Display Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg md:rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none text-sm"
            placeholder="AI Trainer Feature"
            required
          />
        </div>

        <div>
          <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1.5">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg md:rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none text-sm resize-none"
            rows={3}
            placeholder="Enables the AI trainer feature for selected users"
            required
          />
        </div>

        <div className="flex items-center gap-2.5 py-1.5">
          <input
            type="checkbox"
            id="enabled"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="w-4 h-4 md:w-5 md:h-5 rounded border-2 border-gray-300"
          />
          <label htmlFor="enabled" className="font-bold text-gray-700 text-xs md:text-sm">
            Enable immediately
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 md:pt-4 border-t-2 border-gray-200/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg md:rounded-xl font-bold hover:bg-gray-300 transition text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-lg md:rounded-xl font-bold hover:shadow-lg transition text-sm"
          >
            Create Flag
          </button>
        </div>
      </form>
    </motion.div>
  );
}
