import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Camera, MapPin, Mail, Shield, Save, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import CVAnalyzer from '../components/CVAnalyzer';
import DeclareCrewButton from '../components/DeclareCrewButton';
import SubscriptionCancellation from '../components/SubscriptionCancellation';
import { ReputationDisplay } from '../components/ReputationDisplay';

export default function ProfilePage() {
  const { currentUser, setCurrentUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    country: currentUser?.country || '',
    bio: currentUser?.bio || '',
    photo_base64: currentUser?.photoURL || '',
  });

  if (!currentUser) return null;

  const getDisplayPhoto = () => {
    const photo = formData.photo_base64 || currentUser.photoURL;
    if (photo && photo.trim() !== '') {
      return photo;
    }
    return `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2260%22 dy=%2210.5rem%22 font-weight=%22bold%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22%3E${currentUser.name?.[0] || 'U'}%3C/text%3E%3C/svg%3E`;
  };

  const displayPhoto = getDisplayPhoto();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert('Image size should be less than 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, photo_base64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('CV file size should be less than 5MB');
      return;
    }

    setUploadingCV(true);
    try {
      console.log('Starting CV upload for user:', currentUser.uid);
      console.log('File details:', { name: file.name, type: file.type, size: file.size });

      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          console.log('File converted to base64');

          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            cvData: base64String,
            cvFileName: file.name,
            cvFileType: file.type,
            cvFileSize: file.size,
            cvUploadedAt: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          console.log('Firestore updated');

          setCurrentUser({
            ...currentUser,
            cvData: base64String,
            cvFileName: file.name,
          });

          alert('CV uploaded successfully!');
        } catch (error: any) {
          console.error('Error saving CV to Firestore:', error);
          alert('Failed to upload CV. Please try again.');
        } finally {
          setUploadingCV(false);
          if (cvInputRef.current) {
            cvInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
        alert('Failed to read file. Please try again.');
        setUploadingCV(false);
        if (cvInputRef.current) {
          cvInputRef.current.value = '';
        }
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error uploading CV:', error);
      alert('Failed to upload CV. Please try again.');
      setUploadingCV(false);
      if (cvInputRef.current) {
        cvInputRef.current.value = '';
      }
    }
  };

  const handleDeleteCV = async () => {
    if (!currentUser?.cvData || !window.confirm('Are you sure you want to delete your CV?')) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        cvData: null,
        cvFileName: null,
        cvFileType: null,
        cvFileSize: null,
        cvUploadedAt: null,
        updated_at: new Date().toISOString(),
      });

      setCurrentUser({
        ...currentUser,
        cvData: undefined,
        cvFileName: undefined,
      });

      alert('CV deleted successfully');
    } catch (error) {
      console.error('Error deleting CV:', error);
      alert('Failed to delete CV. Please try again.');
    }
  };

  const handleDownloadCV = () => {
    if (!currentUser?.cvData || !currentUser?.cvFileName) {
      alert('No CV available to download');
      return;
    }

    const link = document.createElement('a');
    link.href = currentUser.cvData;
    link.download = currentUser.cvFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        name: formData.name,
        country: formData.country,
        bio: formData.bio,
        photo_base64: formData.photo_base64,
        updated_at: new Date().toISOString(),
      });

      setCurrentUser({
        ...currentUser,
        name: formData.name,
        country: formData.country,
        bio: formData.bio,
        photoURL: formData.photo_base64,
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl shadow-lg p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                <img
                  src={displayPhoto}
                  alt={currentUser.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#EADBC8] shadow-lg"
                />
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 glass-bubble hover:glass-light text-gray-800 rounded-lg font-semibold transition text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Change Photo
                </button>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">
              {currentUser.name}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield
                className={`w-4 h-4 ${
                  currentUser.role === 'governor'
                    ? 'text-[#CBA135]'
                    : currentUser.role === 'mentor'
                    ? 'text-[#D71920]'
                    : 'text-gray-500'
                }`}
              />
              <span
                className={`text-sm font-bold capitalize ${
                  currentUser.role === 'governor'
                    ? 'text-[#CBA135]'
                    : currentUser.role === 'mentor'
                    ? 'text-[#D71920]'
                    : 'text-gray-600'
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="break-all">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{currentUser.country}</span>
              </div>
            </div>

            {currentUser.role === 'governor' && (
              <div className="mt-6 p-4 bg-gradient-to-r from-[#CBA135] to-[#B8941E] rounded-xl text-white">
                <p className="text-sm font-bold mb-1">Governor Status</p>
                <p className="text-xs opacity-90">Full system access granted</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Account Information</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: currentUser.name,
                        email: currentUser.email,
                        country: currentUser.country,
                        bio: currentUser.bio,
                        photo_base64: currentUser.photoURL,
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-xl font-bold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-[#D71920] to-[#B91518] text-white rounded-xl font-bold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition disabled:glass-light disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl glass-light text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition disabled:glass-light disabled:text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Membership Plan
                </label>
                <input
                  type="text"
                  value={currentUser.plan.toUpperCase()}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl glass-light text-gray-600 capitalize"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Role</label>
                <input
                  type="text"
                  value={currentUser.role}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl glass-light text-gray-600 capitalize"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Role can only be changed by a Governor
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Bio / About Me
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#D71920] focus:ring-2 focus:ring-[#D71920]/20 transition disabled:glass-light disabled:text-gray-600 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  CV / Resume
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload your CV in PDF, DOC, or DOCX format (max 5MB)
                </p>

                {currentUser.cvData ? (
                  <div className="flex items-center gap-3 p-4 glass-light rounded-xl border-2 border-gray-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#D71920] to-[#B91518] rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">
                        {currentUser.cvFileName || 'CV Uploaded'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Click download to view your CV
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadCV}
                        className="p-2 glass-card hover:glass-bubble rounded-lg border-2 border-gray-200 transition"
                        title="Download CV"
                      >
                        <Download className="w-5 h-5 text-gray-700" />
                      </button>
                      <button
                        onClick={handleDeleteCV}
                        className="p-2 glass-card hover:bg-red-50 rounded-lg border-2 border-gray-200 hover:border-red-300 transition"
                        title="Delete CV"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => cvInputRef.current?.click()}
                    disabled={uploadingCV}
                    className="w-full flex items-center justify-center gap-3 px-4 py-4 glass-light hover:glass-bubble border-2 border-dashed border-gray-300 hover:border-[#D71920] rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5 text-gray-600" />
                    <span className="font-bold text-gray-700">
                      {uploadingCV ? 'Uploading...' : 'Upload CV'}
                    </span>
                  </button>
                )}

                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleCVUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ReputationDisplay userId={currentUser.uid} isOwnProfile={true} />
      </div>

      {currentUser.role === 'student' && (
        <div className="mt-6">
          <div className="glass-card rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Graduation Status</h3>
            <DeclareCrewButton
              userId={currentUser.uid}
              isVerifiedCrew={currentUser.verifiedCrew || false}
              onSuccess={async () => {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                  setCurrentUser({ ...currentUser, verifiedCrew: true });
                }
              }}
            />
          </div>
        </div>
      )}

      {currentUser.cvUrl && (
        <div className="mt-6">
          <div className="glass-card rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">CV Analysis & ATS Converter</h3>
            <CVAnalyzer cvUrl={currentUser.cvUrl} userId={currentUser.uid} />
          </div>
        </div>
      )}

      {/* Subscription Management */}
      {currentUser.role === 'student' && (
        <div className="mt-6">
          <div className="glass-card rounded-2xl shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Subscription Management</h3>
            <SubscriptionCancellation
              userId={currentUser.uid}
              currentPlan={currentUser.plan}
              onCancel={() => {
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}