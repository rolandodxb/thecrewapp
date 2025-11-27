import { motion } from 'framer-motion';
import { Shield, DollarSign, Terminal, Database, Bot, Users, BookOpen, Megaphone, Power, Bug, Layers, MessageSquare } from 'lucide-react';
import InspectionProtection from '../../components/InspectionProtection';
import NexusNavigator from '../../components/NexusNavigator';
import MetricsCards from '../../components/governor/nexus/MetricsCards';
import CommandConsole from '../../components/governor/nexus/CommandConsole';
import BackupControl from '../../components/governor/nexus/BackupControl';
import AIAssistantPanel from '../../components/governor/nexus/AIAssistantPanel';
import UserManager from '../../components/governor/nexus/UserManager';
import CourseManager from '../../components/governor/nexus/CourseManager';
import SupportChatManager from '../../components/governor/nexus/SupportChatManager';
import FinancePanel from '../../components/governor/nexus/FinancePanel';
import BugReportsManager from '../../components/governor/nexus/BugReportsManager';
import ModuleManager from '../../components/governor/nexus/ModuleManager';
import FeatureShutdownControl from './FeatureShutdownControl';
import AnnouncementManager from './AnnouncementManager';

export default function GovernorControlNexus() {
  const dashboards = [
    {
      id: 'overview',
      title: 'Governor Control Nexus',
      content: (
        <div className="space-y-6 p-4">
          <MetricsCards />
        </div>
      ),
    },
    {
      id: 'finance',
      title: 'Finance and Billing',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-green-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Finance and Billing</h1>
                <p className="text-gray-600 text-sm mt-1">Manage platform finances and revenue</p>
              </div>
            </div>
          </motion.div>

          <FinancePanel />
        </div>
      ),
    },
    {
      id: 'console',
      title: 'Command Console',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-purple-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Terminal className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Command Console</h1>
                <p className="text-gray-600 text-sm mt-1">Execute system commands and scripts</p>
              </div>
            </div>
          </motion.div>

          <CommandConsole />
        </div>
      ),
    },
    {
      id: 'backup',
      title: 'Backup Control',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-blue-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Backup Control</h1>
                <p className="text-gray-600 text-sm mt-1">Manage system backups and recovery</p>
              </div>
            </div>
          </motion.div>

          <BackupControl />
        </div>
      ),
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-pink-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Assistant</h1>
                <p className="text-gray-600 text-sm mt-1">Monitor and manage AI operations</p>
              </div>
            </div>
          </motion.div>

          <AIAssistantPanel />
        </div>
      ),
    },
    {
      id: 'users',
      title: 'User Manager',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-indigo-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Manager</h1>
                <p className="text-gray-600 text-sm mt-1">Manage user accounts and permissions</p>
              </div>
            </div>
          </motion.div>

          <UserManager />
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Content Manager',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-orange-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Content Manager</h1>
                <p className="text-gray-600 text-sm mt-1">Manage courses and educational content</p>
              </div>
            </div>
          </motion.div>

          <CourseManager />
        </div>
      ),
    },
    {
      id: 'announcements',
      title: 'Announcement Manager',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-yellow-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-md">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Announcement Manager</h1>
                <p className="text-gray-600 text-sm mt-1">Create and manage system announcements</p>
              </div>
            </div>
          </motion.div>

          <AnnouncementManager />
        </div>
      ),
    },
    {
      id: 'emergency',
      title: 'Emergency Shutdown Control',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-red-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                <Power className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Emergency Shutdown</h1>
                <p className="text-gray-600 text-sm mt-1">Emergency feature shutdown controls</p>
              </div>
            </div>
          </motion.div>

          <FeatureShutdownControl />
        </div>
      ),
    },
    {
      id: 'bug-reports',
      title: 'Bug Reports',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-teal-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <Bug className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bug Reports</h1>
                <p className="text-gray-600 text-sm mt-1">Review and manage bug reports</p>
              </div>
            </div>
          </motion.div>

          <BugReportsManager />
        </div>
      ),
    },
    {
      id: 'modules',
      title: 'Module Management',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-cyan-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Module Management</h1>
                <p className="text-gray-600 text-sm mt-1">Manage course modules and structure</p>
              </div>
            </div>
          </motion.div>

          <ModuleManager />
        </div>
      ),
    },
    {
      id: 'support-chat',
      title: 'Support Chat Manager',
      content: (
        <div className="space-y-6 p-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-light border-2 border-transparent hover:border-emerald-500 rounded-2xl p-6 shadow-lg transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Support Chat Manager</h1>
                <p className="text-gray-600 text-sm mt-1">Manage customer support conversations</p>
              </div>
            </div>
          </motion.div>

          <SupportChatManager />
        </div>
      ),
    },
  ];

  return (
    <InspectionProtection>
      <NexusNavigator dashboards={dashboards} />
    </InspectionProtection>
  );
}
