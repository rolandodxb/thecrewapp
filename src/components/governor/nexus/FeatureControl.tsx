import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Power,
  PowerOff,
  Edit2,
  Save,
  X,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react';
import {
  getSystemControl,
  updateFeatureStatus,
  SystemFeatures,
  FeatureRestriction,
  FeatureSeverity,
} from '../../../services/systemControlService';
import { useApp } from '../../../context/AppContext';

export default function FeatureControl() {
  const { currentUser } = useApp();
  const [features, setFeatures] = useState<SystemFeatures | null>(null);
  const [editingFeature, setEditingFeature] = useState<keyof SystemFeatures | null>(null);
  const [editForm, setEditForm] = useState<FeatureRestriction>({
    enabled: true,
  });
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const control = await getSystemControl();
      if (control) {
        setFeatures(control.features);
      }
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleEdit = (featureName: keyof SystemFeatures, feature: FeatureRestriction) => {
    setEditingFeature(featureName);
    setEditForm({ ...feature });
  };

  const handleSave = async () => {
    if (!editingFeature || !currentUser) return;

    try {
      setLoading(editingFeature);

      const restriction: FeatureRestriction = {
        enabled: editForm.enabled,
        ...(editForm.enabled ? {} : {
          severity: editForm.severity || 'info',
          reason: editForm.reason || '',
          disabledAt: new Date().toISOString(),
          availableAt: editForm.availableAt || '',
          estimatedDuration: editForm.estimatedDuration || '',
        }),
      };

      await updateFeatureStatus(editingFeature, restriction, currentUser.uid);
      await loadFeatures();
      setEditingFeature(null);
      setEditForm({ enabled: true });
    } catch (error) {
      console.error('Error updating feature:', error);
      alert('Failed to update feature status');
    } finally {
      setLoading(null);
    }
  };

  const handleQuickToggle = async (featureName: keyof SystemFeatures, currentStatus: FeatureRestriction) => {
    if (!currentUser) return;

    try {
      setLoading(featureName);

      const newRestriction: FeatureRestriction = {
        enabled: !currentStatus.enabled,
        ...(currentStatus.enabled ? {
          severity: 'info',
          reason: 'Temporarily disabled by governor',
          disabledAt: new Date().toISOString(),
        } : {}),
      };

      await updateFeatureStatus(featureName, newRestriction, currentUser.uid);
      await loadFeatures();
    } catch (error) {
      console.error('Error toggling feature:', error);
      alert('Failed to toggle feature');
    } finally {
      setLoading(null);
    }
  };

  const getSeverityColor = (severity?: FeatureSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity?: FeatureSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'low':
        return <Clock className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (!features) {
    return (
      <div className="glass-light rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#D71920] border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-light rounded-2xl shadow-lg p-3 md:p-6"
    >
      <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
        <Power className="w-5 h-5 md:w-6 md:h-6 text-[#D71920]" />
        <span className="truncate">Feature Control</span>
      </h2>

      <div className="space-y-4">
        {(Object.keys(features) as Array<keyof SystemFeatures>).map((featureName) => {
          const feature = features[featureName];
          const isEditing = editingFeature === featureName;
          const isLoading = loading === featureName;

          return (
            <div
              key={featureName}
              className={`border-2 rounded-xl p-3 md:p-4 transition ${
                feature.enabled
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-[#D71920]/10'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 break-words">
                      {featureName.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <Save className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                      <button
                        onClick={() => setEditingFeature(null)}
                        className="px-3 md:px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.enabled}
                        onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="font-semibold text-gray-700">Feature Enabled</span>
                    </label>
                  </div>

                  {!editForm.enabled && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Severity Level
                        </label>
                        <select
                          value={editForm.severity || 'info'}
                          onChange={(e) => setEditForm({ ...editForm, severity: e.target.value as FeatureSeverity })}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                        >
                          <option value="info">Info (Blue)</option>
                          <option value="low">Low (Yellow)</option>
                          <option value="urgent">Urgent (Orange)</option>
                          <option value="critical">Critical (Red)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Reason for Restriction
                        </label>
                        <textarea
                          value={editForm.reason || ''}
                          onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                          placeholder="Explain why this feature is disabled..."
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D71920] focus:border-transparent resize-none"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Available At (When feature will return)
                        </label>
                        <input
                          type="datetime-local"
                          value={editForm.availableAt ? editForm.availableAt.slice(0, 16) : ''}
                          onChange={(e) => setEditForm({ ...editForm, availableAt: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Estimated Duration
                        </label>
                        <input
                          type="text"
                          value={editForm.estimatedDuration || ''}
                          onChange={(e) => setEditForm({ ...editForm, estimatedDuration: e.target.value })}
                          placeholder="e.g., 2 hours, 1 day, 30 minutes"
                          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {featureName.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      {!feature.enabled && feature.severity && (
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(feature.severity)}`}>
                          {getSeverityIcon(feature.severity)}
                          {feature.severity.toUpperCase()}
                        </div>
                      )}
                    </div>

                    {!feature.enabled && feature.reason && (
                      <p className="text-sm text-gray-600 mb-2">{feature.reason}</p>
                    )}

                    {!feature.enabled && (feature.availableAt || feature.estimatedDuration) && (
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {feature.disabledAt && (
                          <span>
                            Disabled: {new Date(feature.disabledAt).toLocaleString()}
                          </span>
                        )}
                        {feature.availableAt && (
                          <span>
                            Available: {new Date(feature.availableAt).toLocaleString()}
                          </span>
                        )}
                        {feature.estimatedDuration && (
                          <span>Duration: {feature.estimatedDuration}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(featureName, feature)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-1"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleQuickToggle(featureName, feature)}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1 ${
                        feature.enabled
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                      title={feature.enabled ? 'Disable' : 'Enable'}
                    >
                      {feature.enabled ? (
                        <>
                          <PowerOff className="w-4 h-4" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4" />
                          Enable
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
