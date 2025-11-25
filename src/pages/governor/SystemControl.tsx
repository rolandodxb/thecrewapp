import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  getSystemControl,
  updateSystemControl,
  SystemFeatures,
  SystemAnnouncement,
} from '../../services/systemControlService';
import {
  Shield,
  MessageCircle,
  FileQuestion,
  Languages,
  UserCog,
  Calendar,
  Save,
  RefreshCw,
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SystemControl() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [features, setFeatures] = useState<SystemFeatures>({
    chat: true,
    quiz: true,
    englishTest: true,
    profileEdit: true,
    openDayModule: true,
  });

  const [announcement, setAnnouncement] = useState<SystemAnnouncement>({
    active: false,
    message: '',
    type: 'info',
    timestamp: null,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'governor') {
      navigate('/dashboard');
      return;
    }

    loadSystemControl();
  }, [currentUser, navigate]);

  const loadSystemControl = async () => {
    try {
      const control = await getSystemControl();
      if (control) {
        setFeatures(control.features);
        setAnnouncement(control.announcement);
      }
    } catch (error) {
      console.error('Error loading system control:', error);
      setMessage({ type: 'error', text: 'Failed to load system control' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    setMessage(null);

    try {
      await updateSystemControl(features, announcement, currentUser.uid);
      setMessage({ type: 'success', text: 'System control updated successfully!' });
    } catch (error) {
      console.error('Error saving system control:', error);
      setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const featuresList = [
    {
      key: 'chat' as keyof SystemFeatures,
      label: 'Chat System',
      description: 'Enable messaging between students and mentors',
      icon: MessageCircle,
    },
    {
      key: 'quiz' as keyof SystemFeatures,
      label: 'Quiz Module',
      description: 'Allow students to take assessment quizzes',
      icon: FileQuestion,
    },
    {
      key: 'englishTest' as keyof SystemFeatures,
      label: 'English Test',
      description: 'Enable English proficiency testing',
      icon: Languages,
    },
    {
      key: 'profileEdit' as keyof SystemFeatures,
      label: 'Profile Editing',
      description: 'Allow users to edit their profiles',
      icon: UserCog,
    },
    {
      key: 'openDayModule' as keyof SystemFeatures,
      label: 'Open Day Module',
      description: 'Enable open day simulator and events',
      icon: Calendar,
    },
  ];

  const announcementTypes = [
    { value: 'info', label: 'Info', icon: Info, color: 'text-blue-600' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: 'text-green-600' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-yellow-600' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'text-red-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF3B3F] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-[#FF3B3F]" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">System Control</h1>
        </div>
        <p className="text-gray-600">
          Manage app-wide features and system announcements
        </p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl border-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="space-y-6">
        <div className="glass-light rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3D4A52] to-[#2A3439] text-white px-6 py-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Feature Toggles
            </h2>
            <p className="text-sm text-gray-300 mt-1">
              Enable or disable app features system-wide
            </p>
          </div>

          <div className="p-6 space-y-4">
            {featuresList.map((feature) => {
              const Icon = feature.icon;
              const isEnabled = features[feature.key];

              return (
                <div
                  key={feature.key}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${
                        isEnabled ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          isEnabled ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{feature.label}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setFeatures({ ...features, [feature.key]: !isEnabled })
                    }
                    className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                      isEnabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md ${
                        isEnabled ? 'left-9' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-light rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white px-6 py-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              System Announcement
            </h2>
            <p className="text-sm text-white/90 mt-1">
              Broadcast important messages to all users
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl">
              <div>
                <h3 className="font-bold text-gray-900">Show Announcement</h3>
                <p className="text-sm text-gray-600">
                  Display announcement banner to all users
                </p>
              </div>

              <button
                onClick={() =>
                  setAnnouncement({ ...announcement, active: !announcement.active })
                }
                className={`relative w-16 h-8 rounded-full transition-colors duration-300 ${
                  announcement.active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md ${
                    announcement.active ? 'left-9' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Announcement Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {announcementTypes.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() =>
                        setAnnouncement({
                          ...announcement,
                          type: type.value as any,
                        })
                      }
                      className={`p-3 border-2 rounded-xl font-medium transition flex flex-col items-center gap-2 ${
                        announcement.type === type.value
                          ? 'border-[#FF3B3F] bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <TypeIcon className={`w-5 h-5 ${type.color}`} />
                      <span className="text-sm">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Announcement Message
              </label>
              <textarea
                value={announcement.message}
                onChange={(e) =>
                  setAnnouncement({ ...announcement, message: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition resize-none"
                placeholder="Enter your announcement message..."
              />
              <p className="text-xs text-gray-500 mt-2">
                This message will be displayed in a banner at the top of the app
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={loadSystemControl}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:glass-light transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${saving ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className={`w-5 h-5 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
