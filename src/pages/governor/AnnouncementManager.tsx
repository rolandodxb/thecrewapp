import { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, Info, AlertTriangle, CheckCircle, Save, X, Calendar, Users, Eye, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { updateAnnouncement, getSystemControl, SystemAnnouncement } from '../../services/systemControlService';

type AnnouncementType = 'info' | 'warning' | 'error' | 'success';
type Priority = 'low' | 'medium' | 'high' | 'critical';
type Audience = 'all' | 'students' | 'crew' | 'mentors' | 'governors' | 'free' | 'basic' | 'pro' | 'vip';

const TEMPLATES = {
  maintenance: 'System maintenance scheduled for [DATE]. Services may be temporarily unavailable.',
  update: 'New features have been added! Check out the latest updates.',
  urgent: 'URGENT: Please review important changes to your account.',
  welcome: 'Welcome to Emirates Academy! Explore courses and start learning today.',
};

export default function AnnouncementManager() {
  const { currentUser } = useApp();
  const [type, setType] = useState<AnnouncementType>('info');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [priority, setPriority] = useState<Priority>('medium');
  const [audience, setAudience] = useState<Audience>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadCurrentAnnouncement();
  }, []);

  const loadCurrentAnnouncement = async () => {
    const control = await getSystemControl();
    if (control) {
      setCurrentAnnouncement(control.announcement);
      if (control.announcement.active) {
        setType(control.announcement.type);
        setMessage(control.announcement.message);
      }
    }
  };

  const types: { value: AnnouncementType; label: string; icon: any; color: string }[] = [
    { value: 'info', label: 'Info', icon: Info, color: 'blue' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'yellow' },
    { value: 'error', label: 'Error', icon: AlertCircle, color: 'red' },
    { value: 'success', label: 'Success', icon: CheckCircle, color: 'green' },
  ];

  const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'blue' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
  ];

  const audiences: { value: Audience; label: string; icon: any }[] = [
    { value: 'all', label: 'All Users', icon: Users },
    { value: 'students', label: 'Students Only', icon: Users },
    { value: 'crew', label: 'Crew Only', icon: Users },
    { value: 'mentors', label: 'Mentors Only', icon: Users },
    { value: 'governors', label: 'Governors Only', icon: Users },
    { value: 'free', label: 'Free Plan', icon: Users },
    { value: 'basic', label: 'Basic Plan', icon: Users },
    { value: 'pro', label: 'Pro Plan', icon: Users },
    { value: 'vip', label: 'VIP Plan', icon: Users },
  ];

  const applyTemplate = (template: keyof typeof TEMPLATES) => {
    setMessage(TEMPLATES[template]);
  };

  const createAnnouncement = async () => {
    if (!message.trim() || !currentUser) return;

    setLoading(true);
    try {
      await updateAnnouncement({
        active: true,
        message: message.trim(),
        type,
        timestamp: new Date().toISOString(),
        priority,
        audience,
        startDate: startDate || null,
        endDate: endDate || null,
      }, currentUser.uid);

      await loadCurrentAnnouncement();
      alert('Announcement published successfully!');
      resetForm();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to publish announcement');
    } finally {
      setLoading(false);
    }
  };

  const clearAnnouncement = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await updateAnnouncement({
        active: false,
        message: '',
        type: 'info',
        timestamp: null
      }, currentUser.uid);

      setMessage('');
      await loadCurrentAnnouncement();
      alert('Announcement removed successfully!');
    } catch (error) {
      console.error('Error clearing announcement:', error);
      alert('Failed to remove announcement');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMessage('');
    setType('info');
    setPriority('medium');
    setAudience('all');
    setStartDate('');
    setEndDate('');
    setShowPreview(false);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      red: 'bg-red-50 border-red-200 text-red-800',
      green: 'bg-green-50 border-green-200 text-green-800',
    };
    return colors[color];
  };

  return (
    <div className="glass-light border border-gray-200 rounded-xl p-3 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Announcement Manager</h1>
            <p className="text-sm text-gray-600">Create targeted system-wide announcements</p>
          </div>
        </div>
      </div>

      {currentAnnouncement && currentAnnouncement.active && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 border-2 ${getColorClasses(types.find(t => t.value === currentAnnouncement.type)?.color || 'blue')}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {(() => {
                const Icon = types.find(t => t.value === currentAnnouncement.type)?.icon || Info;
                return <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />;
              })()}
              <div className="flex-1 min-w-0">
                <div className="font-semibold mb-1">Current Active Announcement</div>
                <div className="break-words">{currentAnnouncement.message}</div>
                {currentAnnouncement.timestamp && (
                  <div className="text-xs opacity-70 mt-2">
                    Published: {new Date(currentAnnouncement.timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={clearAnnouncement}
              disabled={loading}
              className="text-gray-600 hover:text-gray-900 font-bold p-2 hover:bg-gray-200 rounded-lg transition disabled:opacity-50 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Quick Templates</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.keys(TEMPLATES).map((key) => (
              <button
                key={key}
                onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition capitalize"
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {types.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    type === t.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${type === t.value ? 'text-blue-600' : 'text-gray-600'}`} />
                  <div className="text-xs font-semibold">{t.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Priority</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {priorities.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={`px-4 py-2 rounded-xl border-2 transition-all text-sm font-semibold ${
                  priority === p.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Target Audience
          </label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as Audience)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {audiences.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Start Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              End Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your announcement message..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="text-xs text-gray-600 mt-1">{message.length} characters</div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition flex items-center gap-2"
          >
            <Eye className="w-5 h-5" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={createAnnouncement}
            disabled={!message.trim() || loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Publishing...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Publish Announcement
              </>
            )}
          </button>
        </div>

        {showPreview && message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`rounded-xl p-4 border-2 ${getColorClasses(types.find(t => t.value === type)?.color || 'blue')}`}
          >
            <div className="flex items-start gap-3">
              {(() => {
                const Icon = types.find(t => t.value === type)?.icon || Info;
                return <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />;
              })()}
              <div className="flex-1 min-w-0">
                <div className="font-semibold mb-1">Preview</div>
                <div className="break-words whitespace-pre-wrap">{message}</div>
                <div className="text-xs opacity-70 mt-2">
                  Priority: {priority.toUpperCase()} • Audience: {audiences.find(a => a.value === audience)?.label}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
