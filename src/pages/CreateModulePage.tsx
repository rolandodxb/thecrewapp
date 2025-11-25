import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CreateModuleForm from '../components/CreateModuleForm';

export default function CreateModulePage() {
  const navigate = useNavigate();

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

      <CreateModuleForm
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
