import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Download, Printer, Calendar, MapPin, DollarSign, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  getSellerAttendance,
  AttendanceRecord,
  downloadAttendanceCSV,
  printAttendance,
} from '../services/attendanceService';
import { getSellerProducts, MarketplaceProduct } from '../services/marketplaceService';
import { formatPrice } from '../services/stripeService';

export default function AttendanceDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activities, setActivities] = useState<MarketplaceProduct[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  useEffect(() => {
    filterAttendance();
  }, [selectedActivity, attendance]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [attendanceData, productsData] = await Promise.all([
        getSellerAttendance(currentUser.uid),
        getSellerProducts(currentUser.uid),
      ]);

      setAttendance(attendanceData);
      const activityProducts = productsData.filter(p => p.is_activity || p.product_type === 'activity');
      setActivities(activityProducts);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAttendance = () => {
    if (selectedActivity === 'all') {
      setFilteredAttendance(attendance);
    } else {
      setFilteredAttendance(attendance.filter(a => a.activity_id === selectedActivity));
    }
  };

  const handleDownloadCSV = () => {
    const activityTitle = selectedActivity === 'all'
      ? 'All Activities'
      : activities.find(a => a.id === selectedActivity)?.title || 'Activity';

    downloadAttendanceCSV(filteredAttendance, activityTitle);
  };

  const handlePrint = () => {
    const activityTitle = selectedActivity === 'all'
      ? 'All Activities'
      : activities.find(a => a.id === selectedActivity)?.title || 'Activity';

    printAttendance(filteredAttendance, activityTitle);
  };

  const totalRevenue = filteredAttendance.reduce((sum, a) => sum + a.amount_paid, 0);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to access attendance dashboard</p>
      </div>
    );
  }

  // Restrict access to mentors and governors only
  if (currentUser.role === 'student') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800">
              Only <strong>Mentors</strong> and <strong>Governors</strong> can access attendance tracking.
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            This feature is for activity organizers to track participant attendance.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Activity Attendance
          </h1>
          <p className="text-gray-600 mt-1">Manage and track attendance for your activities</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/20 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Attendees</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{filteredAttendance.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/20 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Activities</span>
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{activities.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/20 backdrop-blur-xl rounded-xl p-6 border border-white/30 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Total Revenue</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(totalRevenue, 'USD')}
            </div>
          </motion.div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Activity</label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/20 backdrop-blur-xl"
              >
                <option value="all">All Activities</option>
                {activities.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadCSV}
                disabled={filteredAttendance.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                disabled={filteredAttendance.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Attendance Records</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading attendance...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 backdrop-blur-sm divide-y divide-gray-200/50">
                  {filteredAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{record.activity_title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{record.attendee_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{record.attendee_email}</div>
                        <div className="text-xs text-gray-500">{record.attendee_phone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatPrice(record.amount_paid, record.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.payment_date?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
