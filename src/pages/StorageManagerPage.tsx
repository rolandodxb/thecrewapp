import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Download, Eye, EyeOff, Search, Filter, HardDrive, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import {
  FileMetadata,
  StorageQuota,
  getUserFiles,
  getUserStorageQuota,
  deleteFile,
  uploadFile,
  formatFileSize,
} from '../services/storageManagementService';

export default function StorageManagerPage() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      loadUserFiles();
      loadQuota();
    }
  }, [currentUser]);

  const loadUserFiles = async () => {
    if (!currentUser) return;

    try {
      const userFiles = await getUserFiles(currentUser.uid);
      setFiles(userFiles.sort((a, b) => b.uploadedAt.seconds - a.uploadedAt.seconds));
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuota = async () => {
    if (!currentUser) return;

    try {
      const userQuota = await getUserStorageQuota(currentUser.uid);
      setQuota(userQuota);
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setUploading(true);

    try {
      await uploadFile(file, currentUser.uid, currentUser.displayName || 'User', 'general', false);
      await loadUserFiles();
      await loadQuota();
    } catch (error: any) {
      alert(error.message || 'Error uploading file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!currentUser || !confirm('Delete this file?')) return;

    try {
      await deleteFile(fileId, currentUser.uid);
      await loadUserFiles();
      await loadQuota();
    } catch (error: any) {
      alert(error.message || 'Error deleting file');
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(files.map((f) => f.category || 'general')));
  const percentUsed = quota ? (quota.usedBytes / quota.limitBytes) * 100 : 0;

  // Block free users from file management
  if (currentUser && currentUser.plan === 'free') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <HardDrive className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">File Management</h2>
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              File management is available for <strong>Pro</strong> and <strong>VIP</strong> members only.
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Upgrade to store and manage your files securely in the cloud.
          </p>
          <button
            onClick={() => navigate('/upgrade')}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg font-semibold"
          >
            <Crown className="w-5 h-5 inline mr-2" />
            Upgrade Now
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Storage Manager</h1>
            <p className="text-gray-600">Manage your uploaded files</p>
          </div>
          <label className="cursor-pointer px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {uploading ? 'Uploading...' : 'Upload File'}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {quota && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Storage Quota</h2>
              <span className="text-sm text-gray-600">
                {formatFileSize(quota.usedBytes)} / {formatFileSize(quota.limitBytes)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentUsed}%` }}
                className={`h-full rounded-full ${
                  percentUsed > 90
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : percentUsed > 70
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-[#D71920] to-[#B91518]'
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{quota.fileCount} files</span>
              <span>{percentUsed.toFixed(1)}% used</span>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#D71920] outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredFiles.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Files Found</h3>
              <p className="text-gray-600 mb-6">Upload your first file to get started</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{file.fileName}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>{formatFileSize(file.fileSize)}</span>
                      <span>{file.category}</span>
                      <span>
                        {file.uploadedAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                      </span>
                    </div>
                    {file.description && (
                      <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={file.fileUrl}
                      download={file.fileName}
                      className="p-2 glass-card rounded-lg hover:bg-white/40 transition"
                      title="Download"
                    >
                      <Download className="w-5 h-5 text-gray-700" />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id!)}
                      className="p-2 glass-card rounded-lg hover:bg-red-100 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
