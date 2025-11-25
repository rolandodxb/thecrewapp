import { useState, useEffect } from 'react';
import { Bell, Check, Settings, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  getUserPreferences,
  updateUserPreferences,
  initializeUserPreferences,
  NotificationPreferences,
} from '../services/unifiedNotificationService';

export default function NotificationSettingsPage() {
  const { currentUser } = useApp();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, [currentUser]);

  async function loadPreferences() {
    if (!currentUser) return;

    setLoading(true);
    try {
      let prefs = await getUserPreferences(currentUser.uid);

      if (!prefs) {
        await initializeUserPreferences(currentUser.uid);
        prefs = await getUserPreferences(currentUser.uid);
      }

      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!currentUser || !preferences) return;

    setSaving(true);
    setSaveMessage('');

    try {
      const success = await updateUserPreferences(currentUser.uid, preferences);

      if (success) {
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveMessage('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(key: keyof NotificationPreferences) {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Preferences</h2>
          <p className="text-gray-600 mb-4">Unable to load your notification settings.</p>
          <button
            onClick={loadPreferences}
            className="px-6 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Notification Settings</h1>
            <p className="text-gray-600">Manage what notifications you receive</p>
          </div>
        </div>

        <div className="space-y-6">
          <Section title="Bug Reports" icon={<Bell />}>
            <Toggle
              label="Status Changes"
              description="Get notified when bug report status changes"
              checked={preferences.bug_report_status_changes}
              onChange={() => handleToggle('bug_report_status_changes')}
            />
            <Toggle
              label="New Comments"
              description="Get notified when someone comments on bug reports"
              checked={preferences.bug_report_new_comments}
              onChange={() => handleToggle('bug_report_new_comments')}
            />
            <Toggle
              label="Assigned to Me"
              description="Get notified when a bug is assigned to you"
              checked={preferences.bug_report_assigned}
              onChange={() => handleToggle('bug_report_assigned')}
            />
          </Section>

          <Section title="Chat & Messaging" icon={<Bell />}>
            <Toggle
              label="Private Messages"
              description="Get notified for new private messages"
              checked={preferences.chat_private_messages}
              onChange={() => handleToggle('chat_private_messages')}
            />
            <Toggle
              label="Group Messages"
              description="Get notified for group chat messages"
              checked={preferences.chat_group_messages}
              onChange={() => handleToggle('chat_group_messages')}
            />
            <Toggle
              label="Community Chat"
              description="Get notified for public community chat messages"
              checked={preferences.chat_community_messages}
              onChange={() => handleToggle('chat_community_messages')}
            />
            <Toggle
              label="Mentions"
              description="Get notified when someone mentions you"
              checked={preferences.chat_mentions}
              onChange={() => handleToggle('chat_mentions')}
            />
          </Section>

          <Section title="Community Feed" icon={<Bell />}>
            <Toggle
              label="New Posts"
              description="Get notified when new posts are created"
              checked={preferences.community_new_posts}
              onChange={() => handleToggle('community_new_posts')}
            />
            <Toggle
              label="Post Comments"
              description="Get notified for comments on posts"
              checked={preferences.community_post_comments}
              onChange={() => handleToggle('community_post_comments')}
            />
            <Toggle
              label="Post Reactions"
              description="Get notified for reactions on posts"
              checked={preferences.community_post_reactions}
              onChange={() => handleToggle('community_post_reactions')}
            />
            <Toggle
              label="My Post Activity"
              description="Get notified for activity on your posts"
              checked={preferences.community_my_post_activity}
              onChange={() => handleToggle('community_my_post_activity')}
            />
          </Section>

          <Section title="System Notifications" icon={<Bell />}>
            <Toggle
              label="New Features"
              description="Get notified about new feature releases"
              checked={preferences.system_new_features}
              onChange={() => handleToggle('system_new_features')}
            />
            <Toggle
              label="Feature Shutdowns"
              description="Get notified when features are disabled"
              checked={preferences.system_feature_shutdowns}
              onChange={() => handleToggle('system_feature_shutdowns')}
            />
            <Toggle
              label="System Announcements"
              description="Get notified about important announcements"
              checked={preferences.system_announcements}
              onChange={() => handleToggle('system_announcements')}
            />
            <Toggle
              label="Maintenance Alerts"
              description="Get notified about system maintenance"
              checked={preferences.system_maintenance}
              onChange={() => handleToggle('system_maintenance')}
            />
          </Section>

          <Section title="Learning & Progress" icon={<Bell />}>
            <Toggle
              label="New Courses"
              description="Get notified when new courses are available"
              checked={preferences.learning_new_courses}
              onChange={() => handleToggle('learning_new_courses')}
            />
            <Toggle
              label="New Modules"
              description="Get notified when new modules are added"
              checked={preferences.learning_new_modules}
              onChange={() => handleToggle('learning_new_modules')}
            />
            <Toggle
              label="Course Updates"
              description="Get notified about course changes"
              checked={preferences.learning_course_updates}
              onChange={() => handleToggle('learning_course_updates')}
            />
            <Toggle
              label="Exam Reminders"
              description="Get reminders about upcoming exams"
              checked={preferences.learning_exam_reminders}
              onChange={() => handleToggle('learning_exam_reminders')}
            />
            <Toggle
              label="Achievements"
              description="Get notified when you unlock achievements"
              checked={preferences.learning_achievements}
              onChange={() => handleToggle('learning_achievements')}
            />
          </Section>

          <Section title="Security Alerts" icon={<AlertCircle />} critical>
            <Toggle
              label="Unknown Logins"
              description="Get alerted about logins from new devices"
              checked={preferences.security_unknown_logins}
              onChange={() => handleToggle('security_unknown_logins')}
              critical
            />
            <Toggle
              label="Account Restrictions"
              description="Get notified about account restrictions"
              checked={preferences.security_account_restrictions}
              onChange={() => handleToggle('security_account_restrictions')}
              critical
            />
            <Toggle
              label="Password Changes"
              description="Get notified when your password is changed"
              checked={preferences.security_password_changes}
              onChange={() => handleToggle('security_password_changes')}
              critical
            />
          </Section>

          <Section title="Delivery Methods" icon={<Bell />}>
            <Toggle
              label="Email Notifications"
              description="Receive notifications via email"
              checked={preferences.email_notifications}
              onChange={() => handleToggle('email_notifications')}
            />
            <Toggle
              label="Push Notifications"
              description="Receive browser push notifications"
              checked={preferences.push_notifications}
              onChange={() => handleToggle('push_notifications')}
            />
          </Section>

          <div className="flex items-center justify-between gap-4 pt-6">
            <div>
              {saveMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-bold ${
                    saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {saveMessage}
                </motion.p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  critical?: boolean;
}

function Section({ title, icon, children, critical }: SectionProps) {
  return (
    <div className={`glass-card rounded-2xl p-6 border-2 ${critical ? 'border-red-200' : 'border-white/40'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-10 h-10 bg-gradient-to-br ${
            critical ? 'from-red-500 to-red-600' : 'from-[#D71920] to-[#B91518]'
          } rounded-full flex items-center justify-center text-white`}
        >
          {icon}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  critical?: boolean;
}

function Toggle({ label, description, checked, onChange, critical }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 mb-1">{label}</h3>
        <p className="text-sm text-gray-600">{description}</p>
        {critical && <p className="text-xs text-red-600 mt-1 font-bold">⚠️ Security Critical</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-14 h-7 rounded-full transition ${
          checked ? 'bg-gradient-to-r from-[#D71920] to-[#B91518]' : 'bg-gray-300'
        }`}
      >
        <motion.div
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
          animate={{ left: checked ? '32px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
