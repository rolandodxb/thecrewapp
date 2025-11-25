import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Calendar, User, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AILog {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  created_at: string;
  model: string;
  tokens_used?: number;
}

export default function AILogsViewer() {
  const [logs, setLogs] = useState<AILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AILog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('ai_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching AI logs:', err);
      setError(err.message || 'Failed to load AI logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id.includes(searchTerm)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-700">Loading AI logs...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-6 border border-gray-200"
      >
        <div className="flex items-center text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6 border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#5A6B75]/20 rounded-xl">
            <FileText className="w-5 h-5 text-[#5A6B75]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Logs</h3>
            <p className="text-sm text-gray-600">{logs.length} total requests</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by prompt, response, or user ID..."
            className="w-full pl-10 pr-4 py-2 glass-bubble border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No AI logs found</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-light rounded-xl p-4 border border-gray-300 hover:border-gray-300 transition-colors cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(log.created_at)}</span>
                  <User className="w-4 h-4 ml-2" />
                  <span className="font-mono text-xs">{log.user_id.substring(0, 8)}...</span>
                </div>
                {log.tokens_used && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {log.tokens_used} tokens
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Prompt:</span>
                  <p className="text-sm text-gray-900 mt-1">{truncateText(log.prompt)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Response:</span>
                  <p className="text-sm text-gray-700 mt-1">{truncateText(log.response)}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {selectedLog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-light rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">AI Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Timestamp</span>
                <p className="text-gray-900 mt-1">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>

              <div>
                <span className="text-sm text-gray-600">User ID</span>
                <p className="text-gray-900 mt-1 font-mono text-sm">{selectedLog.user_id}</p>
              </div>

              <div>
                <span className="text-sm text-gray-600">Model</span>
                <p className="text-gray-900 mt-1">{selectedLog.model}</p>
              </div>

              {selectedLog.tokens_used && (
                <div>
                  <span className="text-sm text-gray-600">Tokens Used</span>
                  <p className="text-gray-900 mt-1">{selectedLog.tokens_used}</p>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-600">Prompt</span>
                <div className="mt-1 p-4 glass-bubble rounded-xl">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedLog.prompt}</p>
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-600">Response</span>
                <div className="mt-1 p-4 glass-bubble rounded-xl">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedLog.response}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
