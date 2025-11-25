import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, MessageSquare, BookOpen, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { AnalyticsData, getAnalyticsSummary, getRealtimeMetrics } from '../../services/analyticsService';
import { motion } from 'framer-motion';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState({ messagesPerMinute: 0, activeNow: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadRealtimeMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await getAnalyticsSummary();
      setAnalytics(data);
      await loadRealtimeMetrics();
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeMetrics = async () => {
    try {
      const metrics = await getRealtimeMetrics();
      setRealtimeMetrics(metrics);
    } catch (error) {
      console.error('Error loading realtime metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) {
    return <div>Error loading analytics</div>;
  }

  const COLORS = ['#D71920', '#4F46E5', '#10B981', '#F59E0B'];

  const subscriptionData = [
    { name: 'Free', value: analytics.subscriptionsByPlan.free, color: '#94A3B8' },
    { name: 'Basic', value: analytics.subscriptionsByPlan.basic, color: '#3B82F6' },
    { name: 'Pro', value: analytics.subscriptionsByPlan.pro, color: '#8B5CF6' },
    { name: 'VIP', value: analytics.subscriptionsByPlan.vip, color: '#D71920' },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time platform metrics and insights</p>
          </div>
          <button
            onClick={loadAnalytics}
            className="px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
          >
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Total Users"
            value={analytics.totalUsers}
            subtitle={`${analytics.newUsersThisWeek} new this week`}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<Activity className="w-8 h-8" />}
            title="Active Users"
            value={realtimeMetrics.activeNow}
            subtitle="Online right now"
            color="from-green-500 to-green-600"
          />
          <StatCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Total Messages"
            value={analytics.totalMessages}
            subtitle={`${analytics.messagesThisWeek} this week`}
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Active Courses"
            value={analytics.activeCourses}
            subtitle={`${analytics.totalCourses} total`}
            color="from-[#D71920] to-[#B91518]"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">User Growth (30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '2px solid rgba(215, 25, 32, 0.2)',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#D71920"
                  strokeWidth={3}
                  dot={{ fill: '#D71920', r: 4 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Message Activity (30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.messageActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '2px solid rgba(215, 25, 32, 0.2)',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#D71920" radius={[8, 8, 0, 0]} name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Subscription Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {subscriptionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-700 font-medium">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Conversations</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {analytics.topConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 glass-card rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{conv.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">{conv.messageCount} messages</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Realtime Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
              <Activity className="w-12 h-12 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{realtimeMetrics.activeNow}</p>
                <p className="text-sm text-green-700">Users Online Now</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
              <MessageSquare className="w-12 h-12 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{realtimeMetrics.messagesPerMinute}</p>
                <p className="text-sm text-blue-700">Messages/Minute</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
              <TrendingUp className="w-12 h-12 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{analytics.enrollments}</p>
                <p className="text-sm text-purple-700">Total Enrollments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: string;
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-2">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </motion.div>
  );
}
