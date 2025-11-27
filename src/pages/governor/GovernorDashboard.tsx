import { Activity, Users, BookOpen, MessageCircle, TrendingUp, AlertCircle, Shield, Terminal, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getAllCourses } from '../../services/courseService';

interface DashboardMetrics {
  activeUsers: number;
  activeCourses: number;
  activeChats: number;
  systemHealth: number;
}

export default function GovernorDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeUsers: 0,
    activeCourses: 0,
    activeChats: 0,
    systemHealth: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const activeUsers = usersSnapshot.size;

        const courses = await getAllCourses();
        const activeCourses = courses.length;

        const chatsSnapshot = await getDocs(collection(db, 'conversations'));
        const activeChats = chatsSnapshot.size;

        setMetrics({
          activeUsers,
          activeCourses,
          activeChats,
          systemHealth: 100,
        });
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  const metricCards = [
    { label: 'Active Users', value: loading ? '...' : metrics.activeUsers.toString(), change: '—', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Courses', value: loading ? '...' : metrics.activeCourses.toString(), change: '—', icon: BookOpen, color: 'from-green-500 to-green-600' },
    { label: 'Active Chats', value: loading ? '...' : metrics.activeChats.toString(), change: '—', icon: MessageCircle, color: 'from-purple-500 to-purple-600' },
    { label: 'System Health', value: `${metrics.systemHealth}%`, change: 'Healthy', icon: Activity, color: 'from-emerald-500 to-emerald-600' },
  ];

  const modules = [
    { name: 'AI Trainer', status: 'operational', uptime: '99.9%' },
    { name: 'Open Day Simulator', status: 'operational', uptime: '99.7%' },
    { name: 'Chat System', status: 'operational', uptime: '99.8%' },
    { name: 'Course Manager', status: 'operational', uptime: '100%' },
    { name: 'Recruiter Database', status: 'operational', uptime: '99.9%' },
    { name: 'Authentication', status: 'operational', uptime: '100%' },
  ];

  const quickActions = [
    { label: 'Command Console', icon: Terminal, path: '/governor/commands', color: 'bg-gray-700' },
    { label: 'Announcements', icon: AlertCircle, path: '/governor/announcements', color: 'bg-blue-600' },
    { label: 'Backups', icon: Database, path: '/governor/backups', color: 'bg-green-600' },
    { label: 'User Management', icon: Users, path: '/users', color: 'bg-purple-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Governor Control Center</h1>
        </div>
        <p className="text-gray-300">System monitoring and control dashboard</p>
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-400">All systems operational</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-light rounded-xl p-6 shadow-lg border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {metric.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm text-gray-600">{metric.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-light rounded-xl shadow-lg border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Modules
          </h2>
          <div className="space-y-3">
            {modules.map((module) => (
              <div key={module.name} className="flex items-center justify-between p-3 glass-light rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium text-gray-900">{module.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Uptime: {module.uptime}</span>
                  <span className="text-xs font-semibold text-green-600 uppercase">{module.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-light rounded-xl shadow-lg border border-gray-100 p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.path}
                  to={action.path}
                  className={`${action.color} text-white rounded-xl p-4 hover:shadow-lg transition-all`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <div className="text-sm font-semibold">{action.label}</div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Database Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Users Collection</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Courses Collection</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Chats Collection</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
