import { useState, useRef, useEffect } from 'react';
import { Upload, Video, Image as ImageIcon, Check, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createCourse, updateCourse, Course } from '../services/courseService';
import { getAllMainModules, getSubmodulesByParent, MainModule, Submodule } from '../services/mainModuleService';
import { useApp } from '../context/AppContext';

interface NewCourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedSubmoduleId?: string;
  preselectedMainModuleId?: string;
  editingCourse?: Course;
}

export default function NewCourseForm({ isOpen, onClose, onSuccess, preselectedSubmoduleId, preselectedMainModuleId, editingCourse }: NewCourseFormProps) {
  const { currentUser } = useApp();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [submoduleId, setSubmoduleId] = useState(preselectedSubmoduleId || '');
  const [mainModules, setMainModules] = useState<MainModule[]>([]);
  const [submodules, setSubmodules] = useState<Submodule[]>([]);
  const [selectedMainModule, setSelectedMainModule] = useState('');
  const [loading, setLoading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMainModules();
      if (editingCourse) {
        setTitle(editingCourse.title);
        setSubtitle(editingCourse.subtitle || '');
        setDescription(editingCourse.description);
        setVideoUrl(editingCourse.video_url || '');
        setThumbnail(editingCourse.thumbnail);
        setSubmoduleId(editingCourse.submodule_id || '');
        setSelectedMainModule(editingCourse.module_id || '');
      } else {
        if (preselectedMainModuleId) {
          setSelectedMainModule(preselectedMainModuleId);
        }
        if (preselectedSubmoduleId) {
          setSubmoduleId(preselectedSubmoduleId);
        }
      }
    }
  }, [isOpen, editingCourse, preselectedMainModuleId, preselectedSubmoduleId]);

  useEffect(() => {
    if (selectedMainModule) {
      loadSubmodules(selectedMainModule);
    }
  }, [selectedMainModule]);

  const loadMainModules = async () => {
    const modules = await getAllMainModules();
    setMainModules(modules);
  };

  const loadSubmodules = async (moduleId: string) => {
    const subs = await getSubmodulesByParent(moduleId);
    setSubmodules(subs);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !videoUrl.trim() || !thumbnail) {
      alert('Please fill in all required fields');
      return;
    }

    if (!selectedMainModule && !preselectedSubmoduleId && !preselectedMainModuleId) {
      alert('Please select a main module');
      return;
    }

    if (!currentUser) {
      alert('You must be logged in to create courses');
      return;
    }

    setLoading(true);
    try {
      const embedUrl = convertToEmbedUrl(videoUrl);

      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          title: title.trim(),
          description: description.trim(),
          thumbnail,
          video_url: embedUrl,
          subtitle: subtitle.trim() || null,
          module_id: selectedMainModule || null,
          submodule_id: submoduleId || null
        });
        alert('Course updated successfully!');
      } else {
        await createCourse({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          description: description.trim(),
          video_url: embedUrl,
          thumbnail,
          duration: 0,
          lessons: 0,
          level: 'Beginner',
          enrolledStudents: 0,
          instructor: currentUser.name,
          instructor_id: currentUser.id,
          module_id: selectedMainModule || null,
          submodule_id: submoduleId || null
        });
        alert('Course created successfully!');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setDescription('');
    setVideoUrl('');
    setThumbnail('');
    setSubmoduleId(preselectedSubmoduleId || '');
    setSelectedMainModule(preselectedMainModuleId || '');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        >
          <div className="glass-light rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#D71920] via-[#B91518] to-[#9C1215] px-6 sm:px-8 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Video className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </h1>
                  <p className="text-red-100 text-sm sm:text-base mt-1">Create engaging video training content</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Introduction to In-Flight Service"
                    className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/20 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Subtitle (Optional)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g., Master the art of passenger care"
                    className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will learn in this course..."
                  rows={5}
                  className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/20 transition-all outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Main Module *
                  </label>
                  <select
                    value={selectedMainModule}
                    onChange={(e) => setSelectedMainModule(e.target.value)}
                    className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/20 transition-all outline-none"
                    required
                  >
                    <option value="">Select main module...</option>
                    {mainModules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Submodule (Optional)
                  </label>
                  <select
                    value={submoduleId}
                    onChange={(e) => setSubmoduleId(e.target.value)}
                    className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/20 transition-all outline-none"
                    disabled={!selectedMainModule}
                  >
                    <option value="">Select submodule (optional)...</option>
                    {submodules.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Video URL *
                </label>
                <div className="relative">
                  <Play className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full pl-12 pr-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-[#D71920] focus:ring-4 focus:ring-[#D71920]/20 transition-all outline-none"
                    required
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-2">Paste a YouTube video URL</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Course Thumbnail *
                </label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  {thumbnail ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-48 sm:h-64 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <div className="text-white text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <span className="font-semibold">Change Thumbnail</span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="w-full p-8 sm:p-12 glass-light border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#D71920] hover:glass-bubble transition-all group"
                    >
                      <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 group-hover:text-[#D71920] mx-auto mb-4 transition-colors" />
                      <div className="text-center">
                        <p className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">Click to upload thumbnail</p>
                        <p className="text-gray-500 text-xs sm:text-sm">PNG, JPG up to 10MB</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 px-6 py-4 glass-light border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:border-gray-400 hover:shadow-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 px-6 py-4 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-2xl font-bold hover:from-[#B01518] hover:to-[#9C1215] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {editingCourse ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      {editingCourse ? 'Update Course' : 'Create Course'}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
