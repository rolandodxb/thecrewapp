import { useState } from 'react';
import { useApp, Banner } from '../../context/AppContext';
import { AlertCircle, Plus, Trash2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalAlerts() {
  const { banners, setBanners } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    color: 'bg-[#D71920]',
    expiration: '',
  });

  const colorOptions = [
    { value: 'bg-[#D71920]', label: 'Red (Urgent)', preview: '#D71920' },
    { value: 'bg-[#B9975B]', label: 'Gold (Important)', preview: '#B9975B' },
    { value: 'bg-blue-600', label: 'Blue (Info)', preview: '#2563EB' },
    { value: 'bg-green-600', label: 'Green (Success)', preview: '#16A34A' },
    { value: 'bg-orange-600', label: 'Orange (Warning)', preview: '#EA580C' },
  ];

  const handleCreate = () => {
    if (!formData.title || !formData.expiration) return;

    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      title: formData.title,
      color: formData.color,
      expiration: formData.expiration,
    };

    setBanners([...banners, newBanner]);
    setFormData({ title: '', color: 'bg-[#D71920]', expiration: '' });
    setShowCreateForm(false);
  };

  const handleDelete = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">Global Alerts</h1>
        <p className="text-gray-600">Create system-wide announcements visible to all users</p>
      </div>

      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="mb-6 px-6 py-3 bg-gradient-to-r from-[#D71920] to-[#E6282C] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create New Alert
      </button>

      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-light rounded-2xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-xl font-bold text-[#1C1C1C] mb-4">New Global Alert</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                Alert Message
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter alert message..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                Color Theme
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    className={`p-3 rounded-xl border-2 transition ${
                      formData.color === option.value
                        ? 'border-[#D71920] bg-[#F5F5F5]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-3 rounded mb-2"
                      style={{ backgroundColor: option.preview }}
                    />
                    <p className="text-xs font-bold text-[#1C1C1C]">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
                Expiration Date
              </label>
              <input
                type="datetime-local"
                value={formData.expiration}
                onChange={(e) => setFormData({ ...formData, expiration: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition"
              />
            </div>

            {formData.title && (
              <div>
                <label className="block text-sm font-bold text-[#1C1C1C] mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </label>
                <div className={`${formData.color} text-white px-4 py-3 rounded-xl`}>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold">{formData.title}</p>
                      {formData.expiration && (
                        <p className="text-sm opacity-90">
                          Expires: {new Date(formData.expiration).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-[#1C1C1C] rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.title || !formData.expiration}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#D71920] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50"
              >
                Create Alert
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="glass-light rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-[#1C1C1C] mb-4">Active Alerts</h3>

        {banners.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="border-2 border-gray-200 rounded-xl p-4 hover:border-gray-300 transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`${banner.color} p-3 rounded-lg`}>
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#1C1C1C] mb-1">{banner.title}</h4>
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(banner.expiration).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
