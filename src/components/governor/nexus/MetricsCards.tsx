import { Users, MessageCircle, Activity, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirestoreCollection } from '../../../hooks/useFirestoreRealtime';
import { where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface SystemStatus {
  chatEnabled?: boolean;
  quizEnabled?: boolean;
  aiEnabled?: boolean;
  downloadsEnabled?: boolean;
}

export default function MetricsCards() {
  const { data: allUsers } = useFirestoreCollection('users');
  const { data: conversations } = useFirestoreCollection('conversations');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const statusDoc = await getDoc(doc(db, 'systemControl', 'status'));
        if (statusDoc.exists()) {
          setSystemStatus(statusDoc.data() as SystemStatus);
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
  }, []);

  const activeUsers = allUsers.filter((user: any) => user.status === 'online').length;
  const totalUsers = allUsers.length;
  const activeConversations = conversations.length;

  const systemHealth = loading ? 100 : (
    (systemStatus.chatEnabled ? 25 : 0) +
    (systemStatus.quizEnabled ? 25 : 0) +
    (systemStatus.aiEnabled ? 25 : 0) +
    (systemStatus.downloadsEnabled ? 25 : 0)
  );

  const metrics = [
    {
      label: 'Active Users',
      value: loading ? '...' : `${activeUsers}/${totalUsers}`,
      icon: Users,
      color: 'from-[#D71920] to-[#B91518]',
      change: totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}%` : '0%',
    },
    {
      label: 'Conversations',
      value: loading ? '...' : activeConversations.toString(),
      icon: MessageCircle,
      color: 'from-[#3D4A52] to-[#2A3439]',
      change: activeConversations > 0 ? 'Active' : 'None',
    },
    {
      label: 'System Health',
      value: `${systemHealth}%`,
      icon: Activity,
      color: 'from-green-600 to-green-700',
      change: systemHealth === 100 ? 'Optimal' : 'Degraded',
    },
    {
      label: 'AI Assistant',
      value: loading ? '...' : (systemStatus.aiEnabled ? 'Online' : 'Offline'),
      icon: Brain,
      color: 'from-[#5A6B75] to-[#3D4A52]',
      change: systemStatus.aiEnabled ? 'Active' : 'Disabled',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-light rounded-xl p-6 shadow-lg hover:shadow-xl transition border-2 border-transparent hover:border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-md`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-gray-600 px-3 py-1 glass-bubble rounded-full uppercase tracking-wide">
                {metric.change}
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">{metric.value}</div>
            <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">{metric.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
