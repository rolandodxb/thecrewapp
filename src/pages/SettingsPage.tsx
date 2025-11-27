import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, Lock, Bell, Globe, Palette, Shield, Trash2, Mail, Camera, Save, Smartphone, Monitor, MapPin, Clock } from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit as limitQuery, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { countries } from '../data/countries';
import { useNavigate } from 'react-router-dom';
import TwoFactorSetup from '../components/TwoFactorSetup';
import { Copy, Check } from 'lucide-react';

type SettingsTab = 'profile' | 'account' | 'notifications' | 'preferences' | 'privacy';

export default function SettingsPage() {
  const { currentUser, setCurrentUser } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [country, setCountry] = useState(currentUser?.country || '');
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [communityMessages, setCommunityMessages] = useState(true);
  const [mentorMessages, setMentorMessages] = useState(true);

  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [language, setLanguage] = useState('en');

  const [loginSessions, setLoginSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);


  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setCountry(currentUser.country || '');
      setPhotoURL(currentUser.photoURL || '');

      if (activeTab === 'privacy') {
        loadLoginSessions();
      }
    }
  }, [currentUser, activeTab]);


  const loadLoginSessions = async () => {
    if (!currentUser) return;

    setLoadingSessions(true);
    try {
      const q = query(
        collection(db, 'loginActivity'),
        where('userId', '==', currentUser.uid),
        where('success', '==', true),
        orderBy('timestamp', 'desc'),
        limitQuery(10)
      );

      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLoginSessions(sessions);
    } catch (error) {
      console.error('Error loading login sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Revoke this session? You will need to log in again from that device.')) return;

    try {
      await deleteDoc(doc(db, 'loginActivity', sessionId));
      setLoginSessions(prev => prev.filter(s => s.id !== sessionId));
      setMessage('Session revoked successfully!');
    } catch (error) {
      console.error('Error revoking session:', error);
      setMessage('Failed to revoke session.');
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    return deviceType === 'mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        bio,
        country,
        photoURL,
        updatedAt: new Date().toISOString(),
      });

      setCurrentUser({
        ...currentUser,
        name,
        bio,
        country,
        photoURL,
      });

      setMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long!');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully!');
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        setMessage('Current password is incorrect!');
      } else {
        setMessage('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentUser) return;

    setLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        notificationSettings: {
          email: emailNotifications,
          push: pushNotifications,
          courseUpdates,
          communityMessages,
          mentorMessages,
        },
        updatedAt: new Date().toISOString(),
      });

      setMessage('Notification preferences saved!');
    } catch (error) {
      console.error('Notification update error:', error);
      setMessage('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!currentUser) return;

    setLoading(true);
    setMessage('');

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        preferences: {
          theme,
          language,
        },
        updatedAt: new Date().toISOString(),
      });

      setMessage('Preferences saved!');
    } catch (error) {
      console.error('Preferences update error:', error);
      setMessage('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'account' as SettingsTab, label: 'Account', icon: Lock },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'preferences' as SettingsTab, label: 'Preferences', icon: Palette },
    { id: 'privacy' as SettingsTab, label: 'Privacy', icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl ${message.includes('success') || message.includes('saved') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 flex-shrink-0">
          <div className="glass-card rounded-2xl p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#D71920] to-[#B91518] text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1">
          <div className="glass-card rounded-2xl p-6 md:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Photo URL
                  </label>
                  <div className="flex items-center gap-4">
                    <img
                      src={photoURL || `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2260%22 dy=%2210.5rem%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3E${name?.[0] || 'U'}%3C/text%3E%3C/svg%3E`}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
                    />
                    <div className="flex-1">
                      <input
                        type="url"
                        value={photoURL}
                        onChange={(e) => setPhotoURL(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  >
                    <option value="">Select your country</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'account' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">Current Plan</p>
                        <p className="text-sm text-gray-600 capitalize">{currentUser?.plan || 'Free'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">Account Type</p>
                        <p className="text-sm text-gray-600 capitalize">{currentUser?.role || 'Student'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <TwoFactorSetup />
                </div>

              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D71921]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71921]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-600">Receive push notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushNotifications}
                        onChange={(e) => setPushNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D71921]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71921]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Course Updates</p>
                      <p className="text-sm text-gray-600">Get notified about new courses and updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={courseUpdates}
                        onChange={(e) => setCourseUpdates(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D71921]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71921]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Community Messages</p>
                      <p className="text-sm text-gray-600">Notifications from community chats</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={communityMessages}
                        onChange={(e) => setCommunityMessages(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D71921]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71921]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-gray-900">Mentor Messages</p>
                      <p className="text-sm text-gray-600">Direct messages from mentors</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mentorMessages}
                        onChange={(e) => setMentorMessages(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#D71921]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D71921]"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">App Preferences</h2>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark (Coming Soon)</option>
                    <option value="auto">Auto (Coming Soon)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71921] focus:ring-2 focus:ring-[#D71921]/20 transition"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic (Coming Soon)</option>
                    <option value="fr">French (Coming Soon)</option>
                    <option value="es">Spanish (Coming Soon)</option>
                  </select>
                </div>

                <button
                  onClick={handleSavePreferences}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy & Security</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                      Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                      Add an extra layer of security to your account with Google Authenticator.
                    </p>
                    <button
                      onClick={() => navigate('/settings/security/2fa')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Setup 2FA (Coming Soon)
                    </button>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-[#D71921]" />
                        Active Login Sessions
                      </h3>
                      <button
                        onClick={() => navigate('/login-activity')}
                        className="text-sm text-[#D71921] hover:underline font-semibold"
                      >
                        View All Activity →
                      </button>
                    </div>

                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : loginSessions.length === 0 ? (
                      <p className="text-sm text-gray-600 py-4">No active sessions found.</p>
                    ) : (
                      <div className="space-y-3">
                        {loginSessions.slice(0, 3).map((session, index) => (
                          <div key={session.id} className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                {getDeviceIcon(session.deviceType)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {session.browser} on {session.os}
                                  {index === 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                      CURRENT
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                  <Clock className="w-3 h-3" />
                                  <span>{session.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}</span>
                                </div>
                                {session.ipAddress && (
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                    <MapPin className="w-3 h-3" />
                                    <span className="font-mono">{session.ipAddress}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {index !== 0 && (
                              <button
                                onClick={() => handleRevokeSession(session.id)}
                                className="ml-3 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#D71921]" />
                      Data Privacy
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Your data is encrypted and stored securely. We never share your personal information with third parties without your consent.
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#D71921]" />
                      Contact Privacy
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Control who can send you messages and view your profile information.
                    </p>
                  </div>

                  <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                    <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-600" />
                      Delete Account
                    </h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          alert('Account deletion feature will be implemented soon. Please contact support for assistance.');
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
