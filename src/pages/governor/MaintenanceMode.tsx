import { useApp } from '../../context/AppContext';
import { Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenanceMode() {
  const { maintenanceMode, setMaintenanceMode, maintenanceMessage, setMaintenanceMessage } = useApp();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-2">Maintenance Mode</h1>
        <p className="text-gray-600">Control system-wide access and display maintenance notices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-light rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-[#1C1C1C]">System Status</h3>
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
              maintenanceMode
                ? 'bg-orange-100 text-orange-600'
                : 'bg-green-100 text-green-600'
            }`}>
              {maintenanceMode ? 'Maintenance Active' : 'Operational'}
            </div>
          </div>

          <div className="bg-[#F5F5F5]/30 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Settings className="w-10 h-10 text-[#B9975B]" />
              <div>
                <h4 className="font-bold text-[#1C1C1C]">Maintenance Toggle</h4>
                <p className="text-sm text-gray-600">Lock system access for all non-Governor users</p>
              </div>
            </div>

            <button
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors ${
                maintenanceMode ? 'bg-orange-500' : 'bg-green-500'
              }`}
            >
              <motion.span
                layout
                className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition ${
                  maintenanceMode ? 'translate-x-11' : 'translate-x-1'
                }`}
              />
            </button>

            {maintenanceMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-orange-600">
                  System is currently in maintenance mode. Only Governors can access the platform.
                </p>
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1C1C1C] mb-2">
              Custom Maintenance Message
            </label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition resize-none"
              placeholder="Enter a message to display to users during maintenance..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-light rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-[#1C1C1C] mb-4">Preview</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                maintenanceMode ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {maintenanceMode ? (
                  <Settings className="w-8 h-8 text-orange-600 animate-spin" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>
              <h4 className="text-2xl font-bold text-[#1C1C1C] mb-2">
                {maintenanceMode ? 'System Maintenance' : 'System Operational'}
              </h4>
              <p className="text-gray-600 mb-6">
                {maintenanceMode ? maintenanceMessage : 'All systems are running normally'}
              </p>
              {maintenanceMode && (
                <button className="px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-bold cursor-not-allowed">
                  Service Unavailable
                </button>
              )}
            </div>
          </div>

          <div className="glass-light rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-[#1C1C1C] mb-4">Impact Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#F5F5F5]/30 rounded-lg">
                <span className="text-[#1C1C1C]">Total Users</span>
                <span className="font-bold text-[#D71920]">127</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F5F5F5]/30 rounded-lg">
                <span className="text-[#1C1C1C]">Affected Users</span>
                <span className="font-bold text-orange-600">
                  {maintenanceMode ? '124' : '0'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F5F5F5]/30 rounded-lg">
                <span className="text-[#1C1C1C]">Governors (Unaffected)</span>
                <span className="font-bold text-green-600">3</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#D71920] to-[#E6282C] rounded-2xl shadow-lg p-6 text-white">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Important Notice
            </h4>
            <p className="text-sm text-red-100">
              Enabling maintenance mode will immediately lock out all students and mentors. Use this feature during system updates, database maintenance, or emergency situations only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
