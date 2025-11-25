import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, MapPin, User, Edit, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getAllOpenDays,
  createOpenDay,
  updateOpenDay,
  deleteOpenDay,
  OpenDay,
} from '../services/openDaysService';
import { checkFeatureAccess } from '../utils/featureAccess';
import FeatureLock from '../components/FeatureLock';

export default function OpenDaysPage() {
  const { currentUser } = useApp();

  // Check feature access
  if (!currentUser) return null;

  const openDaysAccess = checkFeatureAccess(currentUser, 'opendays');
  if (!openDaysAccess.allowed) {
    return (
      <FeatureLock
        requiredPlan={openDaysAccess.requiresPlan || 'pro'}
        featureName="Open Days"
        description={openDaysAccess.message}
      />
    );
  }
  const [openDays, setOpenDays] = useState<OpenDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOpenDay, setEditingOpenDay] = useState<OpenDay | null>(null);

  const [formData, setFormData] = useState({
    city: '',
    country: '',
    date: '',
    recruiter: '',
    description: '',
  });

  const isAdmin = currentUser?.role === 'governor' || currentUser?.role === 'mentor';

  useEffect(() => {
    loadOpenDays();
  }, []);

  const loadOpenDays = async () => {
    setLoading(true);
    const data = await getAllOpenDays();
    setOpenDays(data);
    setLoading(false);
  };

  const handleOpenForm = (openDay?: OpenDay) => {
    if (openDay) {
      setEditingOpenDay(openDay);
      setFormData({
        city: openDay.city,
        country: openDay.country,
        date: openDay.date,
        recruiter: openDay.recruiter,
        description: openDay.description,
      });
    } else {
      setEditingOpenDay(null);
      setFormData({ city: '', country: '', date: '', recruiter: '', description: '' });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingOpenDay(null);
    setFormData({ city: '', country: '', date: '', recruiter: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (editingOpenDay) {
      const success = await updateOpenDay(editingOpenDay.id!, formData);
      if (success) {
        await loadOpenDays();
        handleCloseForm();
      }
    } else {
      const newOpenDay = await createOpenDay(formData, currentUser.uid);
      if (newOpenDay) {
        await loadOpenDays();
        handleCloseForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this open day?')) {
      const success = await deleteOpenDay(id);
      if (success) {
        await loadOpenDays();
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D71920] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading open days...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upcoming Open Days</h1>
            <p className="text-gray-600">
              {isAdmin
                ? 'Manage upcoming recruitment events'
                : 'View upcoming recruitment open days'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              {showForm ? 'Cancel' : 'Add Open Day'}
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
                    {editingOpenDay ? 'Edit Open Day' : 'Add New Open Day'}
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
                        placeholder="e.g., Dubai"
                      />
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
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Recruiter *</label>
                      <input
                        type="text"
                        required
                        value={formData.recruiter}
                        onChange={(e) => setFormData({ ...formData, recruiter: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
                        placeholder="Recruiter name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition resize-none"
                      placeholder="Describe the open day event..."
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
                      {editingOpenDay ? 'Update Open Day' : 'Create Open Day'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {openDays.length === 0 ? (
          <div className="text-center py-16 glass-card">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Open Days Scheduled</h3>
            <p className="text-gray-600">
              No Open Days have been announced yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openDays.map((openDay) => (
              <motion.div
                key={openDay.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-openday p-6 transition border-l-4 border-[#D71920]"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {openDay.city}, {openDay.country}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4 text-[#D71920]" />
                      {formatDate(openDay.date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4 text-[#D71920]" />
                      {openDay.recruiter}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenForm(openDay)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(openDay.id!)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-[#EADBC8]/30 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-700 line-clamp-3">{openDay.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
