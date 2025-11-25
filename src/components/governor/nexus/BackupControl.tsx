import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useFirestoreCollection } from '../../../hooks/useFirestoreRealtime';

interface Backup {
  id: string;
  timestamp: any;
  size?: string;
  result: 'success' | 'failed';
  details?: string;
}

export default function BackupControl() {
  const { data: backups, loading } = useFirestoreCollection<Backup>('backups');
  const [triggering, setTriggering] = useState(false);

  const sortedBackups = [...backups].sort((a, b) => {
    const timeA = a.timestamp?.toDate?.() || new Date(0);
    const timeB = b.timestamp?.toDate?.() || new Date(0);
    return timeB.getTime() - timeA.getTime();
  });

  const handleManualBackup = async () => {
    setTriggering(true);
    try {
      // TODO: Replace with actual Cloud Function endpoint
      // const response = await fetch('/api/triggerManualBackup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // const data = await response.json();

      alert('Manual backup triggered. Cloud Function integration pending.');
    } catch (error) {
      console.error('Error triggering backup:', error);
      alert('Failed to trigger backup');
    } finally {
      setTriggering(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatSize = (size?: string) => {
    if (!size) return 'Unknown';
    return size;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-lg glass-light/80 rounded-xl shadow-lg border border-gray-200/50 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Backup Control</h2>
        </div>
        <button
          onClick={handleManualBackup}
          disabled={triggering}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {triggering ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Manual Backup
        </button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading backup history...</div>
        ) : sortedBackups.length === 0 ? (
          <div className="text-center py-8 glass-light/50 rounded-lg">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No backups found yet</p>
            <p className="text-xs text-gray-400 mt-1">Trigger a manual backup to get started</p>
          </div>
        ) : (
          sortedBackups.map((backup, index) => (
            <motion.div
              key={backup.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border ${
                backup.result === 'success'
                  ? 'bg-green-50/50 border-green-200'
                  : 'bg-[#D71920]/10/50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {backup.result === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${
                        backup.result === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {backup.result === 'success' ? 'Backup Successful' : 'Backup Failed'}
                      </span>
                      {backup.size && (
                        <span className="text-xs text-gray-500 px-2 py-0.5 glass-light rounded-full">
                          {formatSize(backup.size)}
                        </span>
                      )}
                    </div>
                    {backup.details && (
                      <p className="text-xs text-gray-600 mt-1">{backup.details}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(backup.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Note:</strong> Cloud Function endpoint (/triggerManualBackup) needs to be implemented.
        </p>
      </div>
    </motion.div>
  );
}
