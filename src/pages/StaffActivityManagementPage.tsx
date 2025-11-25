import { useState, useEffect, useRef } from 'react';
import { Camera, X, Plus, Users, CheckCircle, Clock, DollarSign, Image as ImageIcon, QrCode, ChevronDown, ChevronUp, TrendingUp, Calendar, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  createActivity,
  getAllActivities,
  getActivityAttendees,
  scanQRAndCheckIn,
  getAllRegistrations,
  Activity,
  ActivityRegistration
} from '../services/simpleActivityService';

export default function StaffActivityManagementPage() {
  const { currentUser } = useApp();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [scanningActivity, setScanningActivity] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Record<string, ActivityRegistration[]>>({});
  const [allRegistrations, setAllRegistrations] = useState<ActivityRegistration[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    imageBase64: ''
  });

  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isStaff = currentUser?.role && ['governor', 'mentor', 'coach'].includes(currentUser.role);

  const calculateAnalytics = () => {
    // Calculate actual registration counts per activity
    const activityRegistrationCounts = new Map<string, number>();
    allRegistrations.forEach(reg => {
      const count = activityRegistrationCounts.get(reg.activityId) || 0;
      activityRegistrationCounts.set(reg.activityId, count + 1);
    });

    // Calculate revenue only from paid registrations
    const totalRevenue = allRegistrations.reduce((sum, reg) => {
      if (reg.paymentStatus === 'paid') {
        const activity = activities.find(a => a.id === reg.activityId);
        if (activity) {
          return sum + activity.price;
        }
      }
      return sum;
    }, 0);

    const totalParticipants = allRegistrations.length;

    const paidEvents = activities.filter(a => a.price > 0).length;
    const freeEvents = activities.filter(a => a.price === 0).length;

    return {
      totalRevenue,
      totalParticipants,
      totalEvents: activities.length,
      paidEvents,
      freeEvents,
      activityRegistrationCounts
    };
  };

  const analytics = calculateAnalytics();

  useEffect(() => {
    if (isStaff) {
      loadActivities();
    }
  }, [isStaff]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const [activitiesData, registrationsData] = await Promise.all([
        getAllActivities(),
        getAllRegistrations()
      ]);
      setActivities(activitiesData);
      setAllRegistrations(registrationsData);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async (activityId: string) => {
    try {
      const data = await getActivityAttendees(activityId);
      setAttendees(prev => ({ ...prev, [activityId]: data }));
    } catch (error) {
      console.error('Error loading attendees:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, imageBase64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !formData.name || !formData.description) return;

    try {
      await createActivity(
        formData.name,
        formData.description,
        formData.price,
        formData.imageBase64,
        currentUser.uid,
        currentUser.name,
        currentUser.email
      );

      setFormData({ name: '', description: '', price: 0, imageBase64: '' });
      setShowCreateForm(false);
      await loadActivities();
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Failed to create activity');
    }
  };

  const startScanning = async (activityId: string) => {
    setScanningActivity(activityId);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Unable to access camera. Please grant camera permissions.');
      setScanningActivity(null);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanningActivity(null);
    setScanResult(null);
  };

  const handleScanQR = async (qrData: string) => {
    if (!currentUser) return;

    const result = await scanQRAndCheckIn(qrData, currentUser.uid);
    setScanResult({
      type: result.success ? 'success' : 'error',
      message: result.message + (result.userName ? ` - ${result.userName}` : '')
    });

    if (result.success && scanningActivity) {
      await loadAttendees(scanningActivity);
      const updatedActivities = await getAllActivities();
      setActivities(updatedActivities);
    }

    setTimeout(() => setScanResult(null), 3000);
  };

  const toggleExpanded = async (activityId: string) => {
    if (expandedActivity === activityId) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(activityId);
      await loadAttendees(activityId);
    }
  };

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only mentors and governors can manage activities.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Activity Management</h1>
              <p className="text-gray-600">Create and manage events for students</p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center gap-2"
            >
              {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showCreateForm ? 'Cancel' : 'Create Activity'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Participants</p>
              <p className="text-3xl font-bold">{analytics.totalParticipants}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <Ticket className="w-8 h-8 opacity-80" />
                <Calendar className="w-5 h-5 opacity-60" />
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">Total Events</p>
              <p className="text-3xl font-bold">{analytics.totalEvents}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-orange-100 text-sm font-medium mb-1">Paid Events</p>
              <p className="text-3xl font-bold">{analytics.paidEvents}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 opacity-80" />
              </div>
              <p className="text-teal-100 text-sm font-medium mb-1">Free Events</p>
              <p className="text-3xl font-bold">{analytics.freeEvents}</p>
            </motion.div>
          </div>

          <AnimatePresence>
            {showCreateForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateActivity}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/50 shadow-lg"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Activity</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Activity Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                      placeholder="e.g., Morning Yoga Session"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                      placeholder="Describe the activity..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (USD) - Set to 0 for free events
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D71920] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Activity Image
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.imageBase64 && (
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                          <img src={formData.imageBase64} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageBase64: '' })}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-[#D71920] transition-colors text-center">
                          <ImageIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600">Click to upload image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-semibold hover:opacity-90 transition-all"
                  >
                    Create Activity
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {activities.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/30">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Activities Yet</h3>
            <p className="text-gray-600">Create your first activity to get started</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/30 shadow-lg"
              >
                <div className="flex flex-col md:flex-row">
                  {activity.imageBase64 && (
                    <div className="md:w-64 h-48 md:h-auto">
                      <img
                        src={activity.imageBase64}
                        alt={activity.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{activity.name}</h3>
                        <p className="text-gray-600 mb-3">{activity.description}</p>
                        {activity.price > 0 ? (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                            ${activity.price}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                            FREE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {analytics.activityRegistrationCounts.get(activity.id) || 0} registered
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {activity.checkedInCount || 0} checked in
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleExpanded(activity.id)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all flex items-center gap-2"
                      >
                        View Details
                        {expandedActivity === activity.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {scanningActivity === activity.id ? (
                        <button
                          onClick={stopScanning}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Stop Scanning
                        </button>
                      ) : (
                        <button
                          onClick={() => startScanning(activity.id)}
                          className="px-4 py-2 bg-[#D71920] hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Start Check-In
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {scanningActivity === activity.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 p-6 bg-gray-900"
                    >
                      <div className="relative aspect-video bg-black rounded-xl overflow-hidden max-w-2xl mx-auto">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-64 h-64 border-4 border-white rounded-xl opacity-50"></div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                          <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                            Position QR code within the frame
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 text-center">
                        <input
                          type="text"
                          placeholder="Or paste QR data manually"
                          onPaste={(e) => {
                            const data = e.clipboardData.getData('text');
                            if (data) handleScanQR(data);
                          }}
                          className="max-w-md px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>

                      {scanResult && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 p-4 rounded-lg text-center font-semibold ${
                            scanResult.type === 'success'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {scanResult.message}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {expandedActivity === activity.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 p-6"
                    >
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Registered Students</h4>
                      {attendees[activity.id]?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Payment</th>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {attendees[activity.id].map((attendee) => (
                                <tr key={attendee.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{attendee.userName}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{attendee.userEmail}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      attendee.paymentStatus === 'free'
                                        ? 'bg-green-100 text-green-700'
                                        : attendee.paymentStatus === 'paid'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {attendee.paymentStatus.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {attendee.checkedIn ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                        <CheckCircle className="w-3 h-3" />
                                        Checked In
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                                        <Clock className="w-3 h-3" />
                                        Registered
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No students registered yet
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
