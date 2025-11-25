import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, Image, FolderPlus } from 'lucide-react';
import { createCourse, updateCourse, CreateCourseData, Course } from '../services/courseService';
import { validatePDFFile } from '../services/storageService';
import { getAllModules, Module } from '../services/moduleService';

interface CourseUploadFormProps {
  coachId: string;
  onSuccess: () => void;
  onCancel: () => void;
  editingCourse?: Course;
}

export default function CourseUploadForm({ coachId, onSuccess, onCancel, editingCourse }: CourseUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailBase64, setThumbnailBase64] = useState('');
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'standalone' | 'module'>('standalone');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [orderInModule, setOrderInModule] = useState<number>(1);
  const [isVisible, setIsVisible] = useState(editingCourse?.visible ?? true);

  const [videoUrl, setVideoUrl] = useState(editingCourse?.video_url || '');

  const [formData, setFormData] = useState<CreateCourseData>({
    title: editingCourse?.title || '',
    description: editingCourse?.description || '',
    instructor: editingCourse?.instructor || '',
    thumbnail: editingCourse?.thumbnail || '',
    duration: editingCourse?.duration || '',
    level: editingCourse?.level || 'beginner',
    plan: editingCourse?.plan || 'free',
    category: editingCourse?.category || 'grooming',
    lessons: editingCourse?.lessons || 1,
    allow_download: editingCourse?.allow_download || false,
    content_type: editingCourse?.content_type || 'pdf',
    module_id: editingCourse?.module_id || undefined,
    order_in_module: editingCourse?.order_in_module || undefined,
  });

  useEffect(() => {
    if (editingCourse?.thumbnail) {
      setThumbnailBase64(editingCourse.thumbnail);
    }
    if (editingCourse?.module_id) {
      setUploadType('module');
      setSelectedModule(editingCourse.module_id);
      setOrderInModule(editingCourse.order_in_module || 1);
    }
  }, [editingCourse]);

  useEffect(() => {
    const loadModules = async () => {
      try {
        console.log('CourseUploadForm: Loading modules...');
        const allModules = await getAllModules();
        console.log('CourseUploadForm: Modules loaded:', allModules.length);
        console.log('CourseUploadForm: Module data:', allModules);
        setModules(allModules);
      } catch (error) {
        console.error('CourseUploadForm: Error loading modules:', error);
        setError('Failed to load modules. Check console for details.');
      }
    };
    loadModules();
  }, []);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, GIF)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailBase64(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePDFFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setPdfFile(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!thumbnailBase64.trim()) {
      setError('Please upload a thumbnail image');
      return;
    }

    if (formData.content_type === 'pdf' && !pdfFile && !editingCourse?.pdf_url) {
      setError('Please select a PDF file to upload');
      return;
    }

    if (formData.content_type === 'video' && !videoUrl) {
      setError('Please enter a video URL');
      return;
    }

    if (uploadType === 'module' && !selectedModule) {
      setError('Please select a module');
      return;
    }

    setIsUploading(true);

    try {
      const courseData = {
        ...formData,
        thumbnail: thumbnailBase64,
        pdfFile: formData.content_type === 'pdf' ? pdfFile || undefined : undefined,
        video_url: formData.content_type === 'video' ? videoUrl : undefined,
        module_id: uploadType === 'module' ? selectedModule : undefined,
        order_in_module: uploadType === 'module' ? orderInModule : undefined,
        visible: isVisible,
      };

      if (editingCourse) {
        console.log('Updating course...');
        await updateCourse(
          editingCourse.id,
          courseData,
          editingCourse.pdf_path
        );
        console.log('Course updated successfully');
      } else {
        console.log('Starting course creation...');
        await createCourse(
          courseData,
          coachId
        );
        console.log('Course created successfully');
      }

      // Update module visibility if course is part of module
      if (uploadType === 'module' && selectedModule) {
        console.log('Updating module visibility...');
        const { updateModule } = await import('../services/moduleService');
        await updateModule(selectedModule, { visible: isVisible });
        console.log('Module visibility updated');
      }

      onSuccess();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || `Failed to ${editingCourse ? 'update' : 'upload'} course. Please try again.`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white p-6 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold">{editingCourse ? 'Edit Course' : 'Upload New Course'}</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Course Type *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUploadType('standalone')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition border-2 ${
                  uploadType === 'standalone'
                    ? 'bg-[#D71920] text-white border-[#D71920]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#D71920]'
                }`}
              >
                <Upload className="w-5 h-5 inline mr-2" />
                Single Course
              </button>
              <button
                type="button"
                onClick={() => setUploadType('module')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition border-2 ${
                  uploadType === 'module'
                    ? 'bg-[#D71920] text-white border-[#D71920]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#D71920]'
                }`}
              >
                <FolderPlus className="w-5 h-5 inline mr-2" />
                Add to Module
              </button>
            </div>
          </div>

          {uploadType === 'module' && (
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Select Module *
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  required={uploadType === 'module'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
                >
                  <option value="">Choose a module...</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name} ({module.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Order in Module *
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderInModule}
                  onChange={(e) => setOrderInModule(parseInt(e.target.value))}
                  required={uploadType === 'module'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
                  placeholder="e.g., 1 for first course, 2 for second..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Course order within the module (1 = first, 2 = second, etc.)
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
              placeholder="e.g., Cabin Crew Interview Preparation"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition resize-none"
              placeholder="Describe what students will learn..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Cover Image *
            </label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#D71920] transition cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-semibold">Click to upload cover image</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (Max 2MB)</p>
            </button>
            {thumbnailBase64 && (
              <div className="mt-3 border-2 border-gray-200 rounded-xl overflow-hidden">
                <img
                  src={thumbnailBase64}
                  alt="Cover preview"
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Instructor Name *
              </label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Duration *
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
                placeholder="e.g., 2 hours"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Level *
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
              >
                <option value="grooming">Grooming</option>
                <option value="service">Service</option>
                <option value="safety">Safety</option>
                <option value="interview">Interview</option>
                <option value="language">Language</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Access Level *
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Content Type *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, content_type: 'pdf' })}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition ${
                  formData.content_type === 'pdf'
                    ? 'bg-[#FF3B3F] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                PDF Document
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, content_type: 'video' })}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition ${
                  formData.content_type === 'video'
                    ? 'bg-[#FF3B3F] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Video (YouTube)
              </button>
            </div>
          </div>

          {formData.content_type === 'pdf' ? (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                PDF File *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#FF3B3F] transition">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePDFUpload}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  {pdfFile ? (
                    <p className="text-sm font-medium text-gray-700">{pdfFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Click to upload PDF
                      </p>
                      <p className="text-xs text-gray-500">Maximum file size: 50MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                YouTube Video URL *
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required={formData.content_type === 'video'}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#FF3B3F] focus:ring-2 focus:ring-[#FF3B3F]/20 transition"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-500 mt-2">Paste a YouTube video URL. The video will play directly in the app.</p>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_download}
                onChange={(e) => setFormData({ ...formData, allow_download: e.target.checked })}
                className="w-5 h-5 text-[#FF3B3F] border-gray-300 rounded focus:ring-[#FF3B3F]"
              />
              <div>
                <span className="text-sm font-bold text-gray-700">Allow Download</span>
                <p className="text-xs text-gray-500">Enable students to download this PDF</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="w-5 h-5 text-[#FF3B3F] border-gray-300 rounded focus:ring-[#FF3B3F]"
              />
              <div>
                <span className="text-sm font-bold text-gray-700">Make Visible to Students</span>
                <p className="text-xs text-gray-500">Show this course{uploadType === 'module' ? ' and module' : ''} to students</p>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF3B3F] to-[#E6282C] text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 animate-pulse" />
                  Uploading...
                </span>
              ) : (
                'Upload Course'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
