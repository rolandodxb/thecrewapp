import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NewCourseForm from '../components/NewCourseForm';

export default function CreateCoursePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get preselected IDs from navigation state
  const preselectedMainModuleId = location.state?.mainModuleId;
  const preselectedSubmoduleId = location.state?.submoduleId;
  const editingCourse = location.state?.course;

  const handleSuccess = () => {
    navigate(-1); // Go back to previous page
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen">
      <div className="glass-light border-b border-gray-200 px-6 py-4 mb-6">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </button>
      </div>

      <NewCourseForm
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        preselectedMainModuleId={preselectedMainModuleId}
        preselectedSubmoduleId={preselectedSubmoduleId}
        editingCourse={editingCourse}
      />
    </div>
  );
}
