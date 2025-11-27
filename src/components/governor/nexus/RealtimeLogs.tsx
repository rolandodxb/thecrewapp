import { motion } from 'framer-motion';
import { Clock, User, Activity } from 'lucide-react';
import { useFirestoreCollection } from '../../../hooks/useFirestoreRealtime';
import { orderBy, limit } from 'firebase/firestore';

interface AuditEvent {
  id: string;
  timestamp: any;
  eventType: string;
  userId: string;
  userName?: string;
  details?: string;
}

export default function RealtimeLogs() {
  const { data: events, loading } = useFirestoreCollection<AuditEvent>('audit');

  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.timestamp?.toDate?.() || new Date(0);
    const timeB = b.timestamp?.toDate?.() || new Date(0);
    return timeB.getTime() - timeA.getTime();
  }).slice(0, 10);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'login':
      case 'register':
        return 'text-green-700 bg-green-50 border-green-300';
      case 'logout':
        return 'text-gray-700 bg-gray-100 border-gray-300';
      case 'error':
      case 'failed':
        return 'text-red-700 bg-[#D71920]/10 border-red-300';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-300';
      case 'command':
        return 'text-[#D71920] bg-[#D71920]/10 border-red-300';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-light rounded-xl shadow-lg p-6 border-2 border-transparent hover:border-gray-200 transition"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-gray-700" />
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Real-time Audit Logs</h2>
        {!loading && (
          <span className="ml-auto text-xs text-gray-600 px-2 py-1 glass-bubble rounded-full">{events.length} events</span>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading logs...</div>
        ) : sortedEvents.length === 0 ? (
          <div className="text-center py-8 glass-light rounded-xl border-2 border-gray-200">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600">No logs yet</p>
            <p className="text-xs text-gray-500 mt-1">Events will appear here in real-time</p>
          </div>
        ) : (
          sortedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 glass-light rounded-lg border border-gray-200 hover:border-gray-300 transition"
            >
              <div className="flex items-start gap-3">
                <div className={`px-2 py-1 rounded border text-xs font-bold uppercase tracking-wide ${getEventColor(event.eventType)}`}>
                  {event.eventType}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className="font-medium text-gray-800 truncate">
                      {event.userName || event.userId || 'Unknown'}
                    </span>
                  </div>
                  {event.details && (
                    <p className="text-xs text-gray-600 mt-1">{event.details}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(event.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
