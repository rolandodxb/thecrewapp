import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Shield, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductForm from '../components/marketplace/ProductForm';
import { createProduct, publishProduct, ProductFormData } from '../services/marketplaceService';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { currentUser } = useApp();

  const handleSubmit = async (data: ProductFormData) => {
    if (!currentUser) {
      alert('Please login to create products');
      navigate('/login');
      return;
    }

    // Check role permission
    if (currentUser.role !== 'mentor' && currentUser.role !== 'governor') {
      alert('Only Mentors and Governors can sell products');
      return;
    }

    try {
      const productId = await createProduct(
        currentUser.uid,
        currentUser.name || 'Anonymous',
        currentUser.email || '',
        currentUser.photoURL || undefined,
        data
      );

      alert('Product created and published successfully!');
      navigate(`/marketplace`);
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50">
          <Package className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please login to create products</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user has permission to sell
  if (currentUser.role !== 'mentor' && currentUser.role !== 'governor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-200/50 max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-yellow-800">
              Only <strong>Mentors</strong> and <strong>Governors</strong> can sell products in the marketplace.
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            You can still browse and purchase products from our marketplace.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg"
            >
              Browse Marketplace
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 px-6 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/marketplace')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>

          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Create New Product
          </h1>
          <p className="text-gray-600 mt-2">
            List your product on the marketplace and reach thousands of potential buyers
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/40 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 p-6 lg:p-8">
          <ProductForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/marketplace')}
            isEdit={false}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-blue-200/50 shadow-lg">
          <h3 className="font-semibold text-blue-900 mb-3">Tips for a successful listing:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Use high-quality images that showcase your product from multiple angles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Write a clear, detailed description that highlights key features and benefits</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Price competitively by researching similar products</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Use relevant tags to help buyers find your product</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>For digital products, ensure your download links are secure and accessible</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
