import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, MapPin, Edit, Trash2, X, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getAllRecruiters,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  Recruiter,
} from '../services/recruitersService';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';

export default function RecruitersPage() {
  const { currentUser } = useApp();

  // Check feature access
  if (!currentUser) return null;

  const recruitersAccess = checkFeatureAccess(currentUser, 'recruiters');
  if (!recruitersAccess.allowed) {
    return (
      <FeatureLock
        requiredPlan={recruitersAccess.requiresPlan || 'pro'}
        featureName="Recruiters"
        description={recruitersAccess.message}
      />
    );
  }
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null);
  const [viewingRecruiter, setViewingRecruiter] = useState<Recruiter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAirline, setFilterAirline] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    country: '',
    airline: '',
    notes: '',
  });

  const isAdmin = currentUser?.role === 'governor' || currentUser?.role === 'mentor';

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    setLoading(true);
    const data = await getAllRecruiters();
    setRecruiters(data);
    setLoading(false);
  };

  const handleOpenForm = (recruiter?: Recruiter) => {
    if (recruiter) {
      setEditingRecruiter(recruiter);
      setFormData({
        name: recruiter.name,
        country: recruiter.country,
        airline: recruiter.airline,
        notes: recruiter.notes,
      });
    } else {
      setEditingRecruiter(null);
      setFormData({ name: '', country: '', airline: '', notes: '' });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecruiter(null);
    setFormData({ name: '', country: '', airline: '', notes: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (editingRecruiter) {
      const success = await updateRecruiter(editingRecruiter.id!, formData);
      if (success) {
        await loadRecruiters();
        handleCloseForm();
      }
    } else {
      const newRecruiter = await createRecruiter(formData, currentUser.uid);
      if (newRecruiter) {
        await loadRecruiters();
        handleCloseForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recruiter?')) {
      const success = await deleteRecruiter(id);
      if (success) {
        await loadRecruiters();
      }
    }
  };

  const uniqueAirlines = [...new Set(recruiters.map((r) => r.airline))].sort();

  const filteredRecruiters = recruiters.filter((recruiter) => {
    const matchesSearch =
      recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recruiter.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAirline = !filterAirline || recruiter.airline === filterAirline;
    return matchesSearch && matchesAirline;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recruiters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiters</h1>
            <p className="text-gray-600">
              {isAdmin
                ? 'Manage airline recruiters and their information'
                : 'View airline recruiters and their details'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              {showForm ? 'Cancel' : 'Add Recruiter'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="glass-card rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingRecruiter ? 'Edit Recruiter' : 'Add New Recruiter'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
                        placeholder="Recruiter name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Airline *</label>
                      <input
                        type="text"
                        required
                        value={formData.airline}
                        onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
                        placeholder="e.g., Emirates"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
                      placeholder="e.g., United Arab Emirates"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes *</label>
                    <textarea
                      required
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition resize-none"
                      placeholder="Additional information about this recruiter..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
                    >
                      {editingRecruiter ? 'Update Recruiter' : 'Create Recruiter'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
            />
          </div>
          <select
            value={filterAirline}
            onChange={(e) => setFilterAirline(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
          >
            <option value="">All Airlines</option>
            {uniqueAirlines.map((airline) => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </select>
        </div>

        {filteredRecruiters.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl shadow-lg">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Recruiters Found</h3>
            <p className="text-gray-600">
              {recruiters.length === 0
                ? 'No recruiters have been added yet. Check back soon!'
                : 'No recruiters match your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecruiters.map((recruiter) => (
              <motion.div
                key={recruiter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{recruiter.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      {recruiter.airline}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      {recruiter.country}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenForm(recruiter)}
                        className="p-2 hover:glass-bubble rounded-lg transition"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(recruiter.id!)}
                        className="p-2 hover:glass-bubble rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Updated {formatDate(recruiter.last_updated)}
                </p>

                <button
                  onClick={() => setViewingRecruiter(recruiter)}
                  className="w-full px-4 py-2 glass-bubble hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition"
                >
                  View Details
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewingRecruiter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999]"
            onClick={() => setViewingRecruiter(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl shadow-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{viewingRecruiter.name}</h2>
                <button
                  onClick={() => setViewingRecruiter(null)}
                  className="p-2 hover:glass-bubble rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Airline</label>
                  <p className="text-lg text-gray-900">{viewingRecruiter.airline}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Country</label>
                  <p className="text-lg text-gray-900">{viewingRecruiter.country}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">Notes</label>
                  <p className="text-gray-800 whitespace-pre-wrap">{viewingRecruiter.notes}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900">{formatDate(viewingRecruiter.last_updated)}</p>
                </div>
              </div>

              <button
                onClick={() => setViewingRecruiter(null)}
                className="w-full mt-6 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
