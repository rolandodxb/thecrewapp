import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderPlus, Edit2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
  Module,
  getAllModules
} from '../../../services/moduleService';

interface EditFormData {
  name: string;
  description: string;
  order: number;
  visible: boolean;
  quiz_id?: string;
}

export default function ModuleManager() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>('grouped');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    description: '',
    order: 0,
    visible: true,
    quiz_id: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const data = await getAllModules();
      setModules(data);
    } catch (error) {
      console.error('Error loading modules:', error);
      alert('Failed to load modules. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (module: Module, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(module.id!);
    setEditForm({
      name: module.name,
      description: module.description,
      order: module.order,
      visible: module.visible,
      quiz_id: module.quiz_id || ''
    });
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditForm({
      name: '',
      description: '',
      order: 0,
      visible: true,
      quiz_id: ''
    });
  };

  const saveEdit = async (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    try {
      const moduleRef = doc(db, 'main_modules', moduleId);
      await updateDoc(moduleRef, {
        name: editForm.name,
        description: editForm.description,
        order: editForm.order,
        visible: editForm.visible,
        quiz_id: editForm.quiz_id || null,
        updatedAt: new Date()
      });

      await loadModules();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Failed to update module');
    } finally {
      setSaving(false);
    }
  };

  const groupedModules = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const renderModuleCard = (module: Module) => (
    <div key={module.id} className="glass-light border border-gray-300 rounded-xl overflow-hidden">
      <div className="p-4 hover:bg-gray-50 transition">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {viewMode === 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase">
                  {module.category}
                </span>
              )}
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                #{module.order}
              </span>
              {module.visible && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                  VISIBLE
                </span>
              )}
            </div>
            <h4 className="font-bold text-gray-900 break-words">{module.name}</h4>
            <p className="text-sm text-gray-600 mt-1 break-words">{module.description}</p>
            {module.quiz_id && (
              <p className="text-xs text-green-600 mt-2">
                Quiz Required: {module.quiz_id}
              </p>
            )}
            {module.cover_image && (
              <p className="text-xs text-cyan-400 mt-1">
                Has cover image
              </p>
            )}
          </div>
          <button
            onClick={(e) => editingId === module.id ? cancelEdit(e) : startEdit(module, e)}
            className="p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
          >
            {editingId === module.id ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <Edit2 className="w-5 h-5 text-blue-600" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {editingId === module.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-gray-300"
          >
            <div className="p-4 md:p-6 space-y-4 bg-gray-50">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Module Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 glass-light border border-gray-300 rounded-xl text-gray-900 focus:border-blue-600 focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 glass-light border border-gray-300 rounded-xl text-gray-900 focus:border-blue-600 focus:outline-none resize-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Order</label>
                  <input
                    type="number"
                    value={editForm.order}
                    onChange={(e) => setEditForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 glass-light border border-gray-300 rounded-xl text-gray-900 focus:border-blue-600 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quiz ID (optional)</label>
                  <input
                    type="text"
                    value={editForm.quiz_id}
                    onChange={(e) => setEditForm(prev => ({ ...prev, quiz_id: e.target.value }))}
                    placeholder="Enter quiz ID"
                    className="w-full px-4 py-3 glass-light border border-gray-300 rounded-xl text-gray-900 focus:border-blue-600 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`visible-${module.id}`}
                  checked={editForm.visible}
                  onChange={(e) => setEditForm(prev => ({ ...prev, visible: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <label htmlFor={`visible-${module.id}`} className="text-sm font-semibold text-gray-700">
                  Module Visible to Students
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={(e) => saveEdit(module.id!, e)}
                  disabled={saving || !editForm.name.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="glass-light border border-gray-200 rounded-xl p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <FolderPlus className="w-5 h-5 md:w-6 md:h-6 text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">Module Management</h2>
            <p className="text-gray-600 text-xs md:text-sm">Modules: {modules.length}</p>
            <p className="text-gray-600 text-xs hidden md:block">Create from Coach Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="flex glass-light rounded-xl p-1">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-semibold transition ${
                viewMode === 'grouped'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              Grouped
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-semibold transition ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-3">Loading modules...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-12 glass-light rounded-xl">
          <FolderPlus className="w-16 h-16 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-700 font-semibold">No modules created yet</p>
          <p className="text-gray-600 text-sm mt-1">Modules are created from Coach Dashboard</p>
        </div>
      ) : viewMode === 'all' ? (
        <div className="space-y-3">
          {modules
            .sort((a, b) => {
              if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
              }
              return a.order - b.order;
            })
            .map((module) => renderModuleCard(module))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedModules).map(([category, categoryModules]) => (
            <div key={category}>
              <h3 className="text-lg font-bold text-gray-900 mb-3 capitalize px-2">
                {category} Modules ({categoryModules.length})
              </h3>
              <div className="space-y-3">
                {categoryModules
                  .sort((a, b) => a.order - b.order)
                  .map((module) => renderModuleCard(module))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
