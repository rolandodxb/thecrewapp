import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { processProductImage } from '../../utils/imageProcessing';

interface ImageUploadMultipleProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizePerImageMB?: number;
}

export default function ImageUploadMultiple({
  images,
  onChange,
  maxImages = 5,
  maxSizePerImageMB = 5
}: ImageUploadMultipleProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setError('');

    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          setError('Only image files are allowed');
          continue;
        }

        const maxSizeBytes = maxSizePerImageMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          setError(`Each image must be less than ${maxSizePerImageMB}MB`);
          continue;
        }

        const processed = await processProductImage(file, true, 1200, 1200);
        newImages.push(processed.base64);
      }

      onChange([...images, ...newImages]);
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading || images.length >= maxImages}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300/50 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 bg-white/30 backdrop-blur-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              {uploading ? (
                'Processing images...'
              ) : images.length >= maxImages ? (
                `Maximum ${maxImages} images reached`
              ) : (
                <>
                  <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                  <br />
                  <span className="text-xs text-gray-500">
                    PNG, JPG, GIF up to {maxSizePerImageMB}MB ({images.length}/{maxImages})
                  </span>
                  <br />
                  <span className="text-xs text-blue-600">White backgrounds auto-removed</span>
                </>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-lg text-sm text-red-600 shadow-sm">
          {error}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
              >
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    Primary
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image Number */}
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                  {index + 1}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No images uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload at least one product image</p>
        </div>
      )}
    </div>
  );
}
