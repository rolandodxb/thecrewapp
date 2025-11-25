import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Filter, Search, X, Shield } from 'lucide-react';
import { auditLogService, AuditLog } from '../../services/auditLogService';
import InspectionProtection from '../../components/InspectionProtection';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    category: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filterObj: any = {};
      if (filters.userId) filterObj.userId = filters.userId;
      if (filters.category) filterObj.category = filters.category;

      const fetchedLogs = await auditLogService.getLogs(filterObj, 100);
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csvContent = await auditLogService.exportToCSV(logs);
      auditLogService.downloadCSV(csvContent, `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Failed to export logs');
    }
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      category: '',
      startDate: '',
      endDate: ''
    });
  };

  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    return (
      log.userEmail.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.category.toLowerCase().includes(query)
    );
  });

  const categories = ['role_change', 'feature_shutdown', 'moderation', 'admin_action', 'system'];

  return (
    <InspectionProtection>
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="liquid-crystal-panel p-4 md:p-6 mb-4">
            <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#D71920] to-[#B91518] rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-[#D71920] to-[#B91518] bg-clip-text text-transparent">
                  Audit Logs
                </h1>
              </div>
              <div className="flex gap-2 md:gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 liquid-card-overlay text-gray-700 rounded-xl font-bold hover:bg-white/80 transition text-sm md:text-base"
                >
                  <Filter className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Filters</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExport}
                  disabled={logs.length === 0}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 text-sm md:text-base"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Export</span>
                </motion.button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 chat-input-field text-sm md:text-base"
              />
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 liquid-card-overlay rounded-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs md:text-sm text-[#D71920] font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">User ID</label>
                    <input
                      type="text"
                      value={filters.userId}
                      onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                      placeholder="Enter user ID"
                      className="w-full chat-input-field text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-bold text-gray-700 mb-2">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full chat-input-field text-sm md:text-base"
                    >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadLogs}
                  className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition text-sm md:text-base"
                >
                  Apply Filters
                </motion.button>
              </motion.div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-4 border-[#D71920] border-t-transparent"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="liquid-crystal-panel p-8 md:p-12 text-center">
              <Shield className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">No audit logs found</h3>
              <p className="text-sm md:text-base text-gray-600">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="liquid-crystal-panel overflow-hidden rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/50 border-b-2 border-white/30">
                    <tr>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-900">Date/Time</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-900">User</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-900">Action</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-900">Category</th>
                      <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-bold text-gray-900 hidden md:table-cell">Details</th>
                  </tr>
                </thead>
                  <tbody>
                    {filteredLogs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/20 hover:bg-white/30 transition"
                      >
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                          <div>{log.createdAt.toDate().toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {log.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <div className="text-xs md:text-sm font-semibold text-gray-900 truncate max-w-[120px] md:max-w-none">{log.userEmail}</div>
                          <div className="text-xs text-gray-500">{log.userId.substring(0, 8)}...</div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-800">{log.action}</td>
                        <td className="px-3 md:px-6 py-3 md:py-4">
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            log.category === 'role_change' ? 'bg-blue-100 text-blue-700' :
                            log.category === 'feature_shutdown' ? 'bg-orange-100 text-orange-700' :
                            log.category === 'moderation' ? 'bg-red-100 text-red-700' :
                            log.category === 'admin_action' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {log.category.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 max-w-xs truncate hidden md:table-cell">
                          {JSON.stringify(log.details)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </InspectionProtection>
  );
}
