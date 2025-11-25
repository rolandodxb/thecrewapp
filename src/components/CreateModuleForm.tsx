import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FolderPlus, Image as ImageIcon, Check, Plus, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import {
  createMainModule,
  createSubmodule,
  getAllMainModules,
  MainModule
} from '../services/mainModuleService';

interface CreateModuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateModuleForm({ isOpen, onClose, onSuccess }: CreateModuleFormProps) {
  const [moduleType, setModuleType] = useState<'main' | 'submodule'>('main');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [visible, setVisible] = useState(true);
  const [parentModuleId, setParentModuleId] = useState('');
  const [submoduleNumber, setSubmoduleNumber] = useState(1);
  const [mainModules, setMainModules] = useState<MainModule[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedCourse1, setSelectedCourse1] = useState('');
  const [selectedCourse2, setSelectedCourse2] = useState('');
  const [availableSubmodules, setAvailableSubmodules] = useState<any[]>([]);

  const [submodules, setSubmodules] = useState<{
    id: string;
    title: string;
    description: string;
    coverImage: string;
    course1_id: string;
    course2_id: string;
    order: number;
  }[]>([]);
  const [showSubmoduleForm, setShowSubmoduleForm] = useState(false);
  const [submoduleTitle, setSubmoduleTitle] = useState('');
  const [submoduleDescription, setSubmoduleDescription] = useState('');
  const [submoduleCoverImage, setSubmoduleCoverImage] = useState('');
  const [submoduleCourse1, setSubmoduleCourse1] = useState('');
  const [submoduleCourse2, setSubmoduleCourse2] = useState('');
  const submoduleFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMainModules();
      loadCourses();
      loadSubmodules();
    }
  }, [isOpen]);

  const loadMainModules = async () => {
    const modules = await getAllMainModules();
    setMainModules(modules);
  };

  const loadCourses = async () => {
    try {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, orderBy('created_at', 'desc'));
      const snapshot = await getDocs(q);
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableCourses(courses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadSubmodules = async () => {
    try {
      const submodulesRef = collection(db, 'submodules');
      const snapshot = await getDocs(submodulesRef);
      const submodules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableSubmodules(submodules);
    } catch (error) {
      console.error('Error loading submodules:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG or JPG)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !coverImage) {
      alert('Please fill in all fields and upload a cover image');
      return;
    }

    if (moduleType === 'submodule' && !parentModuleId) {
      alert('Please select a parent module');
      return;
    }

    setLoading(true);
    try {
      if (moduleType === 'main') {
        const moduleData: any = {
          title: title.trim(),
          description: description.trim(),
          coverImage,
          visible
        };

        if (selectedCourse1 && selectedCourse2) {
          moduleData.course1_id = selectedCourse1;
          moduleData.course2_id = selectedCourse2;
        } else if (selectedCourse1) {
          moduleData.course_id = selectedCourse1;
        }

        if (submodules.length > 0) {
          moduleData.submodules = submodules.map(sub => ({
            id: sub.id,
            title: sub.title,
            description: sub.description,
            coverImage: sub.coverImage,
            ...(sub.course1_id && sub.course2_id
              ? { course1_id: sub.course1_id, course2_id: sub.course2_id }
              : sub.course1_id
              ? { course_id: sub.course1_id }
              : {}),
            order: sub.order
          }));
        }

        await createMainModule(moduleData);
        alert('Main module created successfully!');
      } else {
        const submoduleData: any = {
          parentModuleId,
          order: submoduleNumber,
          title: title.trim(),
          description: description.trim(),
          coverImage
        };

        if (selectedCourse1 && selectedCourse2) {
          submoduleData.course1_id = selectedCourse1;
          submoduleData.course2_id = selectedCourse2;
        } else if (selectedCourse1) {
          submoduleData.course_id = selectedCourse1;
        }

        await createSubmodule(submoduleData);
        alert('Submodule created successfully!');
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setModuleType('main');
    setTitle('');
    setDescription('');
    setCoverImage('');
    setVisible(true);
    setParentModuleId('');
    setSubmoduleNumber(1);
    setSelectedCourse1('');
    setSelectedCourse2('');
    setSubmodules([]);
    setShowSubmoduleForm(false);
    resetSubmoduleForm();
  };

  const resetSubmoduleForm = () => {
    setSubmoduleTitle('');
    setSubmoduleDescription('');
    setSubmoduleCoverImage('');
    setSubmoduleCourse1('');
    setSubmoduleCourse2('');
  };

  const handleAddSubmodule = () => {
    if (!submoduleTitle.trim() || !submoduleDescription.trim() || !submoduleCoverImage) {
      alert('Please fill in all submodule fields and upload a cover image');
      return;
    }

    const newSubmodule = {
      id: `sub_${Date.now()}`,
      title: submoduleTitle.trim(),
      description: submoduleDescription.trim(),
      coverImage: submoduleCoverImage,
      course1_id: submoduleCourse1,
      course2_id: submoduleCourse2,
      order: submodules.length + 1
    };

    setSubmodules([...submodules, newSubmodule]);
    resetSubmoduleForm();
    setShowSubmoduleForm(false);
  };

  const handleRemoveSubmodule = (id: string) => {
    setSubmodules(submodules.filter(sub => sub.id !== id));
  };

  const handleSubmoduleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG or JPG)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmoduleCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 px-6 sm:px-8 py-8 sm:py-12">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FolderPlus className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Create Training Module</h1>
                  <p className="text-blue-100 text-sm sm:text-base mt-1">Build comprehensive training content for your students</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 sm:space-y-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Module Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setModuleType('main')}
                    className={`relative p-4 sm:p-6 rounded-2xl font-semibold transition-all duration-300 border-2 ${
                      moduleType === 'main'
                        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-200 glass-light text-gray-600 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {moduleType === 'main' && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-base sm:text-lg mb-1">Main Module</div>
                      <div className="text-xs sm:text-sm opacity-75">Create a new primary training module</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModuleType('submodule')}
                    className={`relative p-4 sm:p-6 rounded-2xl font-semibold transition-all duration-300 border-2 ${
                      moduleType === 'submodule'
                        ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-200 glass-light text-gray-600 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {moduleType === 'submodule' && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-base sm:text-lg mb-1">Submodule</div>
                      <div className="text-xs sm:text-sm opacity-75">Add a chapter to existing module</div>
                    </div>
                  </button>
                </div>
              </div>

              {moduleType === 'submodule' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Parent Module
                    </label>
                    <select
                      value={parentModuleId}
                      onChange={(e) => setParentModuleId(e.target.value)}
                      className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                      required
                    >
                      <option value="">Select parent module...</option>
                      {mainModules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Submodule Number
                    </label>
                    <select
                      value={submoduleNumber}
                      onChange={(e) => setSubmoduleNumber(parseInt(e.target.value))}
                      className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          Submodule {num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4 p-6 glass-light rounded-2xl border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Courses to Submodule</h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Video 1 / Course 1 (Optional)
                      </label>
                      <select
                        value={selectedCourse1}
                        onChange={(e) => setSelectedCourse1(e.target.value)}
                        className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                      >
                        <option value="">No video/course selected</option>
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title || course.name || 'Untitled Course'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCourse1 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Video 2 / Course 2 (Optional)
                        </label>
                        <select
                          value={selectedCourse2}
                          onChange={(e) => setSelectedCourse2(e.target.value)}
                          className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                        >
                          <option value="">No second video/course</option>
                          {availableCourses
                            .filter(course => course.id !== selectedCourse1)
                            .map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title || course.name || 'Untitled Course'}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-xl">
                      <strong>Note:</strong> If you select 2 videos, they will be stored as course1_id and course2_id. If you select only 1 video, it will be stored as course_id.
                    </div>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Module Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={moduleType === 'main' ? 'e.g., Cabin Crew Safety Training' : 'e.g., Emergency Procedures'}
                  className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will learn in this module..."
                  rows={5}
                  className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Cover Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="space-y-4">
                  {coverImage ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={coverImage}
                        alt="Cover preview"
                        className="w-full h-48 sm:h-64 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <div className="text-white text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <span className="font-semibold">Change Image</span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-8 sm:p-12 glass-light border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:glass-bubble transition-all group"
                    >
                      <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 group-hover:text-blue-500 mx-auto mb-4 transition-colors" />
                      <div className="text-center">
                        <p className="text-gray-700 font-semibold mb-1 text-sm sm:text-base">Click to upload cover image</p>
                        <p className="text-gray-500 text-xs sm:text-sm">PNG, JPG up to 10MB</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {moduleType === 'main' && (
                <>
                  <div className="space-y-4 p-6 glass-light rounded-2xl border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Assign Courses</h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Video 1 / Course 1 (Optional)
                      </label>
                      <select
                        value={selectedCourse1}
                        onChange={(e) => setSelectedCourse1(e.target.value)}
                        className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                      >
                        <option value="">No video/course selected</option>
                        {availableCourses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title || course.name || 'Untitled Course'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedCourse1 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Video 2 / Course 2 (Optional)
                        </label>
                        <select
                          value={selectedCourse2}
                          onChange={(e) => setSelectedCourse2(e.target.value)}
                          className="w-full px-4 py-4 glass-light border-2 border-gray-200 rounded-2xl text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                        >
                          <option value="">No second video/course</option>
                          {availableCourses
                            .filter(course => course.id !== selectedCourse1)
                            .map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title || course.name || 'Untitled Course'}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-xl">
                      <strong>Note:</strong> If you select 2 videos, they will be stored as course1_id and course2_id. If you select only 1 video, it will be stored as course_id.
                    </div>
                  </div>

                  <div className="space-y-4 p-6 glass-light rounded-2xl border-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">Submodules ({submodules.length})</h3>
                      <button
                        type="button"
                        onClick={() => setShowSubmoduleForm(!showSubmoduleForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Submodule
                      </button>
                    </div>

                    {submodules.map((sub, index) => (
                      <div key={sub.id} className="p-4 bg-white border-2 border-gray-200 rounded-xl">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <img src={sub.coverImage} alt={sub.title} className="w-20 h-20 rounded-lg object-cover" />
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{sub.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{sub.description}</p>
                              <div className="flex gap-2 mt-2 text-xs text-gray-500">
                                {sub.course1_id && <span className="px-2 py-1 bg-blue-100 rounded">Course 1</span>}
                                {sub.course2_id && <span className="px-2 py-1 bg-blue-100 rounded">Course 2</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubmodule(sub.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {showSubmoduleForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6 bg-green-50 border-2 border-green-300 rounded-xl space-y-4"
                      >
                        <h4 className="font-bold text-gray-900">New Submodule</h4>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                          <input
                            type="text"
                            value={submoduleTitle}
                            onChange={(e) => setSubmoduleTitle(e.target.value)}
                            placeholder="e.g., Emergency Procedures"
                            className="w-full px-4 py-3 glass-light border-2 border-gray-200 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                          <textarea
                            value={submoduleDescription}
                            onChange={(e) => setSubmoduleDescription(e.target.value)}
                            placeholder="Describe this submodule..."
                            rows={3}
                            className="w-full px-4 py-3 glass-light border-2 border-gray-200 rounded-xl resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image</label>
                          <input
                            ref={submoduleFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleSubmoduleImageUpload}
                            className="hidden"
                          />
                          {submoduleCoverImage ? (
                            <div className="relative rounded-xl overflow-hidden">
                              <img src={submoduleCoverImage} alt="Preview" className="w-full h-32 object-cover" />
                              <button
                                type="button"
                                onClick={() => submoduleFileInputRef.current?.click()}
                                className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold"
                              >
                                Change Image
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => submoduleFileInputRef.current?.click()}
                              className="w-full p-4 glass-light border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 transition-all"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Upload Image</p>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Course 1 (Optional)</label>
                          <select
                            value={submoduleCourse1}
                            onChange={(e) => setSubmoduleCourse1(e.target.value)}
                            className="w-full px-4 py-3 glass-light border-2 border-gray-200 rounded-xl"
                          >
                            <option value="">No course selected</option>
                            {availableCourses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.title || course.name || 'Untitled Course'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {submoduleCourse1 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Course 2 (Optional)</label>
                            <select
                              value={submoduleCourse2}
                              onChange={(e) => setSubmoduleCourse2(e.target.value)}
                              className="w-full px-4 py-3 glass-light border-2 border-gray-200 rounded-xl"
                            >
                              <option value="">No second course</option>
                              {availableCourses
                                .filter(course => course.id !== submoduleCourse1)
                                .map((course) => (
                                  <option key={course.id} value={course.id}>
                                    {course.title || course.name || 'Untitled Course'}
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSubmoduleForm(false);
                              resetSubmoduleForm();
                            }}
                            className="flex-1 px-4 py-3 glass-light border-2 border-gray-300 text-gray-700 rounded-xl font-semibold"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddSubmodule}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
                          >
                            Add Submodule
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-4 sm:p-5 glass-light rounded-2xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        visible ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                          visible ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">Visible to Students</div>
                      <div className="text-xs sm:text-sm text-gray-500">Make this module available immediately</div>
                    </div>
                  </div>
                </>
              )}

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
                  className="w-full sm:flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Create {moduleType === 'main' ? 'Main Module' : 'Submodule'}
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
