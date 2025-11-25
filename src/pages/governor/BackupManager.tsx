import { useState } from 'react';
import { Database, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface Backup {
  id: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
  type: 'manual' | 'scheduled';
  notes?: string;
}

export default function BackupManager() {
  const [notes, setNotes] = useState('');
  const [backups] = useState<Backup[]>([
    { id: '1', timestamp: new Date(Date.now() - 2 * 60000), status: 'success', type: 'manual', notes: 'Manual backup before update' },
    { id: '2', timestamp: new Date(Date.now() - 2 * 3600000), status: 'success', type: 'scheduled' },
    { id: '3', timestamp: new Date(Date.now() - 5 * 3600000), status: 'pending', type: 'scheduled' },
    { id: '4', timestamp: new Date(Date.now() - 86400000), status: 'failed', type: 'manual', notes: 'Connection timeout' },
  ]);

  const createBackup = () => {
    alert(`Backup initiated${notes ? ` with notes: ${notes}` : ''}. This would trigger a real backup in production.`);
    setNotes('');
  };

  const getStatusIcon = (status: Backup['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Loader className="w-5 h-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: Backup['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Backup Manager</h1>
            <p className="text-green-100 mt-1">Create and manage system backups</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-light rounded-xl shadow-lg border border-gray-100 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">Create Manual Backup</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Backup Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this backup..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={createBackup}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Database className="w-5 h-5" />
            Create Backup
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-light rounded-xl shadow-lg border border-gray-100 p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Backup History
        </h2>

        <div className="space-y-3">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className={`p-4 rounded-xl border-2 ${getStatusColor(backup.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(backup.status)}
                  <div>
                    <div className="font-semibold text-gray-900">
                      {backup.type === 'manual' ? 'Manual backup' : 'Scheduled backup'}
                    </div>
                    {backup.notes && (
                      <div className="text-sm text-gray-600 mt-1">{backup.notes}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-900 uppercase">{backup.status}</div>
                  <div className="text-xs text-gray-600 mt-1">{formatTime(backup.timestamp)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
